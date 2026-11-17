const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { isDbConnected } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "upbms_jwt_secret_production_ready_key_2026";

/**
 * Middleware to authenticate requests via HTTP-Only cookie or Authorization Bearer header.
 */
async function authenticateUser(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first
    if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
      token = req.cookies.token || req.cookies.jwt;
    }

    // 2. Fallback to Authorization Header (Bearer token)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Authentication required. Please log in.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          ok: false,
          error: "Your session has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        ok: false,
        error: "Invalid authentication token. Please log in again.",
      });
    }

    // If MongoDB is connected, load user from DB
    if (isDbConnected() && decoded.id) {
      const user = await User.findById(decoded.id).select("-__v");
      if (!user) {
        return res.status(401).json({
          ok: false,
          error: "User account not found. Please log in again.",
        });
      }
      req.user = user.toSafeObject ? user.toSafeObject() : user;
    } else {
      // Attached decoded token if DB not connected
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || "user",
        level: decoded.level || 3,
        memberId: decoded.memberId || "",
        isEmailVerified: true,
      };
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      ok: false,
      error: "Authentication error. Please try again.",
    });
  }
}

module.exports = {
  authenticateUser,
  JWT_SECRET,
};
