const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|webp|gif|svg\+xml)/.test(file.mimetype || "");
    cb(ok ? null : new Error("Only image uploads are allowed."), ok);
  }
});

function getSafeExtension(file) {
  const ext = path.extname(file?.originalname || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext) ? ext : ".jpg";
}

function saveFileLocally(file) {
  if (!file?.buffer) return "";

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${getSafeExtension(file)}`;
  const fullPath = path.join(uploadDir, filename);
  fs.writeFileSync(fullPath, file.buffer);
  return filename;
}

function fileToPublicUrl(req, filename) {
  if (!filename) return "";
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
}

module.exports = { upload, uploadDir, saveFileLocally, fileToPublicUrl };
