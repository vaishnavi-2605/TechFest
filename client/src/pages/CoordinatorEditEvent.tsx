import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import { fetchCoordinatorEvent, updateCoordinatorEvent } from "@/data/api";
import { getAuth } from "@/data/auth";

const CoordinatorEditEventPage = () => {
  const navigate = useNavigate();
  const { eventId = "" } = useParams();
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    eventType: "Technical",
    shortDescription: "",
    description: "",
    reward: "",
    fee: "0",
    teamSize: "1",
    eventDate: "",
    time: "",
    address: "",
    whatsappGroupLink: "",
    rulesText: "",
  });

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || String(auth?.user?.role || "") !== "coordinator") {
      navigate("/portal");
      return;
    }
    if (!eventId) {
      navigate("/coordinator/dashboard");
      return;
    }
    fetchCoordinatorEvent(eventId)
      .then((data) => {
        const event = data.event || {};
        const timeText = String(event.time || "");
        const [datePart, timePart] = timeText.split("|").map((s) => s.trim());
        setForm({
          title: String(event.title || ""),
          eventType: String(event.eventType || "Technical"),
          shortDescription: String(event.shortDescription || ""),
          description: String(event.description || ""),
          reward: String(event.displayPrize || ""),
          fee: String(event.fee ?? "0"),
          teamSize: String(event.teamSize ?? "1"),
          eventDate: datePart || "",
          time: timePart || "",
          address: String(event.address || ""),
          whatsappGroupLink: String(event.whatsappGroupLink || ""),
          rulesText: Array.isArray(event.rules) ? event.rules.join("\n") : "",
        });
      })
      .catch((error) => setAlert(error instanceof Error ? error.message : "Failed to load event."));
  }, [navigate, eventId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setAlert("");
      const nextErrors: Record<string, string> = {};
      if (!form.title.trim()) nextErrors.title = "Event title is required.";
      if (!form.eventType.trim()) nextErrors.eventType = "Event type is required.";
      if (!form.shortDescription.trim()) nextErrors.shortDescription = "Short description is required.";
      if (!form.description.trim()) nextErrors.description = "Detailed description is required.";
      if (!form.eventDate.trim()) nextErrors.eventDate = "Event date is required.";
      if (!form.address.trim()) nextErrors.address = "Venue/address is required.";
      if (!form.whatsappGroupLink.trim()) nextErrors.whatsappGroupLink = "WhatsApp group link is required.";
      else if (!/^https?:\/\/\S+$/i.test(form.whatsappGroupLink.trim())) nextErrors.whatsappGroupLink = "Enter a valid WhatsApp group link.";
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setLoading(false);
        return;
      }
      setErrors({});

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("eventType", form.eventType);
      fd.append("shortDescription", form.shortDescription);
      fd.append("description", form.description);
      fd.append("displayPrize", form.reward);
      fd.append("fee", form.fee);
      fd.append("teamSize", form.teamSize);
      fd.append("time", form.time ? `${form.eventDate} | ${form.time}` : form.eventDate);
      fd.append("address", form.address);
      fd.append("whatsappGroupLink", form.whatsappGroupLink.trim());
      fd.append("rules", JSON.stringify(form.rulesText.split("\n").map((x) => x.trim()).filter(Boolean)));
      if (posterFile) fd.append("poster", posterFile);
      if (paymentQrFile) fd.append("paymentQr", paymentQrFile);
      await updateCoordinatorEvent(eventId, fd);
      navigate("/coordinator/dashboard", { state: { flashMessage: "Event updated and sent for admin approval." } });
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to update event.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <SectionHeader title="Update Event" subtitle="Update event details. Changes require admin approval again." />
        <div className="flex justify-end">
          <Link to="/coordinator/dashboard" className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground">
            Back
          </Link>
        </div>

        {!!alert && <p className="text-sm text-destructive">{alert}</p>}

        <section className="glass-card p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Event Title</label>
              <input
                className={`w-full px-4 py-3 rounded-lg bg-muted/50 border ${errors.title ? "border-destructive" : "border-border"}`}
                placeholder="Title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Event Type</label>
              <select
                className={`w-full px-4 py-3 rounded-lg bg-muted/50 border ${errors.eventType ? "border-destructive" : "border-border"}`}
                value={form.eventType}
                onChange={(e) => updateField("eventType", e.target.value)}
              >
                <option value="Technical">Technical</option>
                <option value="Non-Technical">Non-Technical</option>
                <option value="Workshop">Workshop</option>
              </select>
              {errors.eventType && <p className="text-xs text-destructive mt-1">{errors.eventType}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Short Description</label>
              <input
                className={`w-full px-4 py-3 rounded-lg bg-muted/50 border ${errors.shortDescription ? "border-destructive" : "border-border"}`}
                placeholder="One-line Description"
                value={form.shortDescription}
                onChange={(e) => updateField("shortDescription", e.target.value)}
              />
              {errors.shortDescription && <p className="text-xs text-destructive mt-1">{errors.shortDescription}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Detailed Description</label>
              <textarea
                className={`w-full px-4 py-3 rounded-lg bg-muted/50 border ${errors.description ? "border-destructive" : "border-border"} min-h-28`}
                placeholder="Description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Rewards / Certificates</label>
              <textarea
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border min-h-24"
                placeholder="Example: Winner gets Rs. 5,000 + Certificate"
                value={form.reward}
                onChange={(e) => updateField("reward", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Price (INR)</label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                  type="number"
                  placeholder="Fee"
                  value={form.fee}
                  onChange={(e) => updateField("fee", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Team Size</label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                  type="number"
                  placeholder="Team Size"
                  value={form.teamSize}
                  onChange={(e) => updateField("teamSize", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Event Date</label>
                <input
                  className={`w-full px-4 py-3 rounded-lg bg-muted/50 border ${errors.eventDate ? "border-destructive" : "border-border"}`}
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.eventDate}
                  onChange={(e) => updateField("eventDate", e.target.value)}
                />
                {errors.eventDate && <p className="text-xs text-destructive mt-1">{errors.eventDate}</p>}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Event Time</label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                  placeholder="10:00 AM"
                  value={form.time}
                  onChange={(e) => updateField("time", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Venue / Address</label>
              <input
                className={`w-full px-4 py-3 rounded-lg bg-muted/50 border ${errors.address ? "border-destructive" : "border-border"}`}
                placeholder="Venue / Address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
              {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">WhatsApp Group Link</label>
              <input
                className={`w-full px-4 py-3 rounded-lg bg-muted/50 border ${errors.whatsappGroupLink ? "border-destructive" : "border-border"}`}
                placeholder="https://chat.whatsapp.com/..."
                value={form.whatsappGroupLink}
                onChange={(e) => updateField("whatsappGroupLink", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Participants will see this link after payment and must join the group before they can confirm their pass.
              </p>
              {errors.whatsappGroupLink && <p className="text-xs text-destructive mt-1">{errors.whatsappGroupLink}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Poster Upload</label>
                <input className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border" type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Payment QR Upload</label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentQrFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Rules (one per line)</label>
              <textarea
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border min-h-24"
                placeholder="Rules (one per line)"
                value={form.rulesText}
                onChange={(e) => updateField("rulesText", e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold">
              {loading ? "Updating..." : "Update Event"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CoordinatorEditEventPage;
