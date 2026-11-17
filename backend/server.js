const path = require("node:path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { connectDB, getDbStatus } = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount Authentication Routes
app.use("/api/auth", authRoutes);

// Health route
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "UPBMS Authentication Service",
    timestamp: new Date().toISOString(),
    db: getDbStatus(),
  });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ ok: false, error: err.message || "Internal server error" });
});

// Attempt database connection (does not crash if MONGODB_URI is absent)
connectDB();

if (require.main === module) {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 UPBMS Authentication server running on http://127.0.0.1:${PORT}`);
    console.log(`📧 Official Gmail Sender: ${process.env.GMAIL_USER || "upbmsofficial@gmail.com"}`);
    console.log(`ℹ️  MongoDB Atlas status: ${process.env.MONGODB_URI ? "Configured" : "Awaiting MONGODB_URI"}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️  Port ${PORT} is busy. The server may already be running.`);
    } else {
      console.error("Server listen error:", err.message);
    }
  });
}

module.exports = app;
