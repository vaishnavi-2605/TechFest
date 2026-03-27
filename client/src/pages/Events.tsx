import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/SectionHeader";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/data/api";
import { formatBackendEvent } from "@/data/helpers";
import { BackendEvent } from "@/types";

const eventFilterOptions = ["All", "Technical", "Non-Technical", "Workshop"] as const;

function matchesEventFilter(category: string, filter: (typeof eventFilterOptions)[number]) {
  if (filter === "All") return true;
  if (filter === "Workshop") return category === "Workshops";
  return category === filter;
}

const EventsPage = () => {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<(typeof eventFilterOptions)[number]>("All");

  useEffect(() => {
    fetchEvents()
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, []);

  const formattedEvents = useMemo(() => events.map(formatBackendEvent), [events]);
  const filteredEvents = useMemo(
    () => formattedEvents.filter((event) => matchesEventFilter(event.category, activeFilter)),
    [activeFilter, formattedEvents]
  );

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <SectionHeader title="All Events" subtitle="Explore our complete lineup of competitions, workshops, and more." />
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

        {!filteredEvents.length ? (
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
            {filteredEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
