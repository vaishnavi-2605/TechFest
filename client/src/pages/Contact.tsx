import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "@/components/SectionHeader";
import { faqItems } from "@/data/sampleData";
import { submitContactMessage } from "@/data/api";
import { Mail, Phone, MapPin, ChevronDown } from "lucide-react";

const ContactPage = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage("");
      await submitContactMessage(form);
      setStatusMessage("Message sent successfully. Our team will contact you soon.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setShowConfirm(true);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <SectionHeader title="Contact & FAQ" subtitle="Have questions? We've got answers." />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {[
            { icon: Mail, label: "Email", value: "techfest@college.edu" },
            { icon: Phone, label: "Phone", value: "+91 98765 43210" },
            { icon: MapPin, label: "Venue", value: "KBT COE" },
          ].map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center card-hover-glow"
            >
              <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-foreground font-medium text-sm mt-1">{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 mb-16">
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 lg:col-span-2">
            <h3 className="font-heading text-xl font-bold text-foreground">Send Us a Message</h3>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Name</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Email</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Phone (optional)</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                placeholder="Your phone number (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Subject</label>
              <select
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              >
                <option value="">Select subject</option>
                <option value="Event Registration Help">Event Registration Help</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Pass / Certificate Query">Pass / Certificate Query</option>
                <option value="Event Schedule / Venue">Event Schedule / Venue</option>
                <option value="Coordinator Contact Request">Coordinator Contact Request</option>
                <option value="Technical Website Issue">Technical Website Issue</option>
                <option value="Sponsorship / Collaboration">Sponsorship / Collaboration</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Message</label>
              <textarea
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border min-h-32"
                placeholder="Write your message here..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            {!!statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-70"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <AnimatePresence>
          {showConfirm ? (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowConfirm(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-lg rounded-3xl border border-white/10 bg-card/95 p-8 text-center"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
              >
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/30 text-primary shadow-[0_0_30px_hsl(263,84%,58%,0.35)]">
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M8.5 11.5l2 2 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 3.2l2.4 1.5 2.8.4.4 2.8 1.5 2.4-1.5 2.4-.4 2.8-2.8.4-2.4 1.5-2.4-1.5-2.8-.4-.4-2.8-1.5-2.4 1.5-2.4.4-2.8 2.8-.4L12 3.2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h4 className="font-heading text-2xl font-bold gradient-text mb-3">Message Sent Successfully!</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Thank you for reaching out. We’ve received your message and will respond shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-7 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <h3 className="font-heading text-2xl font-bold gradient-text mb-8 text-center">
          Frequently Asked Questions
        </h3>
        <div className="space-y-3">
          {faqItems.map((faq) => (
            <div key={faq.id} className="glass-card overflow-hidden">
              <button onClick={() => setOpenId(openId === faq.id ? null : faq.id)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="text-sm font-medium text-foreground pr-4">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${openId === faq.id ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p className="px-5 pb-5 text-sm text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
