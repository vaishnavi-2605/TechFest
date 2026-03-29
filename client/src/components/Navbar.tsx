import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth } from "@/data/auth";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/events", label: "Events" },
  { path: "/team", label: "Team" },
  { path: "/sponsors", label: "Sponsors" },
  { path: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashboardPath, setDashboardPath] = useState("");
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    const auth = getAuth();
    const role = String((auth?.user as { role?: string } | undefined)?.role || "");
    if (role === "admin" || role === "super_admin") {
      setDashboardPath("/admin/dashboard");
      return;
    }
    if (role === "coordinator") {
      setDashboardPath("/coordinator/dashboard");
      return;
    }
    setDashboardPath("");
  }, [location]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav py-3" : "py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Zap className="w-7 h-7 text-primary transition-all group-hover:drop-shadow-[0_0_8px_hsl(263,84%,58%)]" />
          <span className="font-heading text-xl font-bold tracking-wider gradient-text">
            TechFest
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative text-sm font-medium transition-colors duration-200 hover:text-primary ${
                location.pathname === link.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="activeLink"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {dashboardPath ? (
            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/15 text-muted-foreground font-heading text-sm font-semibold tracking-wide transition-all hover:border-primary/40 hover:text-foreground hover:bg-primary/10"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/15 text-muted-foreground font-heading text-sm font-semibold tracking-wide transition-all hover:border-primary/40 hover:text-foreground hover:bg-primary/10"
            >
              Admin Login
            </Link>
          )}
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold tracking-wide transition-all hover:shadow-[0_0_25px_hsl(263,84%,58%,0.4)] hover:scale-105"
          >
            Register Now
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-72 glass-nav z-50 flex flex-col pt-20 px-6 gap-2 md:hidden"
              onClick={(event) => event.stopPropagation()}
            >
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className={`block py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === link.path
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
              >
                {dashboardPath ? (
                  <Link
                    to={dashboardPath}
                    className="block text-center py-3 px-4 rounded-lg border border-white/15 text-muted-foreground font-heading text-sm font-semibold tracking-wide mb-3"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/admin/login"
                    className="block text-center py-3 px-4 rounded-lg border border-white/15 text-muted-foreground font-heading text-sm font-semibold tracking-wide mb-3"
                  >
                    Admin Login
                  </Link>
                )}
                <Link
                  to="/events"
                  className="block text-center py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold tracking-wide"
                >
                  Register Now
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
