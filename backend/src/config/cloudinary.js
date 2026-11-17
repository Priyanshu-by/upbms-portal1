const path = require("node:path");
const dotenv = require("dotenv");

// Load .env from backend directory, then workspace root
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

const cloudinary = require("cloudinary").v2;

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

/**
 * Returns true if real Cloudinary credentials are configured
 */
function isCloudinaryConfigured() {
  return Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== "your_cloud_name" &&
    apiKey !== "your_api_key" &&
    apiSecret !== "your_api_secret"
  );
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  cloudName,
  apiKey
};
