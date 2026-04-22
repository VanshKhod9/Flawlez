import express from "express";
import {
  checkout,
  verifyPayment,
  getOrderById,
  recordPaymentFailure,
} from "../controllers/orderController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-order", verifyToken, checkout);
router.post("/checkout", verifyToken, checkout);
router.post("/verify-payment", verifyToken, verifyPayment);
router.post("/payment-failed", verifyToken, recordPaymentFailure);
router.get("/checkout-success/:orderId", verifyToken, getOrderById);

export default router;
