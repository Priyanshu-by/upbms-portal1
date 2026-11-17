const multer = require("multer");
const path = require("node:path");

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10 MB default

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf"
];

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf"
];

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mime);

  if (isExtAllowed || isMimeAllowed) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Invalid file type. Allowed formats: JPG, JPEG, PNG, WEBP, GIF, SVG, PDF.`
    )
  );
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

const uploadSingle = upload.single("file");

module.exports = {
  upload,
  uploadSingle,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS
};
