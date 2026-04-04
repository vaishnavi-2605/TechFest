const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Sponsor = require("../models/Sponsor");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../utils/upload");
const { buildImageUrl, setStoredImage, setImageFromBodyValue, getResolvedImageUrl } = require("../utils/imageStorage");

const router = express.Router();

router.use(requireAuth, requireRole("coordinator"));

function isSignatureCoordinator(req) {
  const signatureEmail = String(process.env.SIGNATURE_EVENT_COORDINATOR_EMAIL || "")
    .trim()
    .toLowerCase();
  if (!signatureEmail) return false;
  const requesterEmail = String(req.user?.email || "").trim().toLowerCase();
  return requesterEmail === signatureEmail;
}

async function getSignatureEventForCoordinator(userId) {
  const signatureTitle = String(process.env.SIGNATURE_EVENT_TITLE || "Project Competition").trim();
  if (!signatureTitle) return null;
  return Event.findOne({
    coordinatorId: userId,
    title: { $regex: signatureTitle, $options: "i" }
  }).lean();
}

router.get("/me", async (req, res) => {
  try {
    const coordinator = await User.findById(req.user.id).lean();
    if (!coordinator || !coordinator.isActive) return res.status(404).json({ error: "Coordinator not found." });

    let events = await Event.find({ coordinatorId: coordinator._id }).sort({ createdAt: -1 }).lean();
    if (isSignatureCoordinator(req)) {
      const signatureEvent = await getSignatureEventForCoordinator(coordinator._id);
      events = signatureEvent ? [signatureEvent] : [];
    }
    return res.json({
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        username: coordinator.username || "",
        coordinatorRole: coordinator.coordinatorRole || "Event Coordinator",
        phone: coordinator.phone || "",
        email: coordinator.email,
        department: coordinator.department || "",
        photoUrl: getResolvedImageUrl(coordinator, "photo", req, "users"),
        paymentQrUrl: getResolvedImageUrl(coordinator, "paymentQr", req, "users"),
        isSignatureCoordinator: isSignatureCoordinator(req),
        notifications: isSignatureCoordinator(req)
          ? []
          : Array.isArray(coordinator.notifications)
            ? coordinator.notifications.map((item) => ({
                message: item.message,
                isRead: Boolean(item.isRead),
                createdAt: item.createdAt
              }))
            : []
      },
      events
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load profile." });
  }
});

router.patch("/notifications/read", async (req, res) => {
  try {
    const coordinator = await User.findById(req.user.id);
    if (!coordinator || !coordinator.isActive) return res.status(404).json({ error: "Coordinator not found." });

    coordinator.notifications = (coordinator.notifications || []).map((item) => ({
      ...item.toObject?.(),
      message: item.message,
      isRead: true,
      createdAt: item.createdAt || new Date()
    }));
    await coordinator.save();

    return res.json({ message: "Notifications marked as read." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to update notifications." });
  }
});

router.put("/me", upload.fields([{ name: "photo", maxCount: 1 }, { name: "paymentQr", maxCount: 1 }]), async (req, res) => {
  try {
    const { name, phone, department, photoUrl, email, password, paymentQrUrl, coordinatorRole } = req.body || {};
    const coordinator = await User.findById(req.user.id);
    if (!coordinator || !coordinator.isActive) return res.status(404).json({ error: "Coordinator not found." });

    if (name) coordinator.name = String(name).trim();
    if (email !== undefined) {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (normalizedEmail) {
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: coordinator._id } }).lean();
        if (existing) return res.status(409).json({ error: "Email already exists." });
        coordinator.email = normalizedEmail;
      }
    }
    if (phone !== undefined) {
      const normalizedPhone = String(phone || "").replace(/\D/g, "").trim();
      if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
        return res.status(400).json({ error: "Phone number must be exactly 10 digits." });
      }
      coordinator.phone = normalizedPhone;
    }
    if (department) coordinator.department = String(department).trim();
    if (coordinatorRole !== undefined) {
      const normalizedRole = String(coordinatorRole || "").trim();
      if (normalizedRole) coordinator.coordinatorRole = normalizedRole;
    }
    if (password !== undefined) {
      const plainPassword = String(password || "");
      if (plainPassword.length > 0 && plainPassword.length < 6) {
        return res.status(400).json({ error: "Password is too short. Use at least 6 characters." });
      }
      if (plainPassword.length >= 6) {
        coordinator.passwordHash = await bcrypt.hash(plainPassword, 10);
      }
    }

    if (req.files?.photo?.[0]) setStoredImage(coordinator, "photo", req.files.photo[0], req, "users");
    else setImageFromBodyValue(coordinator, "photo", photoUrl);

    if (req.files?.paymentQr?.[0]) setStoredImage(coordinator, "paymentQr", req.files.paymentQr[0], req, "users");
    else setImageFromBodyValue(coordinator, "paymentQr", paymentQrUrl);

    await coordinator.save();

    return res.json({
      message: "Profile updated.",
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        username: coordinator.username || "",
        coordinatorRole: coordinator.coordinatorRole || "Event Coordinator",
        phone: coordinator.phone || "",
        email: coordinator.email,
        department: coordinator.department || "",
        photoUrl: getResolvedImageUrl(coordinator, "photo", req, "users"),
        paymentQrUrl: getResolvedImageUrl(coordinator, "paymentQr", req, "users")
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Failed to update profile." });
  }
});

router.get("/participants", async (req, res) => {
  try {
    let eventIds = [];
    if (isSignatureCoordinator(req)) {
      const signatureEvent = await getSignatureEventForCoordinator(req.user.id);
      if (signatureEvent?.eventId) eventIds = [signatureEvent.eventId];
    } else {
      const events = await Event.find({ coordinatorId: req.user.id }).select({ eventId: 1 }).lean();
      eventIds = events.map((e) => e.eventId);
    }
    const participants = eventIds.length
      ? await Registration.find({ eventId: { $in: eventIds } })
          .select({
            registrationId: 1,
            fullName: 1,
            teamMembers: 1,
            email: 1,
            phone: 1,
            studentCollege: 1,
            eventName: 1,
            studentDepartment: 1,
            paymentRef: 1,
            createdAt: 1
          })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    return res.json({ participants });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load participants." });
  }
});

router.get("/sponsors", async (req, res) => {
  try {
    if (isSignatureCoordinator(req)) {
      return res.json({ sponsors: [] });
    }
    const sponsors = await Sponsor.find({ coordinatorId: req.user.id }).sort({ createdAt: 1 }).lean();
    return res.json({
      sponsors: sponsors.map((sponsor) => ({
        id: sponsor._id,
        name: sponsor.name,
        tier: sponsor.tier,
        url: sponsor.url || "",
        logo: ""
      }))
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load sponsors." });
  }
});

router.post("/sponsors", async (req, res) => {
  try {
    if (isSignatureCoordinator(req)) {
      return res.status(403).json({ error: "Not allowed for signature coordinator." });
    }
    const { name, tier, url } = req.body || {};
    const normalizedName = String(name || "").trim();
    const normalizedTier = String(tier || "Silver").trim();
    const normalizedUrl = String(url || "").trim();

    if (!normalizedName) {
      return res.status(400).json({ error: "Sponsor name is required." });
    }
    if (!["Title", "Gold", "Silver"].includes(normalizedTier)) {
      return res.status(400).json({ error: "Sponsor tier must be Title, Gold, or Silver." });
    }

    const sponsor = await Sponsor.create({
      name: normalizedName,
      tier: normalizedTier,
      url: normalizedUrl,
      coordinatorId: req.user.id
    });

    return res.status(201).json({
      message: "Sponsor added.",
      sponsor: {
        id: sponsor._id,
        name: sponsor.name,
        tier: sponsor.tier,
        url: sponsor.url || "",
        logo: ""
      }
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to add sponsor." });
  }
});

router.delete("/sponsors/:id", async (req, res) => {
  try {
    if (isSignatureCoordinator(req)) {
      return res.status(403).json({ error: "Not allowed for signature coordinator." });
    }
    const sponsor = await Sponsor.findOneAndDelete({ _id: req.params.id, coordinatorId: req.user.id }).lean();
    if (!sponsor) return res.status(404).json({ error: "Sponsor not found." });
    return res.json({ message: "Sponsor deleted." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to delete sponsor." });
  }
});

router.post("/events", upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "paymentQr", maxCount: 1 }
]), async (req, res) => {
  try {
    const coordinator = await User.findById(req.user.id).lean();
    if (!coordinator || !coordinator.isActive) return res.status(404).json({ error: "Coordinator not found." });

    const {
      eventId,
      eventType,
      displayPrize,
      displayTeamSize,
      title,
      shortDescription,
      description,
      fee,
      isTeamEvent,
      teamSize,
      time,
      address,
      posterUrl,
      paymentQrUrl,
      whatsappGroupLink,
      rules,
      subEvents
    } = req.body || {};

    if (!title || !shortDescription || !description) {
      return res.status(400).json({ error: "Title, one-line description and detailed description are required." });
    }
    if (isSignatureCoordinator(req)) {
      const signatureTitle = String(process.env.SIGNATURE_EVENT_TITLE || "Project Competition").trim().toLowerCase();
      if (!signatureTitle || !String(title).trim().toLowerCase().includes(signatureTitle)) {
        return res.status(403).json({ error: "Signature coordinator can only create the signature event." });
      }
    }
    const normalizedWhatsappGroupLink = String(whatsappGroupLink || "").trim();
    if (!normalizedWhatsappGroupLink) {
      return res.status(400).json({ error: "WhatsApp group link is required." });
    }
    if (!/^https?:\/\/\S+$/i.test(normalizedWhatsappGroupLink)) {
      return res.status(400).json({ error: "Enter a valid WhatsApp group link." });
    }
    const normalizedEventType = String(eventType || "Technical").trim();
    if (!["Technical", "Non-Technical", "Workshop"].includes(normalizedEventType)) {
      return res.status(400).json({ error: "Event type must be Technical, Non-Technical, or Workshop." });
    }

    const baseEventId = String(eventId || title || "event")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event";
    const normalizedEventId = `${baseEventId}-${Date.now().toString(36)}`;

    const exists = await Event.findOne({ eventId: normalizedEventId }).lean();
    if (exists) return res.status(409).json({ error: "Event id already exists." });

    let parsedRules = [];
    if (Array.isArray(rules)) parsedRules = rules.filter(Boolean);
    else if (typeof rules === "string") {
      try {
        const maybeArray = JSON.parse(rules);
        parsedRules = Array.isArray(maybeArray) ? maybeArray.filter(Boolean) : [];
      } catch {
        parsedRules = rules.split("\n").map((x) => x.trim()).filter(Boolean);
      }
    }

    let parsedSubEvents = [];
    if (Array.isArray(subEvents)) parsedSubEvents = subEvents;
    else if (typeof subEvents === "string") {
      try {
        const maybeArray = JSON.parse(subEvents);
        parsedSubEvents = Array.isArray(maybeArray) ? maybeArray : [];
      } catch {
        parsedSubEvents = [];
      }
    }

    const finalFee = Number(fee || 0);
    const normalizedTeamSize = Math.max(1, Number(teamSize || 1));
    const derivedIsTeamEvent = normalizedTeamSize > 1;

    const event = new Event({
      eventId: normalizedEventId,
      department: coordinator.department || "General",
      eventType: normalizedEventType,
      title: String(title).trim(),
      displayPrize: String(displayPrize || "").trim(),
      displayTeamSize: String(displayTeamSize || "").trim(),
      shortDescription: String(shortDescription).trim(),
      description: String(description).trim(),
      fee: finalFee,
      paymentQrUrl: "",
      whatsappGroupLink: normalizedWhatsappGroupLink,
      isTeamEvent: derivedIsTeamEvent,
      teamSize: normalizedTeamSize,
      time: String(time || "").trim() || "To be announced",
      address: String(address || "").trim() || "To be announced",
      guide: coordinator.name,
      guidePhone: coordinator.phone || "N/A",
      registrationClosed: false,
      posterUrl: "",
      rules: parsedRules,
      subEvents: parsedSubEvents
        .map((sub) => ({
          subEventId: String(sub.subEventId || "").trim(),
          title: String(sub.title || "").trim(),
          description: String(sub.description || "").trim(),
          isTeamEvent: Boolean(sub.isTeamEvent),
          teamSize: Number(sub.teamSize || 1),
          fee: Number(sub.fee || 0),
          address: String(sub.address || "").trim(),
          time: String(sub.time || "").trim(),
          guide: String(sub.guide || coordinator.name).trim(),
          guidePhone: String(sub.guidePhone || coordinator.phone || "N/A").trim(),
          rules: Array.isArray(sub.rules) ? sub.rules.filter(Boolean) : []
        }))
        .filter((sub) => sub.subEventId && sub.title),
      coordinatorId: coordinator._id,
      status: "pending"
    });

    const finalPaymentQrUrl = req.files?.paymentQr?.[0]
      ? buildImageUrl(req, "events", event._id, "paymentQr")
      : String(paymentQrUrl || coordinator.paymentQrUrl || "").trim();
    if (finalFee > 0 && !finalPaymentQrUrl) {
      return res.status(400).json({ error: "Payment QR is required for paid events." });
    }

    if (req.files?.poster?.[0]) setStoredImage(event, "poster", req.files.poster[0], req, "events");
    else setImageFromBodyValue(event, "poster", posterUrl);

    if (req.files?.paymentQr?.[0]) setStoredImage(event, "paymentQr", req.files.paymentQr[0], req, "events");
    else event.paymentQrUrl = finalPaymentQrUrl;

    await event.save();

    return res.status(201).json({
      message: "Event added and sent for admin approval.",
      event
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Failed to add event." });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, coordinatorId: req.user.id }).lean();
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (isSignatureCoordinator(req)) {
      const signatureTitle = String(process.env.SIGNATURE_EVENT_TITLE || "Project Competition").trim().toLowerCase();
      if (!String(event.title || "").toLowerCase().includes(signatureTitle)) {
        return res.status(403).json({ error: "Not allowed for signature coordinator." });
      }
    }
    return res.json({ event });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load event." });
  }
});

router.put("/events/:id", upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "paymentQr", maxCount: 1 }
]), async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, coordinatorId: req.user.id });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (isSignatureCoordinator(req)) {
      const signatureTitle = String(process.env.SIGNATURE_EVENT_TITLE || "Project Competition").trim().toLowerCase();
      if (!signatureTitle || !String(event.title || "").toLowerCase().includes(signatureTitle)) {
        return res.status(403).json({ error: "Signature coordinator can only update the signature event." });
      }
    }

    const {
      title,
      eventType,
      displayPrize,
      displayTeamSize,
      shortDescription,
      description,
      fee,
      teamSize,
      time,
      address,
      posterUrl,
      paymentQrUrl,
      whatsappGroupLink,
      rules
    } = req.body || {};

    if (title !== undefined) event.title = String(title).trim();
    if (eventType !== undefined) {
      const normalizedEventType = String(eventType || "").trim();
      if (normalizedEventType && !["Technical", "Non-Technical", "Workshop"].includes(normalizedEventType)) {
        return res.status(400).json({ error: "Event type must be Technical, Non-Technical, or Workshop." });
      }
      if (normalizedEventType) event.eventType = normalizedEventType;
    }
    if (displayPrize !== undefined) event.displayPrize = String(displayPrize || "").trim();
    if (displayTeamSize !== undefined) event.displayTeamSize = String(displayTeamSize || "").trim();
    if (shortDescription !== undefined) event.shortDescription = String(shortDescription).trim();
    if (description !== undefined) event.description = String(description).trim();
    if (fee !== undefined) event.fee = Number(fee || 0);
    if (teamSize !== undefined) event.teamSize = Math.max(1, Number(teamSize || 1));
    if (time !== undefined) event.time = String(time || "").trim() || "To be announced";
    if (address !== undefined) event.address = String(address || "").trim() || "To be announced";
    if (whatsappGroupLink !== undefined) {
      const normalizedWhatsappGroupLink = String(whatsappGroupLink || "").trim();
      if (!normalizedWhatsappGroupLink) {
        return res.status(400).json({ error: "WhatsApp group link is required." });
      }
      if (!/^https?:\/\/\S+$/i.test(normalizedWhatsappGroupLink)) {
        return res.status(400).json({ error: "Enter a valid WhatsApp group link." });
      }
      event.whatsappGroupLink = normalizedWhatsappGroupLink;
    }

    if (rules !== undefined) {
      let parsedRules = [];
      if (Array.isArray(rules)) parsedRules = rules.filter(Boolean);
      else if (typeof rules === "string") {
        try {
          const maybeArray = JSON.parse(rules);
          parsedRules = Array.isArray(maybeArray) ? maybeArray.filter(Boolean) : [];
        } catch {
          parsedRules = rules.split("\n").map((x) => x.trim()).filter(Boolean);
        }
      }
      event.rules = parsedRules;
    }
    if (req.body?.registrationClosed !== undefined) {
      event.registrationClosed = String(req.body.registrationClosed) === "true";
    }

    if (req.files?.poster?.[0]) setStoredImage(event, "poster", req.files.poster[0], req, "events");
    else setImageFromBodyValue(event, "poster", posterUrl);

    if (req.files?.paymentQr?.[0]) setStoredImage(event, "paymentQr", req.files.paymentQr[0], req, "events");
    else setImageFromBodyValue(event, "paymentQr", paymentQrUrl);

    if (Number(event.fee || 0) > 0 && !String(event.paymentQrUrl || "").trim()) {
      return res.status(400).json({ error: "Payment QR is required for paid events." });
    }

    event.isTeamEvent = Number(event.teamSize || 1) > 1;
    event.status = "pending";
    event.approvedAt = undefined;
    await event.save();

    return res.json({ message: "Event updated and sent for admin approval.", event });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Failed to update event." });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    if (isSignatureCoordinator(req)) {
      return res.status(403).json({ error: "Not allowed for signature coordinator." });
    }
    const event = await Event.findOneAndDelete({ _id: req.params.id, coordinatorId: req.user.id });
    if (!event) return res.status(404).json({ error: "Event not found." });
    return res.json({ message: "Event deleted." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to delete event." });
  }
});

