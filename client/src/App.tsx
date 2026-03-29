import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import EventsPage from "./pages/Events";
import EventDetailsPage from "./pages/EventDetails";
import TeamPage from "./pages/Team";
import RegisterPage from "./pages/Register";
import SponsorsPage from "./pages/Sponsors";
import ContactPage from "./pages/Contact";
import PortalAuthPage from "./pages/PortalAuth";
import AdminDashboardPage from "./pages/AdminDashboard";
import AdminMessagesPage from "./pages/AdminMessages";
import AdminCoordinatorDetailsPage from "./pages/AdminCoordinatorDetails";
import CoordinatorDashboardPage from "./pages/CoordinatorDashboard";
import CoordinatorAddEventPage from "./pages/CoordinatorAddEvent";
import CoordinatorUpdateProfilePage from "./pages/CoordinatorUpdateProfile";
import CoordinatorEditEventPage from "./pages/CoordinatorEditEvent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/portal" element={<PortalAuthPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/coordinators/:coordinatorId" element={<AdminCoordinatorDetailsPage />} />
          <Route path="/admin/messages" element={<AdminMessagesPage />} />
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboardPage />} />
          <Route path="/coordinator/add-event" element={<CoordinatorAddEventPage />} />
          <Route path="/coordinator/update-profile" element={<CoordinatorUpdateProfilePage />} />
          <Route path="/coordinator/events/:eventId/edit" element={<CoordinatorEditEventPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <AnimatedRoutes />
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
