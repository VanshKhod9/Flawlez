import express from "express";
import { register, login, getProtected } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/protected", verifyToken, getProtected);

export default router;