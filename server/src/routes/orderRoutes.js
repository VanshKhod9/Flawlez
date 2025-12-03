import express from "express";
import { checkout, verifyPayment } from "../controllers/orderController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/checkout", verifyToken, checkout);
router.post("/verify-payment", verifyToken, verifyPayment);

export default router;