import express from "express";
import { submitBulkInquiry } from "../controllers/bulkController.js";

const router = express.Router();

router.post("/bulk-inquiry", submitBulkInquiry);

export default router;
