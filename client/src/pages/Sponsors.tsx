import SectionHeader from "@/components/SectionHeader";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchSponsors } from "@/data/api";
import { Sponsor } from "@/types";

const tiers = ["Title", "Gold", "Silver"] as const;
const tierStyles = {
  Title: "text-2xl text-primary glow-text-violet",
  Gold: "text-lg text-amber-400",
  Silver: "text-base text-muted-foreground",
};

const SponsorsPage = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    fetchSponsors()
      .then((data) => setSponsors(data.sponsors || []))
      .catch(() => setSponsors([]));
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <SectionHeader title="Sponsors" subtitle="TechFest 2026 is powered by these incredible partners." />

        {tiers.map((tier) => {
          const items = sponsors.filter((s) => s.tier === tier);
          if (!items.length) return null;
          const gridClassName = tier === "Title"
            ? "grid-cols-1 max-w-4xl mx-auto"
            : items.length === 1
              ? "grid-cols-1 max-w-sm mx-auto"
              : items.length === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
          return (
            <div key={tier} className="mb-14">
              <h3 className="font-heading text-xl font-bold text-foreground mb-6 text-center">{tier} Sponsors</h3>
              <div className={`grid justify-items-center gap-6 ${gridClassName}`}>
                {items.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`glass-card card-hover-glow flex min-h-[180px] w-full items-center justify-center px-4 py-3 md:px-6 md:py-4 text-center grayscale transition-all duration-300 hover:grayscale-0 ${
                      tier === "Title" ? "max-w-4xl md:py-6" : "max-w-none md:max-w-sm"
                    }`}
                  >
                    <div className="mx-auto max-w-2xl space-y-2">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className={`block text-balance font-heading font-bold leading-tight ${tierStyles[tier]}`}>
                          {s.name}
                        </a>
                      ) : (
                        <span className={`block text-balance font-heading font-bold leading-tight ${tierStyles[tier]}`}>{s.name}</span>
                      )}
                      <p className="text-sm text-muted-foreground">{tier} Sponsor</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
        {!sponsors.length ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            Sponsors will appear here once coordinators add them from the dashboard.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SponsorsPage;
