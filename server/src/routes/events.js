const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");

const router = express.Router();

router.get("/coordinators/public", async (_req, res) => {
  try {
    const coordinators = await User.aggregate([
      {
        $match: { role: "coordinator", isActive: true },
      },
      {
        $lookup: {
          from: "events",
          let: { coordinatorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$coordinatorId", "$$coordinatorId"] },
                $or: [{ status: "active" }, { status: { $exists: false } }],
              },
            },
          ],
          as: "events",
        },
      },
      {
        $addFields: {
          eventCount: { $size: "$events" },
        },
      },
      {
        $project: {
          id: "$_id",
          name: "$name",
          username: "$username",
          email: "$email",
          department: "$department",
          phone: "$phone",
          photoUrl: "$photoUrl",
          role: { $ifNull: ["$coordinatorRole", "Event Coordinator"] },
          eventCount: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    return res.json({ coordinators });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load coordinators." });
  }
});

router.get("/", async (_req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { status: "active" },
        { status: { $exists: false } }
      ]
    }).sort({ department: 1, title: 1 }).lean();
    res.json({ events });
  } catch (_error) {
    res.status(500).json({ error: "Failed to load events." });
  }
});

router.get("/:eventId", async (req, res) => {
  try {
    const event = await Event.findOne({
      eventId: req.params.eventId,
      $or: [
        { status: "active" },
        { status: { $exists: false } }
      ]
    }).lean();
    if (!event) return res.status(404).json({ error: "Event not found." });
    return res.json({ event });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load event." });
  }
});

module.exports = router;
