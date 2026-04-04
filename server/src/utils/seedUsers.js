const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedDefaultAdmin() {
  const adminEmail = String(process.env.ADMIN_EMAIL || "admin@techfest.com").trim().toLowerCase();
  const adminUsername = String(process.env.ADMIN_USERNAME || adminEmail.split("@")[0] || "admin")
    .trim()
    .toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "admin123");
  const adminName = String(process.env.ADMIN_NAME || "TechFest Admin");

  const existingByEmail = await User.findOne({ email: adminEmail });
  if (existingByEmail) {
    if (!existingByEmail.username) {
      existingByEmail.username = adminUsername;
      await existingByEmail.save();
    }
    return;
  }

  const existingByUsername = await User.findOne({ username: adminUsername }).lean();
  if (existingByUsername) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: adminName,
    username: adminUsername,
    email: adminEmail,
    passwordHash,
    role: "super_admin",
    isActive: true
  });
}

async function seedSignatureCoordinator() {
  const signatureEmail = String(process.env.SIGNATURE_EVENT_COORDINATOR_EMAIL || "").trim().toLowerCase();
  const signaturePassword = String(process.env.SIGNATURE_EVENT_COORDINATOR_PASSWORD || "");
  const signatureName = String(process.env.SIGNATURE_EVENT_COORDINATOR_NAME || "Signature Coordinator");
  const signatureDepartment = String(process.env.SIGNATURE_EVENT_COORDINATOR_DEPARTMENT || "General");

  if (!signatureEmail || !signaturePassword) return;

  const passwordHash = await bcrypt.hash(signaturePassword, 10);
  const username = signatureEmail.split("@")[0] || "signature-coordinator";

  const existingByEmail = await User.findOne({ email: signatureEmail });
  if (existingByEmail) {
    existingByEmail.passwordHash = passwordHash;
    existingByEmail.role = "coordinator";
    existingByEmail.name = signatureName;
    existingByEmail.department = signatureDepartment;
    existingByEmail.username = existingByEmail.username || username;
    existingByEmail.isActive = true;
    await existingByEmail.save();
    return;
  }

  await User.create({
    name: signatureName,
    username,
    email: signatureEmail,
    passwordHash,
    role: "coordinator",
    department: signatureDepartment,
    isActive: true
  });
}

module.exports = { seedDefaultAdmin, seedSignatureCoordinator };
