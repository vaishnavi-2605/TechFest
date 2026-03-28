import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/SectionHeader";
import { fetchPublicCoordinators } from "@/data/api";
import { resolveApiAssetUrl } from "@/data/helpers";
import { PublicCoordinator } from "@/types";
import { Mail, Phone, User } from "lucide-react";

const TeamPage = () => {
  const [coordinators, setCoordinators] = useState<PublicCoordinator[]>([]);
  const [alert, setAlert] = useState("");

  useEffect(() => {
    fetchPublicCoordinators()
      .then((data) => setCoordinators((data.coordinators || []) as PublicCoordinator[]))
      .catch((error) => setAlert(error instanceof Error ? error.message : "Failed to load coordinators."));
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <SectionHeader title="Our Team" subtitle="The brilliant minds behind TechFest 2025." />

        {!!alert && <p className="text-sm text-destructive mb-4 text-center">{alert}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {coordinators.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 card-hover-glow group flex flex-col h-full"
            >
              <div className="flex items-center gap-4 mb-4">
                {resolveApiAssetUrl(member.photoUrl) ? (
                  <img
                    src={resolveApiAssetUrl(member.photoUrl)}
                    alt={member.name}
                    className="w-20 h-20 rounded-2xl object-contain border border-white/10 bg-card/40 p-1 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-9 h-9 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h4 className="font-heading text-base font-bold text-foreground break-words">{member.name}</h4>
                  <p className="text-sm text-primary break-words">{member.role || "Event Coordinator"}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-words">{member.department || "Department not set"}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mt-auto">
                {member.email ? (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {member.email}
                  </p>
                ) : null}
                {member.phone ? (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    {member.phone}
                  </p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
