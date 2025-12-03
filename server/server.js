import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Wrapper for easier syntax compatibility
const db = {
  execute: async (sql, values) => {
    const result = await pool.query(sql, values);
    return [result.rows, result];
  },
};

console.log("✅ Connected to PostgreSQL Database");

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

if (razorpay) {
  console.log("✅ Razorpay initialized");
} else {
  console.log("⚠️  Razorpay not configured - set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for live payments");
}

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashedPassword,
    ]);

    res.json({ message: "User registered successfully", success: true });
  } catch (error) {
    console.error("Register error:", error.message, error.code);
    if (error.code === "23505") { // PostgreSQL unique constraint violation
      res.json({ message: "Username already exists", success: false });
    } else {
      res.status(500).json({ message: "Server error: " + error.message, success: false });
    }
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.execute("SELECT * FROM users WHERE username = $1", [username]);
    if (users.length === 0) return res.json({ message: "User not found" });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.json({ message: "Invalid password" });

    const token = jwt.sign(
      { username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      accessToken: token,
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/protected", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    res.json({ message: "Protected content", user });
  });
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token. Please login again." });
    }
    req.user = decoded;
    next();
  });
};

async function initializeTables() {
  try {
    // Create users table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create carts table
    

    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        order_data JSONB NOT NULL,
        shipping_address JSONB NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_provider VARCHAR(50) DEFAULT 'manual',
        provider_order_id VARCHAR(255) DEFAULT NULL,
        provider_payment_id VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create addresses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        label VARCHAR(100) DEFAULT 'Default',
        full_name VARCHAR(255) NOT NULL,
        line1 VARCHAR(255) NOT NULL,
        line2 VARCHAR(255) DEFAULT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_subscriptions (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("Error initializing tables:", error);
  }
}

initializeTables();

// Removed cart endpoints; cart is now client-side only

const parsePrice = (value) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

app.post("/api/checkout", verifyToken, async (req, res) => {
  try {
    const { cart, total, ...shippingAddress } = req.body;
    const username = req.user.username;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const sanitizedCart = cart.map((item) => ({
      ...item,
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      price: item.price,
    }));

    const calculatedTotal = sanitizedCart.reduce(
      (acc, item) => acc + parsePrice(item.price) * item.quantity,
      0
    );

    const parsedTotal = Number.parseFloat(total);
    const normalizedTotal =
      Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : calculatedTotal;

    const paymentProvider = razorpay ? "razorpay" : "simulation";
    const initialStatus = razorpay ? "pending_payment" : "completed";

    const [result] = await db.execute(
      "INSERT INTO orders (username, order_data, shipping_address, total, payment_status, payment_provider) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [
        username,
        JSON.stringify(sanitizedCart),
        JSON.stringify(shippingAddress),
        normalizedTotal.toFixed(2),
        initialStatus,
        paymentProvider,
      ]
    );

    const orderId = result[0].id;

    if (!razorpay) {
      return res.json({
        success: true,
        mode: "simulation",
        message: "Order placed successfully (payment simulation mode)",
        orderId,
      });
    }

    const amountInPaise = Math.max(1, Math.round(normalizedTotal * 100));
    const currency = process.env.RAZORPAY_CURRENCY || "INR";

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `order_${orderId}`,
      notes: {
        orderId: String(orderId),
        customer: username,
      },
    });

    await db.execute("UPDATE orders SET provider_order_id = $1 WHERE id = $2", [
      razorpayOrder.id,
      orderId,
    ]);

    res.json({
      success: true,
      mode: "razorpay",
      orderId,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      currency,
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
});

app.post("/api/verify-payment", verifyToken, async (req, res) => {
  if (!razorpay) {
    return res.status(400).json({
      message: "Razorpay not configured",
      success: false,
    });
  }

  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const username = req.user.username;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification data", success: false });
    }

    const [orders] = await db.execute(
      "SELECT * FROM orders WHERE id = $1 AND username = $2",
      [orderId, username]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found", success: false });
    }

    const order = orders[0];

    if (order.provider_order_id && order.provider_order_id !== razorpay_order_id) {
      return res.status(400).json({ message: "Mismatched order reference", success: false });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      await db.execute(
        "UPDATE orders SET payment_status = $1, provider_payment_id = $2 WHERE id = $3",
        ["failed", razorpay_payment_id, orderId]
      );
      return res.status(400).json({ message: "Invalid payment signature", success: false });
    }

    await db.execute(
      "UPDATE orders SET payment_status = $1, provider_payment_id = $2 WHERE id = $3",
      ["completed", razorpay_payment_id, orderId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
});

const formatOrder = (order) => {
  let items = [];
  let shipping = null;
  try {
    items = Array.isArray(order.order_data) ? order.order_data : JSON.parse(order.order_data || "[]");
  } catch {
    items = [];
  }
  try {
    shipping = typeof order.shipping_address === "object"
      ? order.shipping_address
      : JSON.parse(order.shipping_address || "{}");
  } catch {
    shipping = null;
  }

  return {
    id: order.id,
    total: Number(order.total),
    payment_status: order.payment_status,
    payment_provider: order.payment_provider,
    provider_order_id: order.provider_order_id,
    provider_payment_id: order.provider_payment_id,
    created_at: order.created_at,
    items,
    shipping_address: shipping,
  };
};

const sanitizeAddressInput = (body) => ({
  label: body.label || "Default",
  full_name: body.full_name?.trim() || "",
  line1: body.line1?.trim() || "",
  line2: body.line2?.trim() || "",
  city: body.city?.trim() || "",
  state: body.state?.trim() || "",
  postal_code: body.postal_code?.trim() || "",
  country: body.country?.trim() || "",
  phone: body.phone?.trim() || "",
});

const validateAddress = (address) => {
  const required = ["full_name", "line1", "city", "state", "postal_code", "country"];
  return required.every((field) => address[field] && address[field].length > 0);
};

app.get("/api/account", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;

    const [addresses] = await db.execute(
      "SELECT id, label, full_name, line1, line2, city, state, postal_code, country, phone, created_at FROM addresses WHERE username = $1 ORDER BY created_at DESC",
      [username]
    );

    const [orders] = await db.execute(
      "SELECT id, order_data, shipping_address, total, payment_status, payment_provider, provider_order_id, provider_payment_id, created_at FROM orders WHERE username = $1 ORDER BY created_at DESC",
      [username]
    );

    res.json({
      user: {
        username,
      },
      addresses,
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    console.error("Error fetching account data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/subscription/status", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const [rows] = await db.execute(
      "SELECT email, subscribed_at FROM email_subscriptions WHERE username = $1",
      [username]
    );
    if (rows.length > 0) {
      return res.json({ subscribed: true, email: rows[0].email, subscribedAt: rows[0].subscribed_at });
    }
    res.json({ subscribed: false });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/subscription", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    const [existing] = await db.execute(
      "SELECT id FROM email_subscriptions WHERE username = $1",
      [username]
    );
    if (existing.length > 0) {
      await db.execute(
        "UPDATE email_subscriptions SET email = $1, subscribed_at = CURRENT_TIMESTAMP WHERE username = $2",
        [email, username]
      );
      return res.json({ success: true, message: "Subscription updated" });
    }
    await db.execute(
      "INSERT INTO email_subscriptions (username, email) VALUES ($1, $2)",
      [username, email]
    );
    res.json({ success: true, message: "Successfully subscribed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/account/address", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const address = sanitizeAddressInput(req.body || {});

    if (!validateAddress(address)) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    const [result] = await db.execute(
      `INSERT INTO addresses (username, label, full_name, line1, line2, city, state, postal_code, country, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        username,
        address.label,
        address.full_name,
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
        address.phone,
      ]
    );

    res.json({
      success: true,
      address: { id: result[0].id, ...address },
    });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/account/address/:id", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const addressId = Number(req.params.id);
    if (!addressId) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    const [existing] = await db.execute("SELECT id FROM addresses WHERE id = $1 AND username = $2", [
      addressId,
      username,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    const address = sanitizeAddressInput(req.body || {});

    if (!validateAddress(address)) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    await db.execute(
      `UPDATE addresses SET label = $1, full_name = $2, line1 = $3, line2 = $4, city = $5, state = $6, postal_code = $7, country = $8, phone = $9 WHERE id = $10 AND username = $11`,
      [
        address.label,
        address.full_name,
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
        address.phone,
        addressId,
        username,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/account/address/:id", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const addressId = Number(req.params.id);
    if (!addressId) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    await db.execute("DELETE FROM addresses WHERE id = $1 AND username = $2", [addressId, username]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/account/password", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing password fields" });
    }

    const [users] = await db.execute("SELECT password FROM users WHERE username = $1", [username]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password = $1 WHERE username = $2", [hashedPassword, username]);

    res.json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/checkout-success/:orderId", verifyToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const username = req.user.username;

    const [orders] = await db.execute(
      "SELECT * FROM orders WHERE id = $1 AND username = $2",
      [orderId, username]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order: orders[0] });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
