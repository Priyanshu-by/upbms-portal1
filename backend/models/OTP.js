const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: [true, "Hashed OTP is required"],
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, "Maximum verification attempts exceeded"],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup when expiresAt timestamp arrives
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// Method to verify OTP with maximum attempts guard
otpSchema.methods.isExpired = function () {
  return Date.now() > this.expiresAt.getTime();
};

module.exports = mongoose.models.OTP || mongoose.model("OTP", otpSchema);
