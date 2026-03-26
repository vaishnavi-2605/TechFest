const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    senderIp: { type: String, trim: true },
    userAgent: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
