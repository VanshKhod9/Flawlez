import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log("✅ Connected to MySQL Database");


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
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);

    res.json({ message: "User registered successfully" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      res.json({ message: "Username already exists" });
    } else {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) return res.json({ message: "User not found" });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.json({ message: "Invalid password" });

    const token = jwt.sign(
      { username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" } // valid for 1 hour
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
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};


async function initializeTables() {
  try {
    // Create carts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        cart_data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_cart (username)
      )
    `);

    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        order_data JSON NOT NULL,
        shipping_address JSON NOT NULL,
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
        id INT AUTO_INCREMENT PRIMARY KEY,
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

    const alterStatements = [
      "ALTER TABLE orders ADD COLUMN payment_provider VARCHAR(50) DEFAULT 'manual' AFTER payment_status",
      "ALTER TABLE orders ADD COLUMN provider_order_id VARCHAR(255) DEFAULT NULL AFTER payment_provider",
      "ALTER TABLE orders ADD COLUMN provider_payment_id VARCHAR(255) DEFAULT NULL AFTER provider_order_id",
    ];

    for (const statement of alterStatements) {
      try {
        await db.execute(statement);
      } catch (error) {
        if (error.code !== "ER_DUP_FIELDNAME") {
          console.error("Error ensuring orders table columns:", error.message || error);
        }
      }
    }

    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("Error initializing tables:", error);
  }
}

initializeTables();

app.post("/api/cart", verifyToken, async (req, res) => {
  try {
    const { cart } = req.body;
    const username = req.user.username;

    await db.execute(
      "INSERT INTO carts (username, cart_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE cart_data = ?, updated_at = CURRENT_TIMESTAMP",
      [username, JSON.stringify(cart), JSON.stringify(cart)]
    );

    res.json({ message: "Cart saved successfully" });
  } catch (error) {
    console.error("Error saving cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/cart", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const [rows] = await db.execute("SELECT cart_data FROM carts WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.json({ cart: [] });
    }

    const cart = JSON.parse(rows[0].cart_data);
    res.json({ cart });
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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
      "INSERT INTO orders (username, order_data, shipping_address, total, payment_status, payment_provider) VALUES (?, ?, ?, ?, ?, ?)",
      [
        username,
        JSON.stringify(sanitizedCart),
        JSON.stringify(shippingAddress),
        normalizedTotal.toFixed(2),
        initialStatus,
        paymentProvider,
      ]
    );

    const orderId = result.insertId;

    if (!razorpay) {
      await db.execute("DELETE FROM carts WHERE username = ?", [username]);
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

    await db.execute("UPDATE orders SET provider_order_id = ? WHERE id = ?", [
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
      "SELECT * FROM orders WHERE id = ? AND username = ?",
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
        "UPDATE orders SET payment_status = ?, provider_payment_id = ? WHERE id = ?",
        ["failed", razorpay_payment_id, orderId]
      );
      return res.status(400).json({ message: "Invalid payment signature", success: false });
    }

    await db.execute(
      "UPDATE orders SET payment_status = ?, provider_payment_id = ? WHERE id = ?",
      ["completed", razorpay_payment_id, orderId]
    );

    await db.execute("DELETE FROM carts WHERE username = ?", [username]);

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
      "SELECT id, label, full_name, line1, line2, city, state, postal_code, country, phone, created_at FROM addresses WHERE username = ? ORDER BY created_at DESC",
      [username]
    );

    const [orders] = await db.execute(
      "SELECT id, order_data, shipping_address, total, payment_status, payment_provider, provider_order_id, provider_payment_id, created_at FROM orders WHERE username = ? ORDER BY created_at DESC",
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


app.post("/api/account/address", verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    const address = sanitizeAddressInput(req.body || {});

    if (!validateAddress(address)) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    const [result] = await db.execute(
      `INSERT INTO addresses (username, label, full_name, line1, line2, city, state, postal_code, country, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      address: { id: result.insertId, ...address },
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

    const [existing] = await db.execute("SELECT id FROM addresses WHERE id = ? AND username = ?", [
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
      `UPDATE addresses SET label = ?, full_name = ?, line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ? WHERE id = ? AND username = ?`,
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

    await db.execute("DELETE FROM addresses WHERE id = ? AND username = ?", [addressId, username]);
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

    const [users] = await db.execute("SELECT password FROM users WHERE username = ?", [username]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, username]);

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
      "SELECT * FROM orders WHERE id = ? AND username = ?",
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
