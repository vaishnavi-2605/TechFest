import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/data/api";
import { formatBackendEvent, resolveApiAssetUrl } from "@/data/helpers";
import { BackendEvent } from "@/types";

const eventFilterOptions = ["All", "Technical", "Non-Technical", "Workshop"] as const;
const EVENTS_CACHE_KEY = "techfestPublicEventsCache";

function matchesEventFilter(category: string, filter: (typeof eventFilterOptions)[number]) {
  if (filter === "All") return true;
  if (filter === "Workshop") return category === "Workshops";
  return category === filter;
}

function readCachedEvents() {
  if (typeof window === "undefined") return [];

  try {
    const cached = JSON.parse(sessionStorage.getItem(EVENTS_CACHE_KEY) || "null") as { events?: BackendEvent[] } | null;
    return Array.isArray(cached?.events) ? cached.events : [];
  } catch {
    return [];
  }
}

const EventsPage = () => {
  const [events, setEvents] = useState<BackendEvent[]>(() => readCachedEvents());
  const [activeFilter, setActiveFilter] = useState<(typeof eventFilterOptions)[number]>("All");
  const [loading, setLoading] = useState(events.length === 0);
  const [previewSignaturePoster, setPreviewSignaturePoster] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then((data) => {
        const nextEvents = data.events || [];
        setEvents(nextEvents);
        sessionStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify({ events: nextEvents }));
      })
      .catch(() => {
        setEvents((current) => (current.length ? current : []));
      })
      .finally(() => setLoading(false));
  }, []);

  const formattedEvents = useMemo(() => events.map(formatBackendEvent), [events]);
  const filteredEvents = useMemo(
    () => formattedEvents.filter((event) => matchesEventFilter(event.category, activeFilter)),
    [activeFilter, formattedEvents]
  );
  const signatureEvent = useMemo(
    () =>
      formattedEvents.find((event) => event.isSignatureEvent) ||
      formattedEvents.find((event) => String(event.name || "").toLowerCase().includes("project competition")),
    [formattedEvents]
  );
  const regularEvents = useMemo(
    () => filteredEvents.filter((event) => event.id !== signatureEvent?.id),
    [filteredEvents, signatureEvent]
  );

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <SectionHeader title="All Events" subtitle="Explore our complete lineup of competitions, workshops, and more." />
        {signatureEvent ? (
          <div className="mb-10">
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-heading font-bold signature-title mb-2">
                Signature Event: Project Competition
              </h3>
              <p className="text-muted-foreground">Our flagship competition showcasing innovation and excellence</p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="glass-card signature-card p-6 card-hover-glow border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                {resolveApiAssetUrl(signatureEvent.posterUrl) ? (
                  <div className="mb-4 flex items-center justify-center">
                    <div className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-card/40 p-2">
                    <button
                      type="button"
                      onClick={() => setPreviewSignaturePoster(resolveApiAssetUrl(signatureEvent.posterUrl) || null)}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      aria-label="View signature poster"
                    >
                      <img
                        src={resolveApiAssetUrl(signatureEvent.posterUrl)}
                        alt={signatureEvent.name}
                        className="max-h-64 w-auto object-contain"
                      />
                    </button>
                    </div>
                  </div>
                ) : null}
                <div className="text-center mb-4">
                  <h4 className="text-xl font-heading font-bold text-foreground mb-2">
                    {signatureEvent.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {signatureEvent.shortDescription || signatureEvent.description}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {signatureEvent.prize && (
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Prize: {signatureEvent.prize}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                      {signatureEvent.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                      {signatureEvent.teamSize}
                    </span>
                  </div>
                  <Link
                    to={`/events/${signatureEvent.id}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold hover:scale-105 transition-all shadow-lg hover:shadow-[0_0_20px_hsl(263,84%,58%,0.3)]"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {eventFilterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setActiveFilter(option)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeFilter === option
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  : "border border-white/15 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {loading && !events.length ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Loading events...
          </p>
        ) : !regularEvents.length ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            No events found for the selected category.
          </p>
        ) : (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {regularEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </motion.div>
        )}
      </div>
      {previewSignaturePoster ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewSignaturePoster(null)}>
          <div
            className="relative w-full max-w-[820px] rounded-2xl border border-white/10 bg-card/95 p-6 pt-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewSignaturePoster(null)}
              className="absolute right-2 top-2 z-20 rounded-full bg-black/80 px-3 py-1 text-xs text-white shadow-lg hover:bg-black"
            >
              Close
            </button>
            <div className="w-full max-h-[85vh] flex items-center justify-center">
              <img src={previewSignaturePoster} alt="Signature event poster" className="max-h-[85vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EventsPage;
