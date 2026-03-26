import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionHeader = ({ title, subtitle, className = "" }: SectionHeaderProps) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={`text-center mb-12 ${className}`}
    >
      <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionHeader;