router.patch("/events/:id/registration", async (req, res) => {
  try {
    if (isSignatureCoordinator(req)) {
      return res.status(403).json({ error: "Not allowed for signature coordinator." });
    }
    const event = await Event.findOne({ _id: req.params.id, coordinatorId: req.user.id });
    if (!event) return res.status(404).json({ error: "Event not found." });
    event.registrationClosed = Boolean(req.body?.closed);
    await event.save();
    return res.json({ message: "Registration status updated.", event });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to update registration status." });
  }
});

router.delete("/participants/demo", async (req, res) => {
  try {
    const pattern = /(demo|fake|test)/i;
    let eventIds = [];
    if (isSignatureCoordinator(req)) {
      const signatureEvent = await getSignatureEventForCoordinator(req.user.id);
      if (signatureEvent?.eventId) eventIds = [signatureEvent.eventId];
    } else {
      const events = await Event.find({ coordinatorId: req.user.id }).select({ eventId: 1 }).lean();
      eventIds = events.map((e) => e.eventId);
    }

    const filter = eventIds.length ? { eventId: { $in: eventIds } } : null;
    if (!filter) return res.json({ deleted: 0 });

    const result = await Registration.deleteMany({
      ...filter,
      $or: [
        { fullName: { $regex: pattern } },
        { email: { $regex: pattern } },
        { teamMembers: { $regex: pattern } },
        { studentCollege: { $regex: pattern } },
        { studentDepartment: { $regex: pattern } },
        { eventName: { $regex: pattern } }
      ]
    });

    return res.json({ deleted: result.deletedCount || 0 });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to remove demo participants." });
  }
});

router.delete("/participants/:id", async (req, res) => {
  try {
    const participant = await Registration.findById(req.params.id).lean();
    if (!participant) return res.status(404).json({ error: "Participant not found." });

    let allowedEventIds = [];
    if (isSignatureCoordinator(req)) {
      const signatureEvent = await getSignatureEventForCoordinator(req.user.id);
      if (signatureEvent?.eventId) allowedEventIds = [signatureEvent.eventId];
    } else {
      const events = await Event.find({ coordinatorId: req.user.id }).select({ eventId: 1 }).lean();
      allowedEventIds = events.map((e) => e.eventId);
    }

    if (!allowedEventIds.includes(String(participant.eventId || ""))) {
      return res.status(403).json({ error: "Not allowed to remove this participant." });
    }

    await Registration.deleteOne({ _id: participant._id });
    return res.json({ message: "Participant removed." });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to remove participant." });
  }
});

module.exports = router;
