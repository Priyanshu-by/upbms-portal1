const fs = require("node:fs");
const path = require("node:path");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function storeLocalFallback(buffer, uniqueName, extFromName, isPdf, mime) {
  let ext = extFromName || ".png";
  if (isPdf) ext = ".pdf";
  else if (mime.includes("jpeg") || mime.includes("jpg")) ext = ".jpg";
  else if (mime.includes("svg")) ext = ".svg";
  else if (mime.includes("webp")) ext = ".webp";

  const finalLocalName = `${uniqueName}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, finalLocalName), buffer);
  const localUrl = `/uploads/${finalLocalName}`;

  return {
    ok: true,
    secure_url: localUrl,
    url: localUrl,
    public_id: null,
    bytes: buffer.length,
    isLocalFallback: true
  };
}

/**
 * Injects Cloudinary on-the-fly transformations to compress size and deliver next-gen format
 * @param {string} url - Original Cloudinary secure_url
 * @param {Object} options - Transformations (width, quality, format)
 * @returns {string} - Optimized delivery URL
 */
function getOptimizedCloudinaryUrl(url, { width = 1600, quality = "auto:good", format = "auto" } = {}) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }
  if (url.includes("/f_auto") || url.includes("/q_auto")) {
    return url;
  }
  const match = url.match(/(https?:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/)(.*)/);
  if (!match) return url;
  const prefix = match[1];
  const rest = match[2];
  const transforms = [];
  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${width},c_limit`);
  return `${prefix}${transforms.join(",")}/${rest}`;
}

/**
 * Upload a file Buffer to Cloudinary (or local fallback if unconfigured / error)
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options (folder, filename, mime, resource_type)
 * @returns {Promise<{secure_url: string, public_id: string|null, url: string, size: number}>}
 */
async function uploadBuffer(buffer, options = {}) {
  const {
    folder = "upbms/general",
    filename = "upload",
    mime = "image/jpeg"
  } = options;

  // Determine resource type: images as image, pdfs as auto/raw
  const isPdf = mime.includes("pdf");
  const resourceType = isPdf ? "auto" : "image";
  const isBanner = folder.includes("slides") || folder.includes("banner");

  // Sanitize filename for unique public_id
  const extFromName = path.extname(filename).toLowerCase();
  const safeBase = path.basename(filename, extFromName)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  const uniqueName = `${Date.now()}-${safeBase}`;

  if (isCloudinaryConfigured()) {
    try {
      return await new Promise((resolve, reject) => {
        const uploadParams = {
          folder,
          public_id: uniqueName,
          resource_type: resourceType,
          overwrite: true
        };

        // For images (especially banners/slides), compress size and scale according to 16:9 hero section
        if (!isPdf) {
          if (isBanner) {
            uploadParams.transformation = [
              { width: 1600, height: 900, crop: "limit" },
              { quality: "auto:good" },
              { fetch_format: "auto" }
            ];
          } else {
            uploadParams.transformation = [
              { width: 1600, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" }
            ];
          }
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadParams,
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload error:", error);
              return reject(new Error(`Cloudinary Error: ${error.message} (HTTP ${error.http_code || 400})`));
            }
            const optimizedUrl = (!isPdf && result.secure_url)
              ? getOptimizedCloudinaryUrl(result.secure_url, {
                  width: isBanner ? 1600 : 1200,
                  quality: "auto:good",
                  format: "auto"
                })
              : result.secure_url;

            resolve({
              ok: true,
              secure_url: optimizedUrl,
              url: optimizedUrl,
              raw_url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              bytes: result.bytes || buffer.length,
              width: result.width,
              height: result.height,
              resource_type: result.resource_type,
              isLocalFallback: false
            });
          }
        );
        uploadStream.end(buffer);
      });
    } catch (cloudErr) {
      console.error(`❌ Cloudinary failed: ${cloudErr.message}`);
      throw cloudErr;
    }
  }

  // Graceful local storage fallback if Cloudinary credentials are not set
  console.log("[Upload] Cloudinary credentials not set in .env. Storing locally as fallback.");
  return storeLocalFallback(buffer, uniqueName, extFromName, isPdf, mime);
}

/**
 * Upload a Base64 dataURL to Cloudinary (or local fallback if unconfigured)
 * @param {string} dataUrl - e.g. "data:image/jpeg;base64,..."
 * @param {Object} options - Upload options (folder, filename)
 */
async function uploadDataUrl(dataUrl, options = {}) {
  const { folder = "upbms/general", filename = "upload" } = options;

  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    throw new Error("Valid dataUrl required (must start with data:)");
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Malformed base64 dataUrl");
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");

  return uploadBuffer(buffer, { folder, filename, mime });
}

/**
 * Delete an asset from Cloudinary using its public_id
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - "image" | "raw" | "video" | "auto"
 */
async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!publicId || typeof publicId !== "string" || !isCloudinaryConfigured()) {
    return false;
  }
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return res.result === "ok";
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete public_id '${publicId}':`, err.message);
    return false;
  }
}

module.exports = {
  uploadBuffer,
  uploadDataUrl,
  deleteFromCloudinary,
  isCloudinaryConfigured,
  getOptimizedCloudinaryUrl
};
