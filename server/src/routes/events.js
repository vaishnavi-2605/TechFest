const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");
const { getResolvedImageUrl } = require("../utils/imageStorage");

const router = express.Router();

router.get("/coordinators/public", async (req, res) => {
  try {
    const coordinators = await User.find({ role: "coordinator", isActive: true })
      .select({ name: 1, username: 1, email: 1, department: 1, phone: 1, coordinatorRole: 1, photoUrl: 1, photoImage: 1 })
      .sort({ name: 1 })
      .lean();
    const coordinatorIds = coordinators.map((coordinator) => coordinator._id);
    const eventCounts = coordinatorIds.length
      ? await Event.aggregate([
          {
            $match: {
              coordinatorId: { $in: coordinatorIds },
              $or: [{ status: "active" }, { status: { $exists: false } }]
            }
          },
          { $group: { _id: "$coordinatorId", count: { $sum: 1 } } }
        ])
      : [];
    const eventCountMap = new Map(eventCounts.map((row) => [String(row._id), Number(row.count || 0)]));

    return res.json({
      coordinators: coordinators.map((coordinator) => ({
        id: coordinator._id,
        name: coordinator.name,
        username: coordinator.username,
        email: coordinator.email,
        department: coordinator.department,
        phone: coordinator.phone,
        photoUrl: getResolvedImageUrl(coordinator, "photo", req, "users"),
        role: coordinator.coordinatorRole || "Event Coordinator",
        eventCount: eventCountMap.get(String(coordinator._id)) || 0
      }))
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load coordinators." });
  }
});

router.get("/", async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { status: "active" },
        { status: { $exists: false } }
      ]
    }).sort({ department: 1, title: 1 }).lean();
    res.json({
      events: events.map((event) => ({
        ...event,
        posterUrl: getResolvedImageUrl(event, "poster", req, "events"),
        paymentQrUrl: getResolvedImageUrl(event, "paymentQr", req, "events")
      }))
    });
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
    return res.json({
      event: {
        ...event,
        posterUrl: getResolvedImageUrl(event, "poster", req, "events"),
        paymentQrUrl: getResolvedImageUrl(event, "paymentQr", req, "events")
      }
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load event." });
  }
});

module.exports = router;
