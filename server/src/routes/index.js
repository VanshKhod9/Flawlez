import express from "express";
import authRoutes from "./authRoutes.js";
import orderRoutes from "./orderRoutes.js";
import accountRoutes from "./accountRoutes.js";

const router = express.Router();

router.use("/", authRoutes);
router.use("/", orderRoutes);
router.use("/", accountRoutes);

export default router;