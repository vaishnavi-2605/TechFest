import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import ParticleBackground from "@/components/ParticleBackground";
import CountdownTimer from "@/components/CountdownTimer";
import SectionHeader from "@/components/SectionHeader";
import EventCard from "@/components/EventCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { sponsors } from "@/data/sampleData";
import { fetchEvents } from "@/data/api";
import { formatBackendEvent, formatShortDateLabel, parseEventDate } from "@/data/helpers";
import { BackendEvent } from "@/types";
import { Calendar, MapPin, Trophy, Users, Sparkles, ChevronRight } from "lucide-react";

const eventFilterOptions = ["All", "Technical", "Non-Technical", "Workshop"] as const;
const NEXT_EVENT_STORAGE_KEY = "techfestNextEventTime";

function matchesEventFilter(category: string, filter: (typeof eventFilterOptions)[number]) {
  if (filter === "All") return true;
  if (filter === "Workshop") return category === "Workshops";
  return category === filter;
}

function getLatestEventTime(rows: BackendEvent[]) {
  return rows
    .map((event) => ({ raw: event.time, parsed: parseEventDate(event.time) }))
    .filter((event) => event.raw && !Number.isNaN(event.parsed.getTime()))
    .sort((a, b) => b.parsed.getTime() - a.parsed.getTime())[0]?.raw || "";
}

function getStoredNextEventTime() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NEXT_EVENT_STORAGE_KEY) || "";
}

const AnimatedCounter = ({ value, prefix = "" }: { value: number; prefix?: string }) => {
  const { ref, inView } = useInView({ triggerOnce: true });
  const [count, setCount] = useState(0);

  if (inView && count === 0) {
    let start = 0;
    const duration = 2000;
    const step = value / (duration / 16 || 1);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
  }

  return (
    <span ref={ref} className="font-heading text-3xl md:text-4xl font-bold gradient-text">
      {prefix}
      {count >= 1000 ? `${(count / 1000).toFixed(count >= value ? 0 : 1)}K+` : `${count}+`}
    </span>
  );
};

const HeroSection = ({ nextEventDate, nextEventTimeText }: { nextEventDate: string; nextEventTimeText?: string }) => {
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleBackground />
      <div className="absolute top-20 left-10 w-20 h-20 border border-primary/20 rounded-lg animate-float opacity-30" />
      <div className="absolute bottom-32 right-16 w-16 h-16 border border-secondary/20 rounded-full animate-float opacity-20" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/3 right-1/4 w-12 h-12 border border-primary/15 rotate-45 animate-float opacity-20" style={{ animationDelay: "4s" }} />

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div variants={item} className="flex items-center justify-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-secondary" />
          <span className="text-sm text-secondary font-medium tracking-wide">{nextEventDate}</span>
          <span className="text-muted-foreground mx-2">•</span>
          <MapPin className="w-4 h-4 text-secondary" />
          <span className="text-sm text-secondary font-medium tracking-wide">KBT COE</span>
        </motion.div>

        <motion.h1
          variants={item}
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 glow-text-violet"
          style={{
            background: "linear-gradient(135deg, hsl(263, 84%, 58%), hsl(187, 94%, 43%), hsl(263, 84%, 58%))",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradient-shift 4s linear infinite",
          }}
        >
          TechFest 2026
        </motion.h1>

        <motion.p variants={item} className="text-muted-foreground text-base md:text-lg mb-2">
          KBT College of Engineering, Nashik
        </motion.p>
        <motion.p variants={item} className="text-foreground/70 text-sm md:text-base mb-8 max-w-xl mx-auto">
          Where Innovation Meets Imagination — The Biggest College Tech Fest
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/events" className="btn-glow inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_30px_hsl(263,84%,58%,0.4)]">
            Explore Events
          </Link>
          <Link to="/events" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-primary/40 text-primary font-heading text-sm font-semibold tracking-wide transition-all hover:bg-primary/10 hover:border-primary/60 hover:scale-105">
            Register Now
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <CountdownTimer targetTimeText={nextEventTimeText} />
        </motion.div>
      </motion.div>
    </section>
  );
};

