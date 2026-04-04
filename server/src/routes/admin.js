const express = require("express");

const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const ContactMessage = require("../models/ContactMessage");
const Sponsor = require("../models/Sponsor");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getResolvedImageUrl } = require("../utils/imageStorage");

const router = express.Router();

function isSignatureCoordinatorEmail(email) {
  const signatureEmail = String(process.env.SIGNATURE_EVENT_COORDINATOR_EMAIL || "")
    .trim()
    .toLowerCase();
  if (!signatureEmail) return false;
  return String(email || "").trim().toLowerCase() === signatureEmail;
}

async function getSignatureEventId() {
  const signatureEmail = String(process.env.SIGNATURE_EVENT_COORDINATOR_EMAIL || "")
    .trim()
    .toLowerCase();
  const signatureTitle = String(process.env.SIGNATURE_EVENT_TITLE || "Project Competition").trim();
  if (!signatureTitle) return null;

  let coordinatorId = null;
  if (signatureEmail) {
    const coordinator = await User.findOne({ email: signatureEmail }).select({ _id: 1 }).lean();
    coordinatorId = coordinator?._id ? String(coordinator._id) : null;
  }

  const query = {
    title: { $regex: signatureTitle, $options: "i" },
  };
  if (coordinatorId) query.coordinatorId = coordinatorId;

  const event = await Event.findOne(query).select({ eventId: 1 }).lean();
  return event?.eventId ? String(event.eventId) : null;
}

router.use(requireAuth, requireRole("super_admin", "admin"));
router.use((req, res, next) => {
  if (isSignatureCoordinatorEmail(req.user?.email)) {
    return res.status(403).json({ error: "Signature coordinator cannot access admin routes." });
  }
  return next();
});

router.get("/coordinators", async (req, res) => {
  try {
    const coordinators = await User.find({ role: "coordinator", isActive: true }).sort({ createdAt: -1 }).lean();
    const coordinatorIds = coordinators.map((coordinator) => coordinator._id);
    const eventIdsByCoordinator = new Map();
    const eventsByCoordinator = new Map();
    const events = coordinatorIds.length
      ? await Event.find({ coordinatorId: { $in: coordinatorIds } })
          .select({ coordinatorId: 1, eventId: 1, status: 1, title: 1, time: 1, fee: 1 })
          .lean()
      : [];
    events.forEach((event) => {
      const key = String(event.coordinatorId || "");
      if (!key) return;
      if (!eventIdsByCoordinator.has(key)) eventIdsByCoordinator.set(key, []);
      if (!eventsByCoordinator.has(key)) eventsByCoordinator.set(key, []);
      eventIdsByCoordinator.get(key).push(event.eventId);
      eventsByCoordinator.get(key).push(event);
    });

    const allEventIds = [...new Set(events.map((event) => String(event.eventId || "")).filter(Boolean))];
    const participantCounts = allEventIds.length
      ? await Registration.aggregate([
          { $match: { eventId: { $in: allEventIds } } },
          { $group: { _id: "$eventId", count: { $sum: 1 } } }
        ])
      : [];
    const participantCountByEventId = new Map(participantCounts.map((row) => [String(row._id), Number(row.count || 0)]));

    const list = coordinators.map((c) => {
      const eventIds = eventIdsByCoordinator.get(String(c._id)) || [];
      const coordinatorEvents = eventsByCoordinator.get(String(c._id)) || [];
      const participantCount = eventIds.reduce(
        (sum, eventId) => sum + (participantCountByEventId.get(String(eventId)) || 0),
        0
      );
      const pendingCount = coordinatorEvents.filter((event) => event.status === "pending").length;
      const status = pendingCount > 0 ? "pending" : "active";

      return {
        id: c._id,
        name: c.name,
        phone: c.phone || "N/A",
        department: c.department || "N/A",
        participantCount,
        photoUrl: getResolvedImageUrl(c, "photo", req, "users"),
        status,
        totalEvents: coordinatorEvents.length,
        pendingCount,
        pendingEvents: coordinatorEvents
          .filter((event) => event.status === "pending")
          .map((event) => ({
            id: event._id,
            eventId: event.eventId,
            title: event.title,
            time: event.time,
            fee: event.fee
          }))
      };
    });

    return res.json({ coordinators: list });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load coordinators." });
  }
});

