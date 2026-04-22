import express from "express";
import {
  getAdminOverview,
  listAdminOrders,
  listAdminUsers,
  updateAdminOrder,
  updateAdminUser,
} from "../controllers/adminController.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get("/admin/overview", getAdminOverview);
router.get("/admin/orders", listAdminOrders);
router.patch("/admin/orders/:id", updateAdminOrder);
router.get("/admin/users", listAdminUsers);
router.patch("/admin/users/:username", updateAdminUser);

export default router;