const AboutSection = ({ stats }: { stats: { label: string; value: number; icon: typeof Sparkles; prefix?: string }[] }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-20 md:py-28 relative" ref={ref}>
      <div className="container mx-auto px-4">
        <SectionHeader title="About TechFest" subtitle="A day of innovation, competition, and celebration of technology." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <p className="text-muted-foreground leading-relaxed mb-6">
              TechFest 2026 is the annual techfest of KBT College of Engineering, Nashik — a one-day extravaganza bringing
              together the brightest minds from colleges across Nashik. With over 8 events spanning hackathons,
              robotics, AI, design, and more, TechFest is where innovation meets imagination.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you're a coder, a designer, a robotics enthusiast, or a quiz master, there's something for everyone.
              Join us for intense competition, hands-on workshops, networking, and unforgettable experiences.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-5 text-center card-hover-glow"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <AnimatedCounter value={stat.value} prefix={stat.prefix} />
                <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const EventsPreview = ({ events }: { events: BackendEvent[] }) => {
  const [activeFilter, setActiveFilter] = useState<(typeof eventFilterOptions)[number]>("All");
  const formattedEvents = useMemo(() => events.map(formatBackendEvent), [events]);
  const filteredEvents = useMemo(
    () => formattedEvents.filter((event) => matchesEventFilter(event.category, activeFilter)),
    [activeFilter, formattedEvents]
  );

  return (
    <section className="py-20 md:py-28 bg-muted/5">
      <div className="container mx-auto px-4">
        <SectionHeader title="Featured Events" subtitle="Compete, innovate, and win big across our flagship events." />
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
            No featured events found for the selected category.
          </p>
        ) : (
          <div className="max-w-6xl mx-auto px-0 sm:px-12">
            <Carousel
              opts={{ align: "start" }}
              className="w-full"
            >
              <CarouselContent>
                {filteredEvents.map((event, i) => (
                  <CarouselItem key={event.id} className="basis-[88%] sm:basis-1/2 lg:basis-1/3">
                    <EventCard event={event} index={i} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 top-[42%] hidden sm:inline-flex border-white/15 bg-background/80 text-foreground hover:bg-background" />
              <CarouselNext className="right-0 top-[42%] hidden sm:inline-flex border-white/15 bg-background/80 text-foreground hover:bg-background" />
            </Carousel>
          </div>
        )}
        <div className="text-center mt-10">
          <Link to="/events" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-primary/30 text-primary font-heading text-sm font-semibold hover:bg-primary/10 hover:border-primary/60 transition-all">
            View All Events <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const SponsorsStrip = () => {
  const allSponsors = [...sponsors, ...sponsors];
  return (
    <section className="py-16 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <SectionHeader title="Our Sponsors" subtitle="Backed by industry leaders." />
      </div>
      <div className="relative">
        <div className="flex marquee gap-12 items-center">
          {allSponsors.map((s, i) => (
            <div key={`${s.id}-${i}`} className="flex-shrink-0 glass-card px-8 py-4 min-w-[160px] text-center grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105">
              <span className={`font-heading font-bold ${s.tier === "Title" ? "text-xl text-primary" : s.tier === "Gold" ? "text-lg text-amber-400" : "text-base text-muted-foreground"}`}>
                {s.name}
              </span>
              <p className="text-xs text-muted-foreground mt-1">{s.tier} Sponsor</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [latestEventTimeText, setLatestEventTimeText] = useState(() => getStoredNextEventTime());

  useEffect(() => {
    fetchEvents()
      .then((data) => {
        const rows = data.events || [];
        setEvents(rows);
        const latest = getLatestEventTime(rows);
        if (latest) {
          setLatestEventTimeText(latest);
          localStorage.setItem(NEXT_EVENT_STORAGE_KEY, latest);
        }
      })
      .catch(() => setEvents([]));
  }, []);

  const latestEventDateLabel = useMemo(() => {
    return latestEventTimeText ? formatShortDateLabel(latestEventTimeText) : "";
  }, [latestEventTimeText]);

  const stats = [
    { label: "Events", value: events.length, icon: Sparkles },
    { label: "Expected Participants", value: Math.max(events.length * 50, 0), icon: Users },
    { label: "Prize Pool", value: events.reduce((sum, event) => sum + Number(event.fee || 0), 0), prefix: "₹ ", icon: Trophy },
    { label: "Sponsors", value: sponsors.length, icon: ChevronRight },
  ];

  return (
    <div>
      <HeroSection nextEventDate={latestEventDateLabel} nextEventTimeText={latestEventTimeText} />
      <AboutSection stats={stats} />
      <EventsPreview events={events} />
      <SponsorsStrip />
    </div>
  );
};

export default Index;
