import { motion } from "framer-motion";
import { useState } from "react";
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

const EventCard = ({ event, index }: { event: Event; index: number }) => {
  const prizeNumbers = (event.displayPrize || "").match(/[\d,]+/g) || [];
  const prizeText = prizeNumbers.length ? prizeNumbers.join(", ") : "TBA";
  const [previewPoster, setPreviewPoster] = useState<string | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="glass-card card-hover-glow p-6 flex flex-col gap-4 group h-full"
      >
        <div className="w-full max-w-[181px] h-64 rounded-xl border border-white/10 overflow-hidden bg-card/40 flex items-center justify-center mx-auto">
          {resolveApiAssetUrl(event.posterUrl) ? (
            <button
              type="button"
              onClick={() => setPreviewPoster(resolveApiAssetUrl(event.posterUrl) || null)}
              className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="View poster"
            >
              <img
                src={resolveApiAssetUrl(event.posterUrl)}
                alt={event.name}
                className="w-full h-full object-contain"
              />
            </button>
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
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDateLabel(event.time)}</span>
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
          registrationClosed={event.registrationClosed}
          coordinatorName={event.guide}
          coordinatorPhone={event.guidePhone}
          label="Register"
          className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold text-center"
        />
      </div>
      </motion.div>
      {previewPoster ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewPoster(null)}>
          <div
            className="relative inline-flex max-w-[90vw] max-h-[85vh] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-card/95 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPoster(null)}
              className="absolute right-3 top-3 z-20 rounded-full border border-white/20 bg-black/80 px-3 py-1 text-[11px] text-white shadow-lg hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Close poster preview"
            >
              Close
            </button>
            <div className="w-full max-h-[80vh] flex items-center justify-center">
              <img src={previewPoster} alt={event.name} className="max-h-[80vh] max-w-[85vw] w-auto object-contain rounded-2xl" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default EventCard;
