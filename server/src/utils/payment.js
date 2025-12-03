import Razorpay from "razorpay";

export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

export const parsePrice = (value) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

if (razorpay) {
  console.log("✅ Razorpay initialized");
} else {
  console.log("⚠️  Razorpay not configured - set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for live payments");
}