const mongoose = require("mongoose");

const sponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tier: { type: String, enum: ["Title", "Gold", "Silver"], required: true, default: "Silver" },
    url: { type: String, trim: true, default: "" },
    coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sponsor", sponsorSchema);
