import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/SectionHeader";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/data/api";
import { formatBackendEvent } from "@/data/helpers";
import { BackendEvent } from "@/types";

const EventsPage = () => {
  const [events, setEvents] = useState<BackendEvent[]>([]);

  useEffect(() => {
    fetchEvents()
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, []);

  const formattedEvents = useMemo(() => events.map(formatBackendEvent), [events]);

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <SectionHeader title="All Events" subtitle="Explore our complete lineup of competitions, workshops, and more." />

        <motion.div
          key="events"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {formattedEvents.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default EventsPage;
