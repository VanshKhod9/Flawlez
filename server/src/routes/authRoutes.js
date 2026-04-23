import express from "express";
import {
  register,
  completeRegister,
  login,
  completeLogin,
  googleAuthenticate,
  getProtected,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/register/complete", completeRegister);
router.post("/login", login);
router.post("/login/complete", completeLogin);
router.post("/google", googleAuthenticate);
router.get("/protected", verifyToken, getProtected);

export default router;
