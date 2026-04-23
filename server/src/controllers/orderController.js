import prisma from "../config/prisma.js";
import {
  parsePrice,
  getRazorpayClient,
  verifyRazorpaySignature,
  verifyWebhookSignature,
} from "../utils/payment.js";

const requiredShippingFields = [
  "fullName",
  "email",
  "mobileNumber",
  "address",
  "city",
  "state",
  "zipCode",
  "country",
];

const roundCurrency = (value) => Number(Number(value).toFixed(2));

const normalizeOrderResponse = (order) => ({
  ...order,
  subtotal: Number(order.subtotal ?? 0),
  discountAmount: Number(order.discountAmount ?? 0),
  total: Number(order.total),
  orderData: Array.isArray(order.orderData) ? order.orderData : [],
});

const validateShipping = (shippingAddress) =>
  requiredShippingFields.find((field) => !String(shippingAddress[field] || "").trim());

const normalizeCartItems = async (cart) => {
  const numericIds = [];
  const slugs = [];

  for (const item of cart) {
    const rawId = item.productId ?? item.slug ?? item.id;
    if (rawId == null) continue;

    if (/^\d+$/.test(String(rawId))) {
      numericIds.push(Number(rawId));
    } else {
      slugs.push(String(rawId));
    }
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        numericIds.length > 0 ? { id: { in: numericIds } } : undefined,
        slugs.length > 0 ? { slug: { in: slugs } } : undefined,
      ].filter(Boolean),
    },
  });

  const byId = new Map(products.map((product) => [String(product.id), product]));
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return cart.map((item) => {
    const rawId = String(item.productId ?? item.slug ?? item.id ?? "");
    const product = bySlug.get(rawId) || byId.get(rawId);

    if (!product) {
      throw new Error(`Product unavailable: ${item.name || rawId}`);
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);
    const selectedWeight = String(item.selectedWeight || item.selectedSize || product.weight || "").trim();
    const selectedGrind = item.selectedGrind || "Whole Bean";
    const selectedGrindKey = selectedGrind.replace(/\s+/g, "-").toLowerCase();
    const unitPrice = roundCurrency(parsePrice(product.price));

    if (product.stock < quantity) {
      throw new Error(`${product.name} is out of stock for the selected quantity.`);
    }

    const lineDescription = [product.shortDescription, selectedWeight, selectedGrind]
      .filter(Boolean)
      .join(" • ");

    return {
      id: `${product.id}-${selectedGrindKey}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      description: item.description || lineDescription,
      price: unitPrice,
      unitPrice,
      image: item.image || product.image,
      quantity,
      weight: String(product.weight || selectedWeight || "").trim() || null,
      selectedWeight: selectedWeight || null,
      selectedGrind,
      lineTotal: roundCurrency(unitPrice * quantity),
    };
  });
};

const loadCoupon = async (couponCode, subtotal) => {
  if (!couponCode) {
    return { coupon: null, discountAmount: 0, appliedCode: null };
  }

  const code = String(couponCode || "").trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive) {
    throw new Error("Coupon is invalid or inactive.");
  }

  const now = new Date();

  if (coupon.startsAt && coupon.startsAt > now) {
    throw new Error("Coupon is not active yet.");
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new Error("Coupon has expired.");
  }

  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached.");
  }

  if (subtotal < Number(coupon.minOrderValue || 0)) {
    throw new Error(`Coupon requires a minimum order of ₹${Number(coupon.minOrderValue).toFixed(2)}.`);
  }

  let discountAmount = 0;

  if (coupon.type === "percentage") {
    discountAmount = roundCurrency((subtotal * Number(coupon.value)) / 100);
    if (coupon.maxDiscount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else {
    discountAmount = Math.min(subtotal, Number(coupon.value));
  }

  return {
    coupon,
    discountAmount,
    appliedCode: code,
  };
};

const markOrderPaid = async ({ order, paymentId, paymentStatus = "paid" }) => {
  if (order.paymentStatus === "paid") {
    return order;
  }

  return prisma.$transaction(async (tx) => {
    for (const item of order.orderData) {
      const product = await tx.product.findUnique({
        where: { id: Number(item.productId) },
      });

      if (!product) {
        throw new Error(`Product missing during stock reconciliation: ${item.name}`);
      }

      if (product.stock < Number(item.quantity)) {
        throw new Error(`Insufficient stock for ${product.name}.`);
      }

      await tx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - Number(item.quantity) },
      });
    }

    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usageCount: { increment: 1 } },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        providerPaymentId: paymentId || order.providerPaymentId,
        paymentError: null,
      },
    });
  });
};

export const checkout = async (req, res) => {
  const razorpay = getRazorpayClient();

  if (!razorpay) {
    return res.status(503).json({
      success: false,
      message: "Razorpay is not configured. Add live payment credentials before checkout.",
    });
  }

  try {
    const { cart, couponCode, ...shippingAddress } = req.body;
    const username = req.user.username;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty.", success: false });
    }

    const missingField = validateShipping(shippingAddress);
    if (missingField) {
      return res.status(400).json({
        message: `Missing shipping field: ${missingField}`,
        success: false,
      });
    }

    const sanitizedCart = await normalizeCartItems(cart);
    const subtotal = roundCurrency(
      sanitizedCart.reduce((sum, item) => sum + Number(item.lineTotal), 0)
    );
    const { coupon, discountAmount, appliedCode } = await loadCoupon(couponCode, subtotal);
    const total = roundCurrency(Math.max(0, subtotal - discountAmount));
    const orderAmountPaise = Math.max(100, Math.round(total * 100));

    if (!Number.isFinite(orderAmountPaise) || orderAmountPaise < 100) {
      return res.status(400).json({
        success: false,
        message: "Order amount must be at least 100 paise.",
      });
    }

    const order = await prisma.order.create({
      data: {
        username,
        orderData: sanitizedCart,
        shippingAddress,
        subtotal,
        discountAmount,
        total,
        couponCode: appliedCode,
        paymentStatus: "pending",
        fulfillmentStatus: "processing",
        paymentProvider: "razorpay",
      },
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: orderAmountPaise,
      currency: "INR",
      receipt: `flawlez_${order.id}`,
      notes: {
        orderId: String(order.id),
        customer: username,
        couponCode: appliedCode || "",
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { providerOrderId: razorpayOrder.id },
    });

    res.json({
      success: true,
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrder,
      pricing: {
        subtotal,
        discountAmount,
        total,
      },
      coupon: coupon
        ? {
            code: appliedCode,
            description: coupon.description,
            discountAmount,
          }
        : null,
    });
  } catch (error) {
    const status =
      error?.statusCode === 401
        ? 401
        : /coupon|stock|Product unavailable|Missing shipping field/i.test(error.message)
          ? 400
          : 500;
    const message =
      error?.statusCode === 401
        ? "Razorpay authentication failed. Check your API key and secret."
        : error.message || "Server error";
    console.error("Checkout error:", error);
    res.status(status).json({ message, success: false });
  }
};

export const verifyPayment = async (req, res) => {
  const razorpay = getRazorpayClient();

  if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: "Razorpay not configured.", success: false });
  }

  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const username = req.user.username;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required Razorpay verification fields.",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: Number(orderId),
        username,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found.", success: false });
    }

    if (order.providerOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: "Payment order mismatch.", success: false });
    }

    const signatureOk = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret: process.env.RAZORPAY_KEY_SECRET,
    });

    if (!signatureOk) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "failed",
          paymentError: "Signature verification failed",
        },
      });

      return res.status(400).json({ message: "Payment verification failed.", success: false });
    }

    const updatedOrder = await markOrderPaid({
      order,
      paymentId: razorpay_payment_id,
    });

    res.json({ success: true, message: "Payment verified.", orderId: updatedOrder.id });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const recordPaymentFailure = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const username = req.user.username;

    const order = await prisma.order.findFirst({
      where: { id: Number(orderId), username },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "failed",
        paymentError: String(reason || "Payment failed"),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Record payment failure error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { couponCode, cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    const sanitizedCart = await normalizeCartItems(cart);
    const subtotal = roundCurrency(
      sanitizedCart.reduce((sum, item) => sum + Number(item.lineTotal), 0)
    );
    const { coupon, discountAmount, appliedCode } = await loadCoupon(couponCode, subtotal);

    res.json({
      success: true,
      coupon: {
        code: appliedCode,
        description: coupon.description,
        discountAmount,
      },
      pricing: {
        subtotal,
        discountAmount,
        total: roundCurrency(Math.max(0, subtotal - discountAmount)),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Invalid coupon." });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(204).end();
    }

    const signature = req.headers["x-razorpay-signature"];
    const body = req.body.toString("utf8");

    const valid = verifyWebhookSignature({
      body,
      signature,
      secret: webhookSecret,
    });

    if (!valid) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    const event = JSON.parse(body);
    const paymentEntity = event.payload?.payment?.entity;
    const providerOrderId = paymentEntity?.order_id;

    if (!providerOrderId) {
      return res.status(200).json({ success: true });
    }

    const order = await prisma.order.findFirst({
      where: { providerOrderId },
    });

    if (!order) {
      return res.status(200).json({ success: true });
    }

    if (event.event === "payment.captured" || event.event === "payment.authorized") {
      await markOrderPaid({
        order,
        paymentId: paymentEntity.id,
      });
    }

    if (event.event === "payment.failed") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "failed",
          paymentError: paymentEntity.error_description || "Payment failed",
        },
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const username = req.user.username;

    const order = await prisma.order.findFirst({
      where: { id: orderId, username },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found.", success: false });
    }

    res.json({ success: true, order: normalizeOrderResponse(order) });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