router.get("/coordinators/:id", async (req, res) => {
  try {
    const coordinator = await User.findOne({ _id: req.params.id, role: "coordinator", isActive: true }).lean();
    if (!coordinator) return res.status(404).json({ error: "Coordinator not found." });

    const events = await Event.find({ coordinatorId: coordinator._id }).sort({ createdAt: -1 }).lean();
    const eventIds = events.map((event) => event.eventId).filter(Boolean);
    const participantBuckets = eventIds.length
      ? await Registration.aggregate([
          { $match: { eventId: { $in: eventIds } } },
          { $group: { _id: "$eventId", count: { $sum: 1 } } }
        ])
      : [];
    const participantCountByEventId = new Map(participantBuckets.map((row) => [String(row._id), Number(row.count || 0)]));
    const totalParticipants = participantBuckets.reduce((sum, row) => sum + Number(row.count || 0), 0);

    return res.json({
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        username: coordinator.username || "N/A",
        role: coordinator.coordinatorRole || "Event Coordinator",
        phone: coordinator.phone || "N/A",
        email: coordinator.email,
        department: coordinator.department || "N/A",
        status: coordinator.isActive ? "Active" : "Inactive",
        photoUrl: getResolvedImageUrl(coordinator, "photo", req, "users"),
        totalParticipants,
        totalEvents: events.length,
        events: events.map((e) => ({
          id: e._id,
          eventId: e.eventId,
          title: e.title,
          description: e.description,
          department: e.department,
          fee: e.fee,
          time: e.time,
          address: e.address,
          posterUrl: getResolvedImageUrl(e, "poster", req, "events"),
          status: e.status || "active",
          participantCount: participantCountByEventId.get(String(e.eventId)) || 0
        }))
      }
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load coordinator details." });
  }
});

router.patch("/events/:id/status", async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["pending", "active"].includes(status)) {
      return res.status(400).json({ error: "Status must be pending or active." });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    event.status = status;
    event.approvedAt = status === "active" ? new Date() : undefined;
    await event.save();

    return res.json({ message: "Event status updated.", event });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to update event status." });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    const coordinatorId = event.coordinatorId ? String(event.coordinatorId) : "";
    const eventTitle = event.title || "Event";
    const eventPublicId = event.eventId || "";

    await Event.deleteOne({ _id: event._id });
    if (eventPublicId) {
      await Registration.deleteMany({ eventId: eventPublicId });
    }

    if (coordinatorId) {
      await User.findByIdAndUpdate(coordinatorId, {
        $push: {
          notifications: {
            message: `"${eventTitle}" was deleted by admin.`,
            isRead: false,
            createdAt: new Date()
          }
        }
      });
    }

    return res.json({ message: "Event deleted." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to delete event." });
  }
});

router.get("/messages/unread-count", async (_req, res) => {
  try {
    const unreadCount = await ContactMessage.countDocuments({ isRead: false });
    return res.json({ unreadCount });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load unread message count." });
  }
});

router.get("/messages", async (_req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return res.json({
      messages: messages.map((item) => ({
        id: item._id,
        name: item.name,
        email: item.email,
        phone: item.phone || "",
        subject: item.subject,
        message: item.message,
        isRead: Boolean(item.isRead),
        readAt: item.readAt || null,
        createdAt: item.createdAt
      }))
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load messages." });
  }
});

router.patch("/messages/:id/read", async (req, res) => {
  try {
    const updated = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Message not found." });

    return res.json({ message: "Message marked as read." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to update message status." });
  }
});

router.delete("/messages/:id", async (req, res) => {
  try {
    const deleted = await ContactMessage.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Message not found." });
    return res.json({ message: "Message deleted." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to delete message." });
  }
});

router.delete("/coordinators/:id", async (req, res) => {
  try {
    const coordinator = await User.findOne({ _id: req.params.id, role: "coordinator" });
    if (!coordinator) return res.status(404).json({ error: "Coordinator not found." });

    const coordinatorEvents = await Event.find({ coordinatorId: coordinator._id }).lean();
    const eventPublicIds = coordinatorEvents.map((event) => event.eventId).filter(Boolean);

    await Event.deleteMany({ coordinatorId: coordinator._id });
    if (eventPublicIds.length) {
      await Registration.deleteMany({ eventId: { $in: eventPublicIds } });
    }
    await Sponsor.deleteMany({ coordinatorId: coordinator._id });
    coordinator.isActive = false;
    coordinator.notifications = [];
    await coordinator.save();

    return res.json({ message: "Coordinator deactivated." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to delete coordinator." });
  }
});

router.get("/registrations", async (req, res) => {
  try {
    const signatureEventId = await getSignatureEventId();
    const signatureTitle = String(process.env.SIGNATURE_EVENT_TITLE || "Project Competition").trim();
    const signatureTitleRegex = signatureTitle ? new RegExp(signatureTitle, "i") : null;
    const excludeQuery = [];
    if (signatureEventId) excludeQuery.push({ eventId: { $ne: signatureEventId } });
    if (signatureTitleRegex) excludeQuery.push({ eventName: { $not: signatureTitleRegex } });
    const registrations = await Registration.find(
      excludeQuery.length ? { $and: excludeQuery } : {}
    )
      .populate('event', 'title eventId department')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      registrations: registrations.map((reg) => ({
        id: reg._id,
        registrationId: reg.registrationId,
        fullName: reg.fullName,
        email: reg.email,
        phone: reg.phone,
        studentCollege: reg.studentCollege,
        studentDepartment: reg.studentDepartment,
        studentYear: reg.studentYear,
        projectCategory: reg.projectCategory,
        teamMembers: reg.teamMembers,
        eventName: reg.event?.title || reg.eventName,
        eventId: reg.event?.eventId || reg.eventId,
        department: reg.event?.department || reg.department,
        paymentRef: reg.paymentRef,
        createdAt: reg.createdAt
      }))
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load registrations." });
  }
});

module.exports = router;
