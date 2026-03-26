import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import SectionHeader from "@/components/SectionHeader";
import { deleteAdminCoordinator, deleteAdminEvent, fetchAdminCoordinatorDetails, updateAdminEventStatus } from "@/data/api";
import { getAuth } from "@/data/auth";

type CoordinatorEvent = {
  id: string;
  eventId?: string;
  title?: string;
  description?: string;
  department?: string;
  fee?: number;
  time?: string;
  address?: string;
  posterUrl?: string;
  status?: string;
  participantCount?: number;
};

type CoordinatorDetails = {
  id?: string;
  name?: string;
  username?: string;
  role?: string;
  phone?: string;
  email?: string;
  department?: string;
  status?: string;
  photoUrl?: string;
  totalParticipants?: number;
  totalEvents?: number;
  events?: CoordinatorEvent[];
};

const AdminCoordinatorDetailsPage = () => {
  const navigate = useNavigate();
  const { coordinatorId = "" } = useParams();
  const [details, setDetails] = useState<CoordinatorDetails | null>(null);
  const [alert, setAlert] = useState("");
  const [busyEventId, setBusyEventId] = useState("");
  const [deletingEventId, setDeletingEventId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title?: string } | null>(null);

  async function load() {
    const data = await fetchAdminCoordinatorDetails(coordinatorId);
    setDetails((data.coordinator || null) as CoordinatorDetails | null);
  }

  useEffect(() => {
    const auth = getAuth();
    const role = String(auth?.user?.role || "");
    if (!auth?.token || !["admin", "super_admin"].includes(role)) {
      navigate("/portal");
      return;
    }
    if (!coordinatorId) {
      navigate("/admin/dashboard");
      return;
    }

    load().catch((error) => setAlert(error instanceof Error ? error.message : "Failed to load coordinator details."));
  }, [navigate, coordinatorId]);

  async function handleApproveEvent(eventDbId: string) {
    try {
      setBusyEventId(eventDbId);
      setAlert("");
      await updateAdminEventStatus(eventDbId, "active");
      await load();
      setAlert("Event approved successfully.");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to approve event.");
    } finally {
      setBusyEventId("");
    }
  }

  async function handleDeleteEvent(eventDbId: string) {
    const ok = window.confirm("Delete this event? This cannot be undone.");
    if (!ok) return;

    try {
      setDeletingEventId(eventDbId);
      setAlert("");
      await deleteAdminEvent(eventDbId);
      await load();
      setAlert("Event deleted. Coordinator has been notified.");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to delete event.");
    } finally {
      setDeletingEventId("");
    }
  }

  async function handleDeleteCoordinator() {
    const ok = window.confirm("Delete this coordinator profile? This will deactivate the coordinator.");
    if (!ok || !details?.id) return;

    try {
      setDeleting(true);
      setAlert("");
      await deleteAdminCoordinator(details.id);
      navigate("/admin/dashboard");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to delete coordinator.");
    } finally {
      setDeleting(false);
    }
  }

  const events = details?.events || [];

  return (
    <div className="pt-28 pb-20 relative overflow-hidden">
      <ParticleBackground />
      <div className="container mx-auto px-4 space-y-6 relative z-10 max-w-5xl">
        <SectionHeader
          title={`${details?.name || "Coordinator"} Details`}
          subtitle="Review coordinator info, verify events, and take actions."
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex gap-3">
            <Link to="/admin/dashboard" className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground">
              Back
            </Link>
            <button
              onClick={handleDeleteCoordinator}
              disabled={deleting}
              className="px-5 py-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 font-semibold disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete Profile"}
            </button>
          </div>
        </div>

        {!!alert && <p className="text-sm text-destructive">{alert}</p>}

        <section className="glass-card p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Coordinator Information</h2>
          <div className="grid grid-cols-[1fr_170px] sm:grid-cols-[1fr_200px] md:grid-cols-[1fr_220px] lg:grid-cols-[1fr_280px] gap-6 md:gap-8 items-start">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="text-foreground font-semibold">Name:</span> {details?.name || "N/A"}</p>
              <p><span className="text-foreground font-semibold">Username:</span> {details?.username || "N/A"}</p>
              <p><span className="text-foreground font-semibold">Role:</span> {details?.role || "Event Coordinator"}</p>
              <p><span className="text-foreground font-semibold">Email:</span> {details?.email || "N/A"}</p>
              <p><span className="text-foreground font-semibold">Phone:</span> {details?.phone || "N/A"}</p>
              <p><span className="text-foreground font-semibold">Department:</span> {details?.department || "N/A"}</p>
              <p><span className="text-foreground font-semibold">Status:</span> {details?.status || "N/A"}</p>
              <p><span className="text-foreground font-semibold">Total Events:</span> {Number(details?.totalEvents || 0)}</p>
              <p><span className="text-foreground font-semibold">Total Participants:</span> {Number(details?.totalParticipants || 0)}</p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-card/40 p-2">
              {details?.photoUrl ? (
                <img src={details.photoUrl} alt={details.name || "Coordinator"} className="w-full h-[200px] sm:h-[220px] md:h-[220px] lg:h-[260px] object-contain" />
              ) : (
                <div className="w-full h-[200px] sm:h-[220px] md:h-[220px] lg:h-[260px] bg-card/40 text-muted-foreground flex items-center justify-center">No Photo</div>
              )}
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Coordinator Events</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-card/40 p-4">
                <div className="flex flex-col lg:flex-row gap-5 items-stretch">
                  {event.posterUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewPoster({ url: event.posterUrl || "", title: event.title })}
                      className="w-full lg:w-56 h-44 lg:h-44 self-stretch rounded-xl border border-white/10 overflow-hidden bg-card/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      aria-label="View poster"
                    >
                      <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-full lg:w-56 h-44 lg:h-44 self-stretch rounded-xl border border-white/10 bg-card/40 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="w-5 h-5" />
                      <span>Poster not available</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-heading text-lg text-foreground">{event.title || "Untitled Event"}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.status === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {event.status || "active"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description || "No description."}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.department || "N/A"} | {event.time || "To be announced"} | {event.address || "Venue TBD"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fee: ₹ {Number(event.fee || 0)} | Participants: {Number(event.participantCount || 0)}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 mt-auto">
                      {event.status === "pending" ? (
                        <button
                          onClick={() => handleApproveEvent(event.id)}
                          disabled={busyEventId === event.id}
                          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 disabled:opacity-60"
                        >
                          {busyEventId === event.id ? "Approving..." : "Accept Event"}
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={deletingEventId === event.id}
                        className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold border border-destructive/30 hover:bg-destructive/20 disabled:opacity-60"
                      >
                        {deletingEventId === event.id ? "Deleting..." : "Delete Event"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!events.length ? (
              <div className="rounded-2xl border border-white/10 bg-card/40 p-4 text-sm text-muted-foreground">
                No events found for this coordinator.
              </div>
            ) : null}
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

export default AdminCoordinatorDetailsPage;
