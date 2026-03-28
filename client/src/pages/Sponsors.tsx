import SectionHeader from "@/components/SectionHeader";
import { sponsors } from "@/data/sampleData";
import { motion } from "framer-motion";

const tiers = ["Title", "Gold", "Silver"] as const;
const tierStyles = {
  Title: "text-2xl text-primary glow-text-violet",
  Gold: "text-lg text-amber-400",
  Silver: "text-base text-muted-foreground",
};

const SponsorsPage = () => {
  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <SectionHeader title="Sponsors" subtitle="TechFest 2026 is powered by these incredible partners." />

        {tiers.map((tier) => {
          const items = sponsors.filter((s) => s.tier === tier);
          if (!items.length) return null;
          return (
            <div key={tier} className="mb-14">
              <h3 className="font-heading text-xl font-bold text-foreground mb-6 text-center">{tier} Sponsors</h3>
              <div className={`grid gap-6 justify-items-center ${
                tier === "Title" ? "grid-cols-1" : tier === "Gold" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
              }`}>
                {items.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`glass-card card-hover-glow p-8 w-full text-center grayscale hover:grayscale-0 transition-all duration-300 ${
                      tier === "Title" ? "max-w-md mx-auto py-12" : ""
                    }`}
                  >
                    <span className={`font-heading font-bold ${tierStyles[tier]}`}>{s.name}</span>
                    <p className="text-xs text-muted-foreground mt-2">{tier} Sponsor</p>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SponsorsPage;
