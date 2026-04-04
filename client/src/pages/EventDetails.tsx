import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import RegisterAction from "@/components/RegisterAction";
import SectionHeader from "@/components/SectionHeader";
import { fetchEvent } from "@/data/api";
import { formatBackendEvent, formatDateLabel, formatDescriptionText, formatTimeLabel, resolveApiAssetUrl } from "@/data/helpers";
import { BackendEvent } from "@/types";
import { BadgeCheck, Calendar, Clock, Image as ImageIcon, MapPin, Trophy } from "lucide-react";

const EVENTS_CACHE_KEY = "techfestPublicEventsCache:v2";
const EVENT_DETAILS_CACHE_PREFIX = "techfestEventDetailsCache:v2:";

function isTechTankTitle(title?: string) {
  return /tech[\s-]?tank/i.test(String(title || ""));
}

function hasNegativeRewardSignal(line: string) {
  return /(no prize|without prize|prize not available|no certificate|without certificate|certificate not available|no completion certificate|no participation certificate|not applicable|n\/a|none)/i.test(line);
}

function readCachedEvent(eventId: string) {
  if (typeof window === "undefined" || !eventId) return null;

  try {
    const detailsCache = JSON.parse(sessionStorage.getItem(`${EVENT_DETAILS_CACHE_PREFIX}${eventId}`) || "null") as { event?: BackendEvent | null } | null;
    if (detailsCache?.event?.eventId === eventId) return detailsCache.event;
  } catch {
    // ignore malformed cache
  }

  try {
    const eventsCache = JSON.parse(sessionStorage.getItem(EVENTS_CACHE_KEY) || "null") as { events?: BackendEvent[] } | null;
    const match = (eventsCache?.events || []).find((item) => item?.eventId === eventId);
    return match || null;
  } catch {
    return null;
  }
}

