import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/SectionHeader";
import { scheduleItems } from "@/data/sampleData";
import { MapPin, Clock } from "lucide-react";

const categoryDot: Record<string, string> = {
  Technical: "bg-primary",
  "Non-Technical": "bg-secondary",
  Workshops: "bg-amber-400",
};

const SchedulePage = () => {
  const [activeDay, setActiveDay] = useState<1 | 2>(1);
  const items = scheduleItems.filter((s) => s.day === activeDay);

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <SectionHeader title="Schedule" subtitle="Plan your two days at TechFest 2026." />

        <div className="flex justify-center gap-4 mb-12">
          {[1, 2].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day as 1 | 2)}
              className={`px-6 py-3 rounded-lg font-heading text-sm font-semibold transition-all ${
                activeDay === day
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Day {day} - March {13 + day}, 2026
            </button>
          ))}
        </div>

        <motion.div
          key={activeDay}
          initial={{ opacity: 0, x: activeDay === 1 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent" />

          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative pl-16 pb-10 last:pb-0"
            >
              <div className={`absolute left-[18px] top-1 w-4 h-4 rounded-full border-2 border-background ${categoryDot[item.category]} shadow-lg`} />

              <div className="glass-card p-5 card-hover-glow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center gap-1 text-xs text-secondary font-mono font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {item.time}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryDot[item.category]}/20 text-foreground`}>
                    {item.category}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">{item.eventName}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" /> {item.venue}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SchedulePage;
