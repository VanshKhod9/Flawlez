import crypto from "crypto";
import prisma from "../config/prisma.js";
import { razorpay, parsePrice } from "../utils/payment.js";

export const checkout = async (req, res) => {
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

    const order = await prisma.order.create({
      data: {
        username,
        orderData: sanitizedCart,
        shippingAddress,
        total: normalizedTotal,
        paymentStatus: initialStatus,
        paymentProvider,
      },
    });

    const orderId = order.id;

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

    await prisma.order.update({
      where: { id: orderId },
      data: { providerOrderId: razorpayOrder.id },
    });

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
};

export const verifyPayment = async (req, res) => {
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
      return res.status(400).json({
        message: "Missing payment verification data",
        success: false,
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
        success: false,
      });
    }

    await prisma.order.update({
      where: {
        id: orderId,
        username,
      },
      data: {
        paymentStatus: "completed",
        providerPaymentId: razorpay_payment_id,
      },
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      orderId,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};