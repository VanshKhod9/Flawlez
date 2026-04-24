import express from "express";
import authRoutes from "./authRoutes.js";
import orderRoutes from "./orderRoutes.js";
import accountRoutes from "./accountRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import productRoutes from "./productRoutes.js";
import adminRoutes from "./adminRoutes.js";
import couponRoutes from "./couponRoutes.js";
import bulkRoutes from "./bulkRoutes.js";

const router = express.Router();

router.use("/", authRoutes);
router.use("/", orderRoutes);
router.use("/", accountRoutes);
router.use("/", reviewRoutes);
router.use("/", productRoutes);
router.use("/", couponRoutes);
router.use("/", bulkRoutes);
router.use("/", adminRoutes);

export default router;
