const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext) ? ext : ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|webp|gif|svg\+xml)/.test(file.mimetype || "");
    cb(ok ? null : new Error("Only image uploads are allowed."), ok);
  }
});

function fileToPublicUrl(req, file) {
  if (!file) return "";
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${file.filename}`;
}

module.exports = { upload, fileToPublicUrl, uploadDir };
