import express from "express";
import {
  createCoupon,
  deleteCoupon,
  listAdminCoupons,
  updateCoupon,
} from "../controllers/couponController.js";
import { validateCoupon } from "../controllers/orderController.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/coupons/validate", verifyToken, validateCoupon);

router.get("/admin/coupons", verifyToken, requireAdmin, listAdminCoupons);
router.post("/admin/coupons", verifyToken, requireAdmin, createCoupon);
router.put("/admin/coupons/:id", verifyToken, requireAdmin, updateCoupon);
router.delete("/admin/coupons/:id", verifyToken, requireAdmin, deleteCoupon);

export default router;
