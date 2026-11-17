const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");
const { isDbConnected } = require("../config/db");
const { sendEmail, isGmailConfigured } = require("../utils/sendEmail");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Controller to handle sending OTP to user's email.
 * Route: POST /api/auth/send-otp
 */
async function sendOtp(req, res) {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Guard: Check MongoDB connection
    if (!isDbConnected()) {
      return res.status(503).json({
        ok: false,
        error: "Database is not connected. Please add your MongoDB Atlas connection string to MONGODB_URI in backend/.env to activate authentication.",
        dbConnected: false,
        configKey: "MONGODB_URI",
      });
    }

    // 2. Guard: Check Resend Cooldown (60 seconds)
    const existingOtp = await OTP.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (existingOtp) {
      const elapsedMs = Date.now() - existingOtp.createdAt.getTime();
      const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return res.status(429).json({
          ok: false,
          error: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
          cooldownRemaining: remainingSeconds,
        });
      }
    }

    // 3. Guard: Check Gmail Configuration
    if (!isGmailConfigured()) {
      return res.status(503).json({
        ok: false,
        error: "Official Gmail sender is waiting for configuration. Please set GMAIL_APP_PASSWORD in backend/.env to deliver OTPs.",
        gmailConfigured: false,
        configKey: "GMAIL_APP_PASSWORD",
      });
    }

    // 4. Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // 5. Hash OTP before storing in MongoDB
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // 6. Remove previous OTPs for this email and save the new hashed OTP
    await OTP.deleteMany({ email: normalizedEmail });

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await OTP.create({
      email: normalizedEmail,
      otpHash,
      attempts: 0,
      expiresAt,
    });

    // 7. Dispatch Email via Nodemailer (Official Gmail account)
    await sendEmail({
      to: normalizedEmail,
      otp: rawOtp,
      expiresMinutes: OTP_EXPIRY_MINUTES,
    });

    return res.status(200).json({
      ok: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      email: normalizedEmail,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      expiresMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to send OTP. Please try again later.",
    });
  }
}

/**
 * Controller to verify OTP and authenticate or register the user.
 * Route: POST /api/auth/verify-otp
 */
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {};

    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid email address.",
      });
    }

    if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid 6-digit verification code.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 1. Guard: Check MongoDB connection
    if (!isDbConnected()) {
      return res.status(503).json({
        ok: false,
        error: "Database is not connected. Please add your MongoDB Atlas connection string to MONGODB_URI in backend/.env to complete verification.",
        dbConnected: false,
        configKey: "MONGODB_URI",
      });
    }

    // 2. Fetch active OTP record
    const otpRecord = await OTP.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        ok: false,
        error: "No active verification code found for this email. Please request a new OTP.",
      });
    }

    // 3. Check expiration
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        ok: false,
        error: "Your verification code has expired. Please request a new OTP.",
      });
    }

    // 4. Check attempts limit
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        ok: false,
        error: "Too many incorrect attempts. For security, this OTP has been invalidated. Please request a new code.",
      });
    }

    // 5. Compare submitted OTP against stored bcrypt hash
    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remainingAttempts = MAX_OTP_ATTEMPTS - otpRecord.attempts;

      return res.status(400).json({
        ok: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
        remainingAttempts,
      });
    }

    // 6. Valid OTP -> Clean up OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // 7. Find existing user or automatically register new user
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      // Auto-register new user
      const defaultName = normalizedEmail.split("@")[0];
      user = await User.create({
        email: normalizedEmail,
        name: defaultName,
        role: "user",
        level: 3,
        isEmailVerified: true,
        lastLogin: new Date(),
      });
      isNewUser = true;
    } else {
      user.lastLogin = new Date();
      user.isEmailVerified = true;
      await user.save();
    }

    // 8. Sign JWT Token (7-day validity)
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      level: user.level,
      memberId: user.memberId || "",
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    // 9. Set HTTP-Only Secure Cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;

    return res.status(200).json({
      ok: true,
      message: isNewUser
        ? "Registration successful! Welcome to UPBMS."
        : "Login successful! Welcome back.",
      token, // Also return in body for clients preferring Authorization headers
      user: safeUser,
      isNewUser,
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Verification failed. Please try again.",
    });
  }
}

/**
 * Controller to fetch currently authenticated user.
 * Route: GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      user: req.user,
      dbConnected: isDbConnected(),
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to retrieve user session.",
    });
  }
}

/**
 * Controller to log out user and clear authentication cookie.
 * Route: POST /api/auth/logout
 */
async function logout(_req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
    });
    return res.status(200).json({
      ok: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({
      ok: false,
      error: "Logout failed.",
    });
  }
}

/**
 * Controller to return system auth readiness status.
 * Route: GET /api/auth/status
 */
async function getStatus(_req, res) {
  return res.status(200).json({
    ok: true,
    authMethod: "email-otp",
    database: {
      connected: isDbConnected(),
      variable: "MONGODB_URI",
      hasUri: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
    },
    gmail: {
      configured: isGmailConfigured(),
      sender: process.env.GMAIL_USER || "upbmsofficial@gmail.com",
    },
  });
}

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  logout,
  getStatus,
};
