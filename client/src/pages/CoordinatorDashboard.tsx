import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import { Download, Image as ImageIcon, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateLabel, parseEventDate, resolveApiAssetUrl } from "@/data/helpers";
import { deleteCoordinatorEvent, deleteCoordinatorSponsor, fetchCoordinatorMe, fetchCoordinatorParticipants, fetchCoordinatorSponsors, markCoordinatorNotificationsRead } from "@/data/api";
import { clearAuth, getAuth } from "@/data/auth";
import { Sponsor } from "@/types";

const COORDINATOR_DASHBOARD_CACHE_KEY = "techfestCoordinatorDashboardCache";
const sponsorTierStyles = {
  Title: "text-2xl text-primary glow-text-violet",
  Gold: "text-lg text-amber-400",
  Silver: "text-base text-muted-foreground",
} satisfies Record<Sponsor["tier"], string>;

type CoordinatorProfile = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  department?: string;
  photoUrl?: string;
  coordinatorRole?: string;
  notifications?: Array<{ message?: string; isRead?: boolean; createdAt?: string }>;
};

type CoordinatorEvent = {
  _id?: string;
  eventId?: string;
  title?: string;
  description?: string;
  status?: string;
  fee?: number;
  time?: string;
  address?: string;
  posterUrl?: string;
};

type ParticipantRow = {
  registrationId?: string;
  fullName?: string;
  teamMembers?: string;
  email?: string;
  phone?: string;
  studentCollege?: string;
  eventName?: string;
  studentDepartment?: string;
  paymentRef?: string;
};

const CoordinatorDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<CoordinatorProfile | null>(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(COORDINATOR_DASHBOARD_CACHE_KEY) || "null") as
        | { profile?: CoordinatorProfile | null }
        | null;
      if (cached?.profile) return cached.profile;
    } catch {
      // ignore storage errors
    }

    const auth = getAuth();
    const user = (auth?.user || {}) as Record<string, unknown>;
    if (String(user.role || "") !== "coordinator") return null;

    return {
      id: String(user.id || ""),
      name: String(user.name || ""),
      username: String(user.username || ""),
      email: String(user.email || ""),
      phone: String(user.phone || ""),
      department: String(user.department || ""),
      photoUrl: String(user.photoUrl || ""),
      coordinatorRole: String(user.coordinatorRole || "Event Coordinator"),
      notifications: []
    };
  });
  const [events, setEvents] = useState<CoordinatorEvent[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [alert, setAlert] = useState("");
  const [participantQuery, setParticipantQuery] = useState("");
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  function hydrateFromCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(COORDINATOR_DASHBOARD_CACHE_KEY) || "null") as
        | { profile?: CoordinatorProfile | null; events?: CoordinatorEvent[]; participants?: ParticipantRow[]; sponsors?: Sponsor[] }
        | null;
      if (!cached) return false;
      setProfile(cached.profile || null);
      setEvents(cached.events || []);
      setParticipants(cached.participants || []);
      setSponsors(cached.sponsors || []);
      return true;
    } catch {
      return false;
    }
  }

  async function load() {
    setLoading(true);
    try {
      const [me, participantData, sponsorData] = await Promise.all([fetchCoordinatorMe(), fetchCoordinatorParticipants(), fetchCoordinatorSponsors()]);
      const coordinator = (me.coordinator || null) as CoordinatorProfile | null;
      const nextEvents = (me.events || []) as CoordinatorEvent[];
      const nextParticipants = (participantData.participants || []) as ParticipantRow[];
      const nextSponsors = sponsorData.sponsors || [];
      setProfile(coordinator);
      setEvents(nextEvents);
      setParticipants(nextParticipants);
      setSponsors(nextSponsors);
      sessionStorage.setItem(COORDINATOR_DASHBOARD_CACHE_KEY, JSON.stringify({
        profile: coordinator,
        events: nextEvents,
        participants: nextParticipants,
        sponsors: nextSponsors
      }));

      const notifications = coordinator?.notifications || [];
      const unread = notifications.filter((item) => !item.isRead && String(item.message || "").trim());
      if (unread.length) {
        setAlert((prev) => prev || String(unread[0].message || "You have a new notification."));
        markCoordinatorNotificationsRead().catch(() => undefined);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    const ok = window.confirm("Delete this event? This cannot be undone.");
    if (!ok) return;
    try {
      await deleteCoordinatorEvent(eventId);
      await load();
      setAlert("Event deleted successfully.");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to delete event.");
    }
  }

  async function handleDeleteSponsor(sponsorId: string) {
    const ok = window.confirm("Delete this sponsor?");
    if (!ok) return;
    try {
      setAlert("");
      await deleteCoordinatorSponsor(sponsorId);
      await load();
      setAlert("Sponsor deleted successfully.");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to delete sponsor.");
    }
  }

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || String(auth?.user?.role || "") !== "coordinator") {
      navigate("/portal");
      return;
    }
    hydrateFromCache();
    load().catch((error) => setAlert(error instanceof Error ? error.message : "Failed to load dashboard."));
  }, [navigate]);

  useEffect(() => {
    const flash = (location.state as { flashMessage?: string } | null)?.flashMessage;
    if (flash) {
      setAlert(flash);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const participantRows = useMemo(() => {
    const query = participantQuery.trim().toLowerCase();
    if (!query) return participants;
    return participants.filter((row) => {
      const name = String(row.fullName || "").toLowerCase();
      const teamMembers = String(row.teamMembers || "").toLowerCase();
      const id = String(row.registrationId || "").toLowerCase();
      const phone = String(row.phone || "").toLowerCase();
      const email = String(row.email || "").toLowerCase();
      const event = String(row.eventName || "").toLowerCase();
      return name.includes(query) || teamMembers.includes(query) || id.includes(query) || phone.includes(query) || email.includes(query) || event.includes(query);
    });
  }, [participants, participantQuery]);
  const getPrimaryTeamMember = (teamMembers?: string) =>
    String(teamMembers || "")
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean)[0] || "N/A";

  function handleDownloadParticipantsPdf() {
    const rows = participants.map((row) => ([
      row.registrationId || "N/A",
      row.fullName || "N/A",
      getPrimaryTeamMember(row.teamMembers),
      row.phone || "N/A",
      row.email || "N/A",
      row.studentCollege || "N/A",
      row.studentDepartment || "N/A",
      row.paymentRef || "N/A"
    ]));

    if (!rows.length) {
      setAlert("No participants available to download.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4"
    });

    doc.setFontSize(16);
    doc.text("Participant List", 40, 40);
    doc.setFontSize(10);
    doc.text(`Coordinator: ${String(profile?.name || "Coordinator")}`, 40, 60);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-GB")}`, 40, 76);

    autoTable(doc, {
      startY: 92,
      head: [["ID", "Team Name", "Member Name", "Phone", "Email", "College", "Department", "Payment"]],
      body: rows,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        lineColor: [225, 225, 235],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [36, 44, 88],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      bodyStyles: {
        textColor: [30, 30, 40]
      },
      alternateRowStyles: {
        fillColor: [245, 247, 252]
      },
      margin: { left: 28, right: 28 }
    });

    doc.save("participant-list.pdf");
  }
  const totalEvents = events.length;
  const totalParticipants = participantRows.length;
  const profilePhoto =
    resolveApiAssetUrl(profile?.photoUrl) ||
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='560' height='560'><rect width='100%' height='100%' fill='%230b1f4a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239fc8ff' font-family='Arial' font-size='44'>Coordinator</text></svg>";

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <SectionHeader title="Coordinator Dashboard" subtitle="Manage profile, add events, and view participants for your events." />

        <div className="glass-card p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{String(profile?.name || "Coordinator")}</h2>
            <p className="text-sm text-muted-foreground">{String(profile?.department || "Department")}</p>
          </div>
          <button
            onClick={() => { clearAuth(); navigate("/"); }}
            className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground"
          >
            Logout
          </button>
        </div>

        <section className="glass-card p-6">
          <h3 className="font-heading text-lg font-bold text-foreground mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] md:grid-cols-[1fr_220px] lg:grid-cols-[1fr_280px] gap-5 md:gap-8 items-start">
            <div className="order-2 sm:order-1 space-y-2 text-xs sm:text-sm text-muted-foreground">
              <p className="leading-snug"><span className="text-foreground font-semibold">Name:</span> {String(profile?.name || "Coordinator")}</p>
              <p className="leading-snug break-all sm:break-normal"><span className="text-foreground font-semibold">Username:</span> {String(profile?.username || "N/A")}</p>
              <p className="leading-snug"><span className="text-foreground font-semibold">Role:</span> {String(profile?.coordinatorRole || "Event Coordinator")}</p>
              <p className="leading-snug break-all sm:break-normal"><span className="text-foreground font-semibold">Email:</span> {String(profile?.email || "N/A")}</p>
              <p className="leading-snug"><span className="text-foreground font-semibold">Phone:</span> {String(profile?.phone || "N/A")}</p>
              <p className="leading-snug"><span className="text-foreground font-semibold">Department:</span> {String(profile?.department || "N/A")}</p>
              <p className="leading-snug"><span className="text-foreground font-semibold">Total Events:</span> {totalEvents}</p>
              <p className="leading-snug"><span className="text-foreground font-semibold">Total Participants:</span> {totalParticipants}</p>
            </div>
            <div className="order-1 sm:order-2 mx-auto w-full max-w-[150px] sm:max-w-none rounded-xl overflow-hidden border border-white/10 bg-card/40 p-2">
              <img
                src={profilePhoto}
                alt="Coordinator profile"
                className="w-full h-[170px] sm:h-[220px] md:h-[220px] lg:h-[260px] object-contain"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <button
              onClick={() => navigate("/coordinator/add-event")}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
            >
              Add Event
            </button>
            <button
              onClick={() => navigate("/coordinator/add-sponsor")}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
            >
              Add Sponsor
            </button>
            <button
              onClick={() => navigate("/coordinator/update-profile")}
              className="w-full py-3 rounded-lg border border-white/15 text-muted-foreground"
            >
              Update Profile
            </button>
          </div>
        </section>

        {!!alert && <p className="text-sm text-cyan-100/80 px-1">{alert}</p>}

        <section className="glass-card p-6">
          <h3 className="font-heading text-lg font-bold text-foreground mb-4">My Events</h3>
          {loading && !profile && !events.length ? (
            <p className="text-sm text-muted-foreground mb-4">Loading dashboard...</p>
          ) : null}
          <div className="space-y-4">
            {events.map((event) => {
              const parsedDate = parseEventDate(event.time);
              const isPastEvent = !Number.isNaN(parsedDate.getTime()) && parsedDate < new Date();
              const displayStatus = isPastEvent ? "inactive" : (event.status || "active");
              return (
              <div key={event._id || event.title} className="rounded-2xl border border-white/10 bg-card/40 p-5">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 md:gap-8 items-stretch">
                  <div className="rounded-xl border border-white/10 bg-card/30 overflow-hidden w-full h-64 md:h-64 self-stretch">
                    {resolveApiAssetUrl(event.posterUrl) ? (
                      <button
                        type="button"
                        onClick={() => setPreviewPoster({ url: resolveApiAssetUrl(event.posterUrl), title: event.title })}
                        className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        aria-label="View poster"
                      >
                        <img src={resolveApiAssetUrl(event.posterUrl)} alt={event.title} className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                        <ImageIcon className="w-6 h-6" />
                        <span>Poster not available</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex flex-col h-full">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-heading text-lg font-bold text-foreground">{event.title || "Untitled Event"}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        displayStatus === "pending"
                          ? "bg-amber-500/20 text-amber-300"
                          : displayStatus === "inactive"
                            ? "bg-slate-500/20 text-slate-200"
                            : "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {displayStatus}
                      </span>
                    </div>
                    {event.description ? (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    ) : null}
                    {event.eventId ? (
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground font-semibold">Event ID:</span> {event.eventId}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-semibold">Fee:</span> ₹ {Number(event.fee || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-semibold">Date:</span> {formatDateLabel(event.time)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-semibold">Venue:</span> {event.address || "To be announced"}
                    </p>
                    {event._id ? (
                      <div className="flex flex-wrap gap-3 mt-3 mt-auto">
                        <button
                          type="button"
                          onClick={() => navigate(`/coordinator/events/${event._id}/edit`)}
                          className="px-4 py-2 rounded-full text-sm font-semibold bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                        >
                          Update Event
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event._id)}
                          className="px-4 py-2 rounded-full text-sm font-semibold bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
                        >
                          Delete Event
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );})}
            {!events.length ? (
              <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-muted-foreground">
                No events yet. Click Add Event to create your first event.
              </div>
            ) : null}
          </div>
        </section>

        <section className="glass-card p-6 space-y-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">Sponsors</h3>
            <p className="text-sm text-muted-foreground">Add sponsors using the same tier format shown on the public sponsors sections.</p>
          </div>

          {(["Title", "Gold", "Silver"] as Sponsor["tier"][]).map((tier) => {
            const items = sponsors.filter((sponsor) => sponsor.tier === tier);
            if (!items.length) return null;

            return (
              <div key={tier}>
                <h4 className="font-heading text-base font-bold text-foreground mb-4">{tier} Sponsors</h4>
                <div className={`grid gap-6 justify-items-center ${
                  tier === "Title" ? "grid-cols-1" : tier === "Gold" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
                }`}>
                  {items.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className={`glass-card card-hover-glow p-8 w-full text-center grayscale hover:grayscale-0 transition-all duration-300 ${
                        tier === "Title" ? "max-w-md mx-auto py-12" : ""
                      }`}
                    >
                      {sponsor.url ? (
                        <a href={sponsor.url} target="_blank" rel="noreferrer" className={`font-heading font-bold ${sponsorTierStyles[tier]}`}>
                          {sponsor.name}
                        </a>
                      ) : (
                        <span className={`font-heading font-bold ${sponsorTierStyles[tier]}`}>{sponsor.name}</span>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{tier} Sponsor</p>
                      <button
                        type="button"
                        onClick={() => handleDeleteSponsor(sponsor.id)}
                        className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
                      >
                        Delete Sponsor
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!sponsors.length ? (
            <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-muted-foreground">
              No sponsors added yet.
            </div>
          ) : null}
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-heading text-lg font-bold text-foreground">Participants</h3>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDownloadParticipantsPdf}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <div className="relative">
                <input
                  className="w-56 sm:w-96 pl-9 pr-12 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm"
                  placeholder="Search by name, ID, phone, email, event"
                  value={participantQuery}
                  onChange={(e) => setParticipantQuery(e.target.value)}
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                {participantQuery ? (
                <button
                  type="button"
                  onClick={() => setParticipantQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear
                </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-card/40">
                <tr className="text-left text-muted-foreground border-b border-white/10">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody>
                {participantRows.map((row, index) => (
                  <tr key={`${row.registrationId || row.email}-${index}`} className="border-b border-white/5 text-foreground/80">
                    <td className="py-3 px-4">{row.registrationId || "N/A"}</td>
                    <td className="py-3 px-4">{row.fullName || "N/A"}</td>
                    <td className="py-3 px-4">{getPrimaryTeamMember(row.teamMembers)}</td>
                    <td className="py-3 px-4">{row.phone || "N/A"}</td>
                    <td className="py-3 px-4">{row.email || "N/A"}</td>
                    <td className="py-3 px-4">{row.studentCollege || "N/A"}</td>
                    <td className="py-3 px-4">{row.studentDepartment || "N/A"}</td>
                    <td className="py-3 px-4">{row.paymentRef || "N/A"}</td>
                  </tr>
                ))}
                {!participantRows.length ? (
                  <tr>
                    <td className="py-4 px-4 text-muted-foreground" colSpan={8}>
                      No participants yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {previewPoster ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewPoster(null)}>
            <div
              className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-card/95 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewPoster(null)}
                className="absolute right-3 top-3 rounded-full bg-muted/70 px-3 py-1 text-xs text-foreground hover:bg-muted"
              >
                Close
              </button>
              {previewPoster.title ? (
                <p className="text-sm text-muted-foreground px-2 pb-2">{previewPoster.title}</p>
              ) : null}
              <img src={previewPoster.url} alt={previewPoster.title || "Event poster"} className="w-full max-h-[80vh] object-contain rounded-xl" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CoordinatorDashboardPage;
