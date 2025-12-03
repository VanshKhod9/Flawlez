import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeTables } from "./src/config/database.js";
import routes from "./src/routes/index.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

app.use(express.json());

// Initialize database tables
initializeTables();

// API routes
app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});