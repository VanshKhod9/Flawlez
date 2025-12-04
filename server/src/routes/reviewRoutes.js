import express from "express";
import { getReviews, addReview, updateReview, deleteReview } from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/reviews", getReviews);
router.post("/reviews", verifyToken, addReview);
router.put("/reviews/:id", verifyToken, updateReview);
router.delete("/reviews/:id", verifyToken, deleteReview);

export default router;