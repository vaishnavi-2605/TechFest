import { useState, useEffect } from "react";
import { parseEventDate } from "@/data/helpers";

function parseEventDateTime(timeText?: string) {
  const raw = String(timeText || "").trim();
  if (!raw) return null;

  const parts = raw.split("|").map((item) => item.trim()).filter(Boolean);
  const date = parseEventDate(parts[0] || raw);
  if (Number.isNaN(date.getTime())) return null;

  let hours = 0;
  let minutes = 0;
  const timePart = parts[1] || "";
  const match = timePart.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);

  if (match) {
    hours = Number(match[1] || 0);
    minutes = Number(match[2] || 0);
    const ampm = String(match[3] || "").toLowerCase();

    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.min(Math.max(hours, 0), 23),
    Math.min(Math.max(minutes, 0), 59),
    0,
    0
  );
}

const CountdownTimer = ({ targetTimeText }: { targetTimeText?: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = parseEventDateTime(targetTimeText)?.getTime() || null;

    const update = () => {
      if (!targetDate) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const diff = Math.max(0, targetDate - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetTimeText]);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 w-full">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="glass-card px-4 py-3 md:px-6 md:py-4 min-w-[60px] md:min-w-[80px] text-center glow-violet">
            <span className="font-heading text-2xl md:text-4xl font-bold gradient-text">
              {String(value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs md:text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
