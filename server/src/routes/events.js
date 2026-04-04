const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");
const Registration = require("../models/Registration");
const Sponsor = require("../models/Sponsor");
const { getResolvedImageUrl } = require("../utils/imageStorage");

const router = express.Router();

function getActiveEventQuery() {
  return {
    $or: [
      { status: "active" },
      { status: { $exists: false } }
    ]
  };
}

function normalizeEventType(value) {
  const raw = String(value || "").trim();
  if (raw === "Technical" || raw === "Non-Technical" || raw === "Workshop") return raw;
  const lower = raw.toLowerCase();
  if (lower.includes("non")) return "Non-Technical";
  if (lower.includes("work")) return "Workshop";
  if (lower.includes("tech")) return "Technical";
  return "";
}

function applyEventOverrides(event) {
  const title = String(event?.title || "").toLowerCase();
  if (title.includes("tech tank")) {
    return {
      ...event,
      title: "Tech Tank: Equity Wars",
      shortDescription: "It’s not just about pitching a startup — it’s about building, investing, and winning like real founders.",
      description: "It’s not just about pitching a startup — it’s about building, investing, and winning like real founders.",
      eventType: "Technical",
      displayCategory: "Technical",
    };
  }
  return event;
}

async function getSignatureCoordinatorId() {
  const signatureCoordinatorEmail = String(process.env.SIGNATURE_EVENT_COORDINATOR_EMAIL || "")
    .trim()
    .toLowerCase();
  if (!signatureCoordinatorEmail) return null;

  const user = await User.findOne({ email: signatureCoordinatorEmail }).select({ _id: 1 }).lean();
  return user?._id ? String(user._id) : null;
}

function isSignatureEventMatch(event, signatureCoordinatorId) {
  const signatureTitle = String(process.env.SIGNATURE_EVENT_TITLE || "Project Competition").trim().toLowerCase();
  if (!signatureTitle) return false;

  const titleMatch = String(event.title || "").toLowerCase().includes(signatureTitle);
  if (!titleMatch) return false;

  const signatureCoordinatorEmail = String(process.env.SIGNATURE_EVENT_COORDINATOR_EMAIL || "")
    .trim()
    .toLowerCase();
  if (!signatureCoordinatorEmail) return true;

  if (!signatureCoordinatorId) return false;
  return String(event.coordinatorId || "") === signatureCoordinatorId;
}

function extractPrizeAmount(displayPrize) {
  const matches = String(displayPrize || "").match(/[\d,]+/g) || [];
  return matches.reduce((sum, value) => sum + Number(String(value).replace(/,/g, "")), 0);
}

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
    const signatureCoordinatorId = await getSignatureCoordinatorId();
    const events = await Event.find(getActiveEventQuery()).sort({ department: 1, title: 1 }).lean();
    res.json({
      events: events.map((rawEvent) => {
        const event = applyEventOverrides(rawEvent);
        return {
          ...event,
          eventType: normalizeEventType(event.eventType) || normalizeEventType(event.displayCategory) || "Technical",
          displayCategory: normalizeEventType(event.displayCategory) || normalizeEventType(event.eventType) || "",
          isSignatureEvent: isSignatureEventMatch(event, signatureCoordinatorId),
          registrationClosed: Boolean(event.registrationClosed),
          posterUrl: getResolvedImageUrl(event, "poster", req, "events"),
          paymentQrUrl: getResolvedImageUrl(event, "paymentQr", req, "events")
        };
      })
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to load events." });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const events = await Event.find(getActiveEventQuery()).select({ eventId: 1, displayPrize: 1 }).lean();
    const eventIds = events.map((event) => String(event.eventId || "")).filter(Boolean);
    const [participantCount, sponsorCount] = await Promise.all([
      eventIds.length ? Registration.countDocuments({ eventId: { $in: eventIds } }) : 0,
      Sponsor.countDocuments()
    ]);

    return res.json({
      stats: {
        eventCount: events.length,
        participantCount: Number(participantCount || 0),
        sponsorCount: Number(sponsorCount || 0),
        prizePool: events.reduce((sum, event) => sum + extractPrizeAmount(event.displayPrize), 0)
      }
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load event stats." });
  }
});

router.get("/:eventId", async (req, res) => {
  try {
    const signatureCoordinatorId = await getSignatureCoordinatorId();
    const event = await Event.findOne({
      eventId: req.params.eventId,
      ...getActiveEventQuery()
    }).lean();
    if (!event) return res.status(404).json({ error: "Event not found." });
    const nextEvent = applyEventOverrides(event);
    return res.json({
      event: {
        ...nextEvent,
        eventType: normalizeEventType(nextEvent.eventType) || normalizeEventType(nextEvent.displayCategory) || "Technical",
        displayCategory: normalizeEventType(nextEvent.displayCategory) || normalizeEventType(nextEvent.eventType) || "",
        isSignatureEvent: isSignatureEventMatch(nextEvent, signatureCoordinatorId),
        registrationClosed: Boolean(nextEvent.registrationClosed),
        posterUrl: getResolvedImageUrl(nextEvent, "poster", req, "events"),
        paymentQrUrl: getResolvedImageUrl(nextEvent, "paymentQr", req, "events")
      }
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load event." });
  }
});

module.exports = router;
