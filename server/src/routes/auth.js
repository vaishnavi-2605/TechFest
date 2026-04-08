const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/security");
const { upload } = require("../utils/upload");
const { getJwtSecret } = require("../utils/authSecurity");
const { setStoredImage, setImageFromBodyValue, getResolvedImageUrl } = require("../utils/imageStorage");

const router = express.Router();
const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: "Too many login attempts. Please wait 15 minutes and try again."
});

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email, username: user.username, name: user.name },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function getEffectiveRole(user) {
  const signatureEmail = String(process.env.SIGNATURE_EVENT_COORDINATOR_EMAIL || "")
    .trim()
    .toLowerCase();
  if (signatureEmail && String(user.email || "").trim().toLowerCase() === signatureEmail) {
    return "coordinator";
  }
  return user.role;
}

router.post("/register-coordinator", upload.single("photo"), async (req, res) => {
  try {
    const { name, username, coordinatorRole, department, phone, email, password, photoUrl } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const derivedUsername = String(username || normalizedEmail).trim().toLowerCase();

    if (!name || !department || !phone || !email || !password) {
      return res.status(400).json({ error: "Please fill all required coordinator fields." });
    }
    const plainPassword = String(password || "");
    if (plainPassword.length < 6) {
      return res.status(400).json({ error: "Password is too short. Use at least 6 characters." });
    }
    const normalizedUsername = derivedUsername;
    if (!normalizedUsername) {
      return res.status(400).json({ error: "Email is required." });
    }
    const normalizedPhone = String(phone).replace(/\D/g, "").trim();
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits." });
    }

    const existingByUsername = await User.findOne({ username: normalizedUsername });
    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByUsername && existingByEmail && String(existingByUsername._id) !== String(existingByEmail._id)) {
      return res.status(409).json({ error: "Email already exists." });
    }
    if ((existingByUsername && existingByUsername.isActive) || (existingByEmail && existingByEmail.isActive)) {
      return res.status(409).json({ error: "Email already exists." });
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const existingInactive = existingByEmail || existingByUsername;
    let user = existingInactive;
    if (user) {
      user.name = String(name).trim();
      user.username = normalizedUsername;
      user.coordinatorRole = String(coordinatorRole || "Event Coordinator").trim();
      user.department = String(department).trim();
      user.phone = normalizedPhone;
      user.email = normalizedEmail;
      user.passwordHash = passwordHash;
      user.role = "coordinator";
      user.isActive = true;
      if (req.file) setStoredImage(user, "photo", req.file, req, "users");
      else setImageFromBodyValue(user, "photo", photoUrl);
      await user.save();
    } else {
      user = new User({
        name: String(name).trim(),
        username: normalizedUsername,
        coordinatorRole: String(coordinatorRole || "Event Coordinator").trim(),
        department: String(department).trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        passwordHash,
        role: "coordinator"
      });
      if (req.file) setStoredImage(user, "photo", req.file, req, "users");
      else setImageFromBodyValue(user, "photo", photoUrl);
      await user.save();
    }

    const effectiveRole = getEffectiveRole(user);
    const token = jwt.sign(
      { id: user._id.toString(), role: effectiveRole, email: user.email, username: user.username, name: user.name },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Coordinator registered.",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: effectiveRole,
        coordinatorRole: user.coordinatorRole || "Event Coordinator",
        department: user.department,
        phone: user.phone,
        photoUrl: getResolvedImageUrl(user, "photo", req, "users")
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Failed to register coordinator." });
  }
});

router.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const loginId = String(email || username || "").trim().toLowerCase();
    if (!loginId || !password) return res.status(400).json({ error: "Email and password are required." });

    let user = await User.findOne({ email: loginId, isActive: true });
    if (!user) {
      user = await User.findOne({ username: loginId, isActive: true });
    }
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials." });

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username || "",
        email: user.email,
        role: user.role,
        coordinatorRole: user.coordinatorRole || "Event Coordinator",
        department: user.department,
        phone: user.phone,
        photoUrl: getResolvedImageUrl(user, "photo", req, "users")
      }
    });
  } catch (_error) {
    return res.status(500).json({ error: "Login failed." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: "User not found." });
  const effectiveRole = getEffectiveRole(user);
  return res.json({
    user: {
      id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      role: effectiveRole,
      coordinatorRole: user.coordinatorRole || "Event Coordinator",
      department: user.department,
      phone: user.phone,
      photoUrl: getResolvedImageUrl(user, "photo", req, "users")
    }
  });
});

router.post("/admin/create", requireAuth, requireRole("super_admin"), async (req, res) => {
  try {
    const { name, username, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    const plainPassword = String(password || "");
    if (plainPassword.length < 6) {
      return res.status(400).json({ error: "Password is too short. Use at least 6 characters." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username || normalizedEmail).trim().toLowerCase();
    if (!normalizedUsername) {
      return res.status(400).json({ error: "Email is required." });
    }
    const existingUsername = await User.findOne({ username: normalizedUsername }).lean();
    if (existingUsername) return res.status(409).json({ error: "Email already exists." });
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) return res.status(409).json({ error: "Email already exists." });

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const user = await User.create({
      name: String(name).trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: "admin"
    });

    return res.status(201).json({
      message: "Admin created.",
      admin: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role }
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to create admin." });
  }
});

module.exports = router;
