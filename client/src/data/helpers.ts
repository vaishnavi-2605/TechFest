import { BackendEvent, Event } from "@/types";

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const MONTH_MAP: Record<string, number> = {
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
  dec: 11, december: 11,
};

export function parseEventDate(timeText?: string) {
  const dateText = String(timeText || "").split("|")[0].trim();
  const numericMatch = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]) - 1;
    const year = Number(numericMatch[3]);
    const numericDate = new Date(year, month, day);
    if (
      !Number.isNaN(numericDate.getTime()) &&
      numericDate.getFullYear() === year &&
      numericDate.getMonth() === month &&
      numericDate.getDate() === day
    ) {
      return numericDate;
    }
  }

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

  return new Date("");
}

export function formatDateLabel(timeText?: string) {
  const parsed = parseEventDate(timeText);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = String(parsed.getFullYear());
    return `${day}/${month}/${year}`;
  }
  return String(timeText || "").split("|")[0].trim() || "To be announced";
}

export function formatShortDateLabel(timeText?: string) {
  const parsed = parseEventDate(timeText);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return String(timeText || "").split("|")[0].trim() || "To be announced";
}

export function formatTimeLabel(timeText?: string) {
  const parts = String(timeText || "").split("|").map((x) => x.trim()).filter(Boolean);
  return parts[1] || parts[0] || "To be announced";
}

export function parseEventDateTime(timeText?: string) {
  const parsedDate = parseEventDate(timeText);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const parts = String(timeText || "").split("|").map((x) => x.trim()).filter(Boolean);
  const timePart = parts[1] || "";
  if (!timePart) return null;

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
    minutes,
  );
}

export function isRegistrationClosed(timeText?: string, now = new Date()) {
  const eventDateTime = parseEventDateTime(timeText);
  if (!eventDateTime || Number.isNaN(eventDateTime.getTime())) return false;

  const closeTime = new Date(eventDateTime.getTime() - 12 * 60 * 60 * 1000);
  return now >= closeTime;
}

export function formatDescriptionText(description?: string) {
  const raw = String(description || "").trim();
  if (!raw) return "";
  let text = raw;
  text = text.replace(/Rounds?:\s*/i, "Rounds:\n");
  text = text.replace(/\s*(Round\s*\d+[:\-]?)/gi, "\n$1");
  text = text.replace(/\.\s+/g, ".\n");
  return text.replace(/\n{2,}/g, "\n").trim();
}

export function resolveApiAssetUrl(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.pathname.startsWith("/api/images/") || url.pathname.startsWith("/uploads/")) {
        return API_BASE ? `${API_BASE}${url.pathname}${url.search}` : `${url.pathname}${url.search}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  if (raw.startsWith("/")) {
    return API_BASE ? `${API_BASE}${raw}` : raw;
  }

  const normalizedPath = raw.replace(/^\/+/, "");
  return API_BASE ? `${API_BASE}/${normalizedPath}` : `/${normalizedPath}`;
}

export function getCategoryFromDepartment(department?: string): Event["category"] {
  const value = String(department || "").toLowerCase();
  if (value.includes("computer") || value.includes("ai") || value.includes("data") || value.includes("electronics") || value.includes("electrical") || value.includes("mechanical")) {
    return "Technical";
  }
  if (value.includes("civil") || value.includes("management") || value.includes("commerce")) {
    return "Non-Technical";
  }
  return "Workshops";
}

export function formatBackendEvent(event: BackendEvent): Event {
  const maxTeam = Number(event.teamSize || 1);
  const deadlineDate = parseEventDate(event.time);
  const deadline = !Number.isNaN(deadlineDate.getTime())
    ? new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate() - 1)
    : null;

  return {
    id: event.eventId,
    eventId: event.eventId,
    name: event.title,
    description: event.shortDescription || event.description,
    shortDescription: event.shortDescription || "",
    category: (event.displayCategory as Event["category"]) || getCategoryFromDepartment(event.department),
    teamSize: event.displayTeamSize || (event.isTeamEvent && maxTeam > 1 ? `1-${maxTeam}` : "1"),
    prize: event.displayPrize || (event.fee > 0 ? `₹ ${event.fee}` : "Free"),
    displayPrize: event.displayPrize || "",
    deadline: event.displayDeadline || (deadline
      ? `${String(deadline.getDate()).padStart(2, "0")}/${String(deadline.getMonth() + 1).padStart(2, "0")}/${deadline.getFullYear()}`
      : "Open"),
    posterUrl: resolveApiAssetUrl(event.posterUrl),
    department: event.department,
    fee: event.fee,
    address: event.address,
    guide: event.guide,
    guidePhone: event.guidePhone,
    venue: event.address,
    time: event.time,
  };
}

export function generateRegistrationId(eventId: string) {
  const stamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100);
  return `TF-${eventId.split("-")[0].toUpperCase()}-${stamp}${random}`;
}

export function openPrintPassWindow(passData: {
  registrationId: string;
  fullName: string;
  eventName: string;
  department?: string;
  address?: string;
  time?: string;
  guide?: string;
  guidePhone?: string;
  paymentRef?: string;
}) {
  const printWin = window.open("", "_blank", "width=760,height=900");
  if (!printWin) return;

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Event Pass - ${passData.registrationId}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 28px; background: #09111f; color: #eaf2ff; }
        .pass { max-width: 680px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.18); border-radius: 20px; padding: 24px; background: linear-gradient(135deg, #111b35, #0d1530); }
        h1 { margin: 0 0 16px; font-size: 28px; }
        p { margin: 10px 0; line-height: 1.45; font-size: 15px; }
        .id { font-size: 18px; font-weight: bold; color: #60d8ff; }
      </style>
    </head>
    <body>
      <div class="pass">
        <h1>TechFest 2026 Event Pass</h1>
        <p class="id">Registration ID: ${passData.registrationId}</p>
        <p><strong>Name:</strong> ${passData.fullName}</p>
        <p><strong>Event:</strong> ${passData.eventName}</p>
        <p><strong>Department:</strong> ${passData.department || "N/A"}</p>
        <p><strong>Venue:</strong> ${passData.address || "To be announced"}</p>
        <p><strong>Reporting Time:</strong> ${passData.time ? `${formatDateLabel(passData.time)} | ${formatTimeLabel(passData.time)}` : "To be announced"}</p>
        <p><strong>Coordinator:</strong> ${passData.guide || "Coordinator"}</p>
        <p><strong>Coordinator Phone:</strong> ${passData.guidePhone || "N/A"}</p>
        <p><strong>Payment Ref:</strong> ${passData.paymentRef || "Not Required"}</p>
      </div>
      <script>
        window.onload = function () { window.print(); };
      <\/script>
    </body>
    </html>
  `);
  printWin.document.close();
}
