const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer },
    contentType: { type: String, trim: true },
    filename: { type: String, trim: true }
  },
  { _id: false }
);

const subEventSchema = new mongoose.Schema(
  {
    subEventId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    isTeamEvent: { type: Boolean, required: true },
    teamSize: { type: Number, required: true, min: 1 },
    fee: { type: Number, required: true, min: 0 },
    address: { type: String, trim: true },
    time: { type: String, trim: true },
    guide: { type: String, trim: true },
    guidePhone: { type: String, trim: true },
    rules: { type: [String], default: [] }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    displayCategory: { type: String, trim: true },
    displayTeamSize: { type: String, trim: true },
    displayPrize: { type: String, trim: true },
    displayDeadline: { type: String, trim: true },
    eventType: { type: String, enum: ["Technical", "Non-Technical", "Workshop"], default: "Technical" },
    description: { type: String, required: true, trim: true },
    posterUrl: { type: String, trim: true },
    posterImage: imageSchema,
    isTeamEvent: { type: Boolean, required: true },
    teamSize: { type: Number, required: true, min: 1 },
    fee: { type: Number, required: true, min: 0 },
    paymentQrUrl: { type: String, trim: true },
    paymentQrImage: imageSchema,
    whatsappGroupLink: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    guide: { type: String, required: true, trim: true },
    guidePhone: { type: String, default: "N/A", trim: true },
    registrationClosed: { type: Boolean, default: false },
    coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "active"], default: "active" },
    approvedAt: { type: Date },
    rules: { type: [String], default: [] },
    subEvents: { type: [subEventSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
