import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Image as ImageIcon, Users, Trophy, Calendar } from "lucide-react";
import RegisterAction from "@/components/RegisterAction";
import { formatDateLabel, formatDescriptionText, resolveApiAssetUrl } from "@/data/helpers";
import { Event } from "@/types";

const categoryColors = {
  Technical: "bg-primary/20 text-primary",
  "Non-Technical": "bg-secondary/20 text-secondary",
  Workshops: "bg-amber-500/20 text-amber-400",
};

type EventCardProps = {
  event: Event;
  index: number;
  onPosterPreview?: (poster: { url: string; title?: string }) => void;
};

const EventCard = ({ event, index, onPosterPreview }: EventCardProps) => {
  const prizeNumbers = (event.displayPrize || "").match(/[\d,]+/g) || [];
  const prizeText = prizeNumbers.length ? prizeNumbers.join(", ") : "TBA";
  const posterUrl = resolveApiAssetUrl(event.posterUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="glass-card card-hover-glow flex h-full flex-col gap-4 p-6 group"
    >
      <div className="mx-auto flex h-64 w-full max-w-[181px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-card/40">
        {posterUrl ? (
          <button
            type="button"
            onClick={() => onPosterPreview?.({ url: posterUrl, title: event.name })}
            className="h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label={`View poster for ${event.name}`}
          >
            <img
              src={posterUrl}
              alt={event.name}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
            <span>Poster not available</span>
          </div>
        )}
      </div>
      <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[event.category]}`}>
        {event.category}
      </span>
      <h3 className="min-h-[3rem] break-words font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
        {event.name}
      </h3>
      <p className="flex-1 whitespace-pre-line text-sm text-muted-foreground">
        {formatDescriptionText(event.shortDescription || event.description)}
      </p>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.teamSize}</span>
        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> Rs. {prizeText}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDateLabel(event.time)}</span>
      </div>
      <div className="mt-2 mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to={event.eventId ? `/events/${event.eventId}` : "/events"}
          className="rounded-lg border border-primary/30 px-4 py-2.5 text-center text-sm font-semibold text-primary transition-all hover:border-primary/60 hover:bg-primary/10"
        >
          View Details
        </Link>
        <RegisterAction
          eventId={event.eventId}
          timeText={event.time}
          registrationClosed={event.registrationClosed}
          coordinatorName={event.guide}
          coordinatorPhone={event.guidePhone}
          label="Register"
          className="rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
        />
      </div>
    </motion.div>
  );
};

export default EventCard;
