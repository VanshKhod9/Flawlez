import prisma from "../config/prisma.js";

const serializeCoupon = (coupon) => ({
  ...coupon,
  value: Number(coupon.value),
  minOrderValue: Number(coupon.minOrderValue || 0),
  maxDiscount: coupon.maxDiscount == null ? null : Number(coupon.maxDiscount),
});

const buildCouponData = (payload) => ({
  code: String(payload.code || "")
    .trim()
    .toUpperCase(),
  description: String(payload.description || "").trim() || null,
  type: String(payload.type || "").trim().toLowerCase(),
  value: Number(payload.value),
  minOrderValue: Number(payload.minOrderValue || 0),
  maxDiscount:
    payload.maxDiscount === "" || payload.maxDiscount == null ? null : Number(payload.maxDiscount),
  usageLimit:
    payload.usageLimit === "" || payload.usageLimit == null ? null : Number(payload.usageLimit),
  isActive: payload.isActive !== false,
  startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
  expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
});

const validateCouponData = (coupon) => {
  if (!coupon.code || !coupon.type || !["percentage", "flat"].includes(coupon.type)) {
    return "Coupon code and valid type are required.";
  }

  if (!Number.isFinite(coupon.value) || coupon.value <= 0) {
    return "Coupon value must be greater than 0.";
  }

  return null;
};

export const listAdminCoupons = async (_req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, coupons: coupons.map(serializeCoupon) });
  } catch (error) {
    console.error("List coupons error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const data = buildCouponData(req.body);
    const validationError = validateCouponData(data);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const coupon = await prisma.coupon.create({ data });
    res.status(201).json({ success: true, coupon: serializeCoupon(coupon) });
  } catch (error) {
    console.error("Create coupon error:", error);
    const message = error.code === "P2002" ? "Coupon code already exists." : "Server error";
    res.status(message === "Server error" ? 500 : 400).json({ success: false, message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    const data = buildCouponData(req.body);
    const validationError = validateCouponData(data);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data,
    });

    res.json({ success: true, coupon: serializeCoupon(updated) });
  } catch (error) {
    console.error("Update coupon error:", error);
    const message = error.code === "P2002" ? "Coupon code already exists." : "Server error";
    res.status(message === "Server error" ? 500 : 400).json({ success: false, message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
