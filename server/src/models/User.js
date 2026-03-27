const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer },
    contentType: { type: String, trim: true },
    filename: { type: String, trim: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "admin", "coordinator"], default: "coordinator" },
    coordinatorRole: { type: String, trim: true, default: "Event Coordinator" },
    department: { type: String, trim: true },
    phone: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
    photoImage: imageSchema,
    paymentQrUrl: { type: String, trim: true },
    paymentQrImage: imageSchema,
    notifications: {
      type: [
        {
          message: { type: String, required: true, trim: true },
          isRead: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
