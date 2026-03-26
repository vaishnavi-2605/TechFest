const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    registrationId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    studentCollege: { type: String, required: true, trim: true },
    studentDepartment: { type: String, required: true, trim: true },
    studentYear: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    normalizedEmail: { type: String, required: true, trim: true },
    paymentRef: { type: String, required: true, trim: true },
    teamMembers: { type: String, required: true, trim: true },
    eventId: { type: String, required: true, trim: true },
    eventName: { type: String, required: true, trim: true },
    subEventId: { type: String, trim: true },
    subEventName: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    guide: { type: String, required: true, trim: true },
    guidePhone: { type: String, default: "N/A", trim: true }
  },
  { timestamps: true }
);

registrationSchema.index({ normalizedEmail: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
