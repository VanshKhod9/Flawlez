import "../config/env.js";
import Razorpay from "razorpay";
import crypto from "crypto";

let cachedClient = null;
let cachedConfigKey = "";

export const getRazorpayClient = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keyId || !keySecret) {
    return null;
  }

  const configKey = `${keyId}:${keySecret}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  cachedClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  cachedConfigKey = configKey;

  return cachedClient;
};

export const parsePrice = (value) => {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && typeof value.toString === "function") {
    const numeric = parseFloat(value.toString());
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  if (typeof value === "string") {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature, secret }) =>
  crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex") === signature;

export const verifyWebhookSignature = ({ body, signature, secret }) =>
  crypto.createHmac("sha256", secret).update(body).digest("hex") === signature;