const EventDetailsPage = () => {
  const { eventId = "" } = useParams();
  const [event, setEvent] = useState<BackendEvent | null>(() => readCachedEvent(eventId));
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(!readCachedEvent(eventId));
  const [previewPoster, setPreviewPoster] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCachedEvent(eventId);
    if (cached) {
      setEvent(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchEvent(eventId)
      .then((data) => {
        const nextEvent = data.event || null;
        setEvent(nextEvent);
        if (nextEvent) {
          try {
            sessionStorage.setItem(`${EVENT_DETAILS_CACHE_PREFIX}${eventId}`, JSON.stringify({ event: nextEvent }));
          } catch (_error) {
            // Ignore storage quota errors.
          }
        }
      })
      .catch((error) => setAlert(error instanceof Error ? error.message : "Failed to load event."))
      .finally(() => setLoading(false));
  }, [eventId]);

  const formatted = useMemo(() => (event ? formatBackendEvent(event) : null), [event]);
  const formattedDescription = useMemo(() => formatDescriptionText(event?.description), [event?.description]);
  const eventTypeLabel = useMemo(() => {
    if (isTechTankTitle(event?.title)) return "Technical";
    const raw = String(event?.eventType || event?.displayCategory || formatted?.category || "").trim();
    if (!raw) return "N/A";
    if (raw.toLowerCase().startsWith("workshop")) return "Workshop";
    if (raw.toLowerCase().includes("non")) return "Non-Technical";
    if (raw.toLowerCase().includes("tech")) return "Technical";
    return raw;
  }, [event?.eventType, event?.displayCategory, formatted?.category]);
  const rewardText = useMemo(() => String(event?.displayPrize || "").trim(), [event?.displayPrize]);
  const rewardLines = useMemo(
    () => rewardText.split("\n").map((line) => line.trim()).filter(Boolean),
    [rewardText]
  );
  const prizeLines = useMemo(
    () => rewardLines.filter((line) => /prize|cash|reward|winner|runner/i.test(line) && !/cert/i.test(line) && !hasNegativeRewardSignal(line)),
    [rewardLines]
  );
  const certificateLines = useMemo(
    () => rewardLines.filter((line) => /cert|certificate|completion|participation/i.test(line) && !hasNegativeRewardSignal(line)),
    [rewardLines]
  );

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <SectionHeader title="Event Details" subtitle="View the full event information and poster." />

        {!!alert && <p className="text-sm text-destructive mb-4">{alert}</p>}
        {loading && !event ? <p className="text-sm text-muted-foreground mb-4">Loading event details...</p> : null}

        {event && formatted ? (
          <>
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              {formatted.category !== "Workshops" ? (
                <span className="inline-flex px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-3">
                  {formatted.category}
                </span>
              ) : null}
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{formatted.name}</h2>
            </motion.div>

            <div className="space-y-6">
            <div className="max-w-4xl mx-auto">
              {resolveApiAssetUrl(formatted.posterUrl) ? (
                <motion.button
                  type="button"
                  onClick={() => setPreviewPoster(resolveApiAssetUrl(formatted.posterUrl) || null)}
                  className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-2xl"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                >
                  <img
                    src={resolveApiAssetUrl(formatted.posterUrl)}
                    alt={formatted.name}
                    className="w-full max-h-[420px] md:max-h-[520px] object-contain"
                  />
                </motion.button>
              ) : (
                <motion.div
                  className="w-full min-h-80 rounded-2xl border border-dashed border-white/15 bg-card/30 flex flex-col items-center justify-center gap-2 text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                >
                  <ImageIcon className="w-8 h-8" />
                  <span>No poster available</span>
                </motion.div>
              )}
            </div>

            {event.shortDescription ? (
              <motion.p
                className="text-foreground/80 text-base font-medium"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.42 }}
              >
                {event.shortDescription}
              </motion.p>
            ) : null}

            <motion.p
              className="text-muted-foreground whitespace-pre-line"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.45 }}
            >
              {formattedDescription || event.description}
            </motion.p>

            <motion.div
              className="space-y-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut", delay: 0.6 }}
            >
              {prizeLines.length ? (
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <div className="space-y-2">
                    {prizeLines.map((line, index) => (
                      <div key={`${line}-${index}`} className="flex items-start gap-2 text-foreground font-semibold">
                        <Trophy className="w-4 h-4 mt-0.5 text-amber-400" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {certificateLines.length ? (
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <div className="space-y-2">
                    {certificateLines.map((line, index) => (
                      <div key={`${line}-${index}`} className="flex items-start gap-2 text-foreground font-semibold">
                        <BadgeCheck className="w-4 h-4 mt-0.5 text-emerald-400" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Department</p>
                  <p className="text-foreground font-semibold">{event.department}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Event Type</p>
                  <p className="text-foreground font-semibold">{eventTypeLabel}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Team Size</p>
                  <p className="text-foreground font-semibold">{formatted.teamSize}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                  <p className="text-foreground font-semibold">{formatted.deadline}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date</span>
                  </div>
                  <p className="text-foreground font-semibold">{formatDateLabel(event.time)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Time</span>
                  </div>
                  <p className="text-foreground font-semibold">{formatTimeLabel(event.time)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/30 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Venue</span>
                  </div>
                  <p className="text-foreground font-semibold">{event.address || "To be announced"}</p>
                </div>
              </div>

              {!!event.rules?.length && (
                <div className="rounded-xl border border-white/10 bg-card/30 p-4">
                  <p className="text-xs text-muted-foreground mb-3">Rules</p>
                  <ul className="space-y-2 text-sm text-foreground/85 list-disc pl-5">
                    {event.rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <RegisterAction
                  eventId={event.eventId}
                  timeText={event.time}
                  registrationClosed={Boolean(event.registrationClosed)}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold text-center"
                />
                <Link to="/events" className="px-6 py-3 rounded-lg border border-white/15 text-muted-foreground text-center">
                  Back to Events
                </Link>
              </div>
            </motion.div>
            </div>
          </>
        ) : null}
        {previewPoster ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewPoster(null)}>
            <div
              className="relative w-full max-w-[820px] rounded-2xl border border-white/10 bg-card/95 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewPoster(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-xs text-white hover:bg-black/80"
              >
                Close
              </button>
              <div className="w-full max-h-[85vh] flex items-center justify-center">
                <img src={previewPoster} alt={formatted?.name || "Event poster"} className="max-h-[85vh] w-auto object-contain rounded-xl" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EventDetailsPage;
