import express from "express";
import jwt from "jsonwebtoken";
import { getReviews, addReview, updateReview, deleteReview } from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/reviews", (req, res, next) => {
  // Add optional auth for ownership check
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token for public route
    }
  }
  next();
}, getReviews);
router.post("/reviews", verifyToken, addReview);
router.put("/reviews/:id", verifyToken, updateReview);
router.delete("/reviews/:id", verifyToken, deleteReview);

export default router;