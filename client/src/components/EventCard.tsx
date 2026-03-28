import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Image as ImageIcon, Users, Trophy, Clock } from "lucide-react";
import RegisterAction from "@/components/RegisterAction";
import { formatDescriptionText, resolveApiAssetUrl } from "@/data/helpers";
import { Event } from "@/types";

const categoryColors = {
  Technical: "bg-primary/20 text-primary",
  "Non-Technical": "bg-secondary/20 text-secondary",
  Workshops: "bg-amber-500/20 text-amber-400",
};

const EventCard = ({ event, index }: { event: Event; index: number }) => {
  const prizeNumbers = (event.displayPrize || "").match(/[\d,]+/g) || [];
  const prizeText = prizeNumbers.length ? prizeNumbers.join(", ") : "TBA";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="glass-card card-hover-glow p-6 flex flex-col gap-4 group h-full"
    >
      <div className="w-full h-48 rounded-xl border border-white/10 overflow-hidden bg-card/40">
        {resolveApiAssetUrl(event.posterUrl) ? (
          <img
            src={resolveApiAssetUrl(event.posterUrl)}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
            <span>Poster not available</span>
          </div>
        )}
      </div>
      <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[event.category]}`}>
        {event.category}
      </span>
      <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors min-h-[3rem] break-words">
        {event.name}
      </h3>
      <p className="text-sm text-muted-foreground whitespace-pre-line flex-1">
        {formatDescriptionText(event.shortDescription || event.description)}
      </p>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.teamSize}</span>
        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> ₹ {prizeText}</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.deadline}</span>
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
        <Link
          to={event.eventId ? `/events/${event.eventId}` : "/events"}
          className="py-2.5 px-4 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/10 transition-all hover:border-primary/60 text-center"
        >
          View Details
        </Link>
        <RegisterAction
          eventId={event.eventId}
          timeText={event.time}
          label="Register"
          className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold text-center"
        />
      </div>
    </motion.div>
  );
};

export default EventCard;
