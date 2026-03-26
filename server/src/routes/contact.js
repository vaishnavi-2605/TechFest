const express = require("express");
const ContactMessage = require("../models/ContactMessage");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body || {};

    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const trimmedSubject = String(subject || "").trim();
    const trimmedMessage = String(message || "").trim();
    const trimmedPhone = String(phone || "").replace(/\D/g, "").trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({ error: "Name, email, subject and message are required." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    await ContactMessage.create({
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
      phone: trimmedPhone || "",
      senderIp: String(req.ip || "").trim(),
      userAgent: String(req.headers["user-agent"] || "").trim()
    });

    return res.status(201).json({ message: "Message sent successfully." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to send message." });
  }
});

module.exports = router;
