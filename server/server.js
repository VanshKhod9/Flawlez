import "./src/config/env.js";

const [{ default: express }, { default: cors }, { initializeTables }, { default: routes }, { razorpayWebhook }] =
  await Promise.all([
    import("express"),
    import("cors"),
    import("./src/config/database.js"),
    import("./src/routes/index.js"),
    import("./src/controllers/orderController.js"),
  ]);

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 0 ? true : allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize database tables
initializeTables();

// API routes
app.use("/api", routes);

app.use((error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Uploaded image is too large. Please use a smaller image.",
    });
  }

  return next(error);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
