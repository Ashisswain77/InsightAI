const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");
const lockerRoutes = require("./routes/locker");

const app = express();

// ─── CORS ──────────────────────────────────────────────────────
// Restrict to allowed origins instead of allowing all.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ─── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/locker", lockerRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Global error handler ──────────────────────────────────────
// Catches unhandled errors and returns a consistent JSON response
// instead of Express's default HTML error page.
app.use((err, req, res, _next) => {
  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS: origin not allowed" });
  }

  console.error("Unhandled server error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

// ─── Connect to MongoDB and start server ───────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
