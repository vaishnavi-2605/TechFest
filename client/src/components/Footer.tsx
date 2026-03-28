import { Link } from "react-router-dom";
import { Zap, Instagram, Twitter, Linkedin, Youtube, ArrowUp } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <span className="font-heading text-lg font-bold gradient-text">TechFest 2026</span>
            </div>
            <p className="text-sm text-muted-foreground">
              KBT College of Engineering, Nashik
            </p>
            <p className="text-sm text-muted-foreground mt-1">April 11, 2026</p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 text-foreground">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {["/events", "/schedule", "/team", "/register"].map((path) => (
                <Link key={path} to={path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 text-foreground">Contact</h4>
            <p className="text-sm text-muted-foreground">techfest@mitcoe.edu.in</p>
            <p className="text-sm text-muted-foreground mt-1">+91 98765 43210</p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 text-foreground">Follow Us</h4>
            <div className="flex gap-3">
              {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 text-foreground">Add Event</h4>
            <p className="text-sm text-muted-foreground mb-2">Want to create and publish a new event?</p>
            <p className="text-sm text-muted-foreground mb-4">Login/Register as coordinator first.</p>
            <Link
              to="/portal"
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-heading font-semibold tracking-wide shadow-[0_0_20px_hsl(187,94%,43%,0.2)]"
            >
              Add Event
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 TechFest — KBT College of Engineering, Nashik. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
