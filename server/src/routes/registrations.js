const express = require("express");
const Registration = require("../models/Registration");
const Event = require("../models/Event");

const router = express.Router();

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

function parseEventDate(timeText) {
  const dateText = String(timeText || "").split("|")[0].trim();
  const direct = new Date(dateText);
  if (!Number.isNaN(direct.getTime())) return direct;

  const normalized = dateText
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .replace(/[,./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  let match = normalized.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (match) {
    const day = Number(match[1]);
    const month = MONTH_MAP[match[2]];
    const year = Number(match[3] || new Date().getFullYear());
    if (Number.isInteger(month) && day >= 1 && day <= 31) return new Date(year, month, day);
  }

  match = normalized.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?/);
  if (match) {
    const month = MONTH_MAP[match[1]];
    const day = Number(match[2]);
    const year = Number(match[3] || new Date().getFullYear());
    if (Number.isInteger(month) && day >= 1 && day <= 31) return new Date(year, month, day);
  }

  return null;
}

function parseEventDateTime(timeText) {
  const parsedDate = parseEventDate(timeText);
  if (!parsedDate) return null;

  const parts = String(timeText || "").split("|").map((part) => part.trim()).filter(Boolean);
  const timePart = parts[1] || "";
  if (!timePart) return parsedDate;

  const match = timePart.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return parsedDate;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridian = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return parsedDate;

  if (meridian) {
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
  }

  if (hours > 23) return parsedDate;

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    hours,
    minutes
  );
}

function isRegistrationClosed(timeText) {
  const eventDateTime = parseEventDateTime(timeText);
  if (!eventDateTime) return false;
  const cutoff = new Date(eventDateTime.getTime() - 12 * 60 * 60 * 1000);
  return new Date() >= cutoff;
}

function validateRegistration(body, event) {
  const required = ["fullName", "email", "eventId", "studentCollege", "studentDepartment", "studentYear"];
  const missing = required.filter((key) => !String(body?.[key] || "").trim());
  if (missing.length) return `Missing required fields: ${missing.join(", ")}.`;

  const isTeamEvent = Boolean(event?.isTeamEvent) || Number(event?.teamSize || 1) > 1;
  if (!isTeamEvent && String(body.fullName).trim().split(/\s+/).length < 2) {
    return "Please enter full name (first and last name).";
  }

  if (!/^\d{10}$/.test(String(body.phone || "").trim())) {
    return "Phone number must be exactly 10 digits.";
  }

  return null;
}

function buildPrefix(sourceText) {
  const words = String(sourceText || "")
    .trim()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
  const initials = words.map((word) => word[0]).join("").toUpperCase();
  let prefix = initials.slice(0, 3);
  if (prefix.length < 2) {
    const letters = words.join("").toUpperCase().replace(/[^A-Z0-9]/g, "");
    prefix = letters.slice(0, 3);
  }
  if (prefix.length < 2) {
    prefix = "EV";
  } else if (prefix.length === 2) {
    prefix = prefix.slice(0, 2);
  } else {
    prefix = prefix.slice(0, 3);
  }
  return prefix;
}

async function generateRegistrationId(event) {
  const prefix = buildPrefix(event?.title || event?.eventId || "EV");
  const baseCount = await Registration.countDocuments({ eventId: String(event.eventId || "").trim() });
  const serial = 1000 + Number(baseCount || 0);
  return `${prefix}-${String(serial).padStart(4, "0")}`;
}

router.get("/", async (_req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 }).lean();
    res.json({ registrations });
  } catch (_error) {
    res.status(500).json({ error: "Failed to read registrations." });
  }
});

router.post("/", async (req, res) => {
  try {
    const event = await Event.findOne({
      eventId: String(req.body.eventId || "").trim(),
      $or: [{ status: "active" }, { status: { $exists: false } }]
    }).lean();

    if (!event) return res.status(404).json({ error: "Event not found or not active." });

    const validationError = validateRegistration(req.body, event);
    if (validationError) return res.status(400).json({ error: validationError });

    const selectedSubEvent = String(req.body.subEventId || "").trim()
      ? (event.subEvents || []).find((sub) => sub.subEventId === String(req.body.subEventId || "").trim())
      : null;

    const effectiveTime = selectedSubEvent?.time || event.time;
    if (event.registrationClosed || isRegistrationClosed(effectiveTime)) {
      return res.status(400).json({ error: "Registration is closed 12 hours before the event start time." });
    }

    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();

    const existing = await Registration.findOne({
      normalizedEmail,
      eventId: String(req.body.eventId || "").trim()
    }).lean();

    if (existing) {
      return res.status(409).json({ error: "You have already registered for this event with this email." });
    }

    let registrationId = await generateRegistrationId(event);
    let registration = null;
    let attempts = 0;
    while (!registration && attempts < 5) {
      try {
        registration = await Registration.create({
          ...req.body,
          registrationId,
          normalizedEmail
        });
      } catch (error) {
        if (error?.code === 11000 && error?.keyPattern?.registrationId) {
          attempts += 1;
          const nextSerial = 1000 + (await Registration.countDocuments({ eventId: String(req.body.eventId || "").trim() }));
          registrationId = `${buildPrefix(event?.title || event?.eventId || "EV")}-${String(nextSerial).padStart(4, "0")}`;
        } else {
          throw error;
        }
      }
    }

    if (!registration) {
      return res.status(500).json({ error: "Failed to generate registration id." });
    }

    return res.status(201).json({ message: "Registration saved.", registration });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to save registration." });
  }
});

module.exports = router;
