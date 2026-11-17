const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  sendOtp,
  verifyOtp,
  getMe,
  logout,
  getStatus,
} = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { isGmailConfigured } = require("../utils/sendEmail");
const { isGoogleAuthConfigured, verifyGoogleIdToken } = require("../src/services/googleAuthService");

const router = express.Router();

// 1. Rate limiter for sending OTP: max 10 requests per 15 minutes per IP
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many OTP requests from this IP. Please try again after 15 minutes.",
  },
});

// 2. Rate limiter for verifying OTP: max 20 attempts per 15 minutes per IP
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many verification attempts from this IP. Please wait before trying again.",
  },
});

// Core Email OTP Authentication endpoints
router.post("/send-otp", sendOtpLimiter, sendOtp);
router.post("/verify-otp", verifyOtpLimiter, verifyOtp);
router.get("/me", authenticateUser, getMe);
router.post("/logout", logout);
router.get("/status", getStatus);

// Auth configuration endpoint
router.get("/config", (_req, res) => {
  res.json({
    ok: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    isGoogleAuthConfigured: isGoogleAuthConfigured(),
    isGmailConfigured: isGmailConfigured(),
    authMethod: "email-otp",
  });
});

module.exports = router;
