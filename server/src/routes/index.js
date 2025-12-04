import express from "express";
import authRoutes from "./authRoutes.js";
import orderRoutes from "./orderRoutes.js";
import accountRoutes from "./accountRoutes.js";
import reviewRoutes from "./reviewRoutes.js";

const router = express.Router();

router.use("/", authRoutes);
router.use("/", orderRoutes);
router.use("/", accountRoutes);
router.use("/", reviewRoutes);

export default router;