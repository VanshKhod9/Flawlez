import express from "express";
import { 
  getAccount, 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  changePassword,
  getSubscriptionStatus,
  subscribeEmail
} from "../controllers/accountController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/account", verifyToken, getAccount);
router.post("/account/address", verifyToken, addAddress);
router.put("/account/address/:id", verifyToken, updateAddress);
router.delete("/account/address/:id", verifyToken, deleteAddress);
router.post("/account/password", verifyToken, changePassword);
router.get("/subscription/status", verifyToken, getSubscriptionStatus);
router.post("/subscription", verifyToken, subscribeEmail);

export default router;