import express from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listAdminProducts,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/products", listProducts);
router.get("/products/:slug", getProduct);

router.get("/admin/products", verifyToken, requireAdmin, listAdminProducts);
router.post("/admin/products", verifyToken, requireAdmin, createProduct);
router.put("/admin/products/:id", verifyToken, requireAdmin, updateProduct);
router.delete("/admin/products/:id", verifyToken, requireAdmin, deleteProduct);

export default router;
