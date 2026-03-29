import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import { fetchAdminCoordinators, fetchAdminUnreadMessageCount, updateAdminEventStatus } from "@/data/api";
import { clearAuth, getAuth } from "@/data/auth";
import { resolveApiAssetUrl } from "@/data/helpers";

const ADMIN_DASHBOARD_CACHE_KEY = "techfestAdminDashboardCache";
const ADMIN_COORDINATOR_PREVIEW_CACHE_PREFIX = "techfestAdminCoordinatorPreview:";

function cacheCoordinatorPreview(id: string, preview: Record<string, unknown>) {
  try {
    sessionStorage.setItem(`${ADMIN_COORDINATOR_PREVIEW_CACHE_PREFIX}${id}`, JSON.stringify(preview));
  } catch {
    // ignore storage errors
  }
}

function warmImage(url?: string) {
  const src = resolveApiAssetUrl(url);
  if (!src) return;
  const image = new Image();
  image.decoding = "async";
  image.src = src;
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState<Record<string, unknown>[]>([]);
  const [unread, setUnread] = useState(0);
  const [alert, setAlert] = useState("");
  const [updatingEventId, setUpdatingEventId] = useState("");
  const [loading, setLoading] = useState(true);

  function hydrateFromCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(ADMIN_DASHBOARD_CACHE_KEY) || "null") as
        | { coordinators?: Record<string, unknown>[]; unread?: number }
        | null;
      if (!cached) return false;
      setCoordinators(cached.coordinators || []);
      setUnread(Number(cached.unread || 0));
      return true;
    } catch {
      return false;
    }
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      const [coordinatorData, unreadData] = await Promise.all([fetchAdminCoordinators(), fetchAdminUnreadMessageCount()]);
      const nextCoordinators = coordinatorData.coordinators || [];
      const nextUnread = Number(unreadData.unreadCount || 0);
      setCoordinators(nextCoordinators);
      setUnread(nextUnread);
      sessionStorage.setItem(ADMIN_DASHBOARD_CACHE_KEY, JSON.stringify({
        coordinators: nextCoordinators,
        unread: nextUnread
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const auth = getAuth();
    const role = String(auth?.user?.role || "");
    if (!auth?.token || !["admin", "super_admin"].includes(role)) {
      navigate("/portal");
      return;
    }

    hydrateFromCache();
    loadDashboard()
      .catch((error) => setAlert(error instanceof Error ? error.message : "Failed to load dashboard."));
  }, [navigate]);

  async function handleApproveEvent(eventDbId: string) {
    try {
      setUpdatingEventId(eventDbId);
      setAlert("");
      await updateAdminEventStatus(eventDbId, "active");
      await loadDashboard();
      setAlert("Event approved successfully. Participants can now see and register.");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to approve event.");
    } finally {
      setUpdatingEventId("");
    }
  }

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <SectionHeader title="Coordinator Dashboard" subtitle="View coordinator profiles and approve events before they appear publicly." />
        <div className="flex justify-end">
          <div className="flex gap-3">
            <Link to="/admin/messages" className="relative px-5 py-3 rounded-lg border border-white/15 text-muted-foreground">
              Notifications
              {unread > 0 ? (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              ) : null}
            </Link>
            <button onClick={() => { clearAuth(); navigate("/"); }} className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground">
              Logout
            </button>
          </div>
        </div>

        {!!alert && <p className="text-sm text-destructive">{alert}</p>}

        <section className="glass-card p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Coordinators</h2>
          {loading && !coordinators.length ? (
            <p className="text-sm text-muted-foreground mb-4">Loading dashboard...</p>
          ) : null}
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {coordinators.map((row) => {
            const item = row as {
              id: string;
              name: string;
              department: string;
              participantCount: number;
              totalEvents: number;
              status: string;
              pendingCount?: number;
              photoUrl?: string;
              role?: string;
              pendingEvents?: Array<{ id: string; title?: string; time?: string; fee?: number }>;
            };
            const coordinatorPreview = {
              id: item.id,
              name: item.name,
              department: item.department,
              role: item.role,
              photoUrl: item.photoUrl,
              totalParticipants: item.participantCount || 0,
              totalEvents: item.totalEvents || 0,
              status: item.status || "N/A",
              username: "",
              email: "",
              phone: "",
              events: item.pendingEvents || [],
            };
            return (
              <Link
                to={`/admin/coordinators/${item.id}`}
                state={{ coordinatorPreview }}
                key={item.id}
                className="glass-card p-4 sm:p-6 card-hover-glow flex h-full flex-col"
                onClick={() => cacheCoordinatorPreview(item.id, coordinatorPreview)}
                onMouseEnter={() => warmImage(item.photoUrl)}
                onTouchStart={() => warmImage(item.photoUrl)}
              >
                {resolveApiAssetUrl(item.photoUrl) ? (
                  <img
                    src={resolveApiAssetUrl(item.photoUrl)}
                    alt={item.name}
                    className="mb-4 h-40 w-full rounded-xl border border-white/10 object-cover sm:h-44"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="mb-4 flex h-40 w-full items-center justify-center rounded-xl border border-white/10 bg-card/40 text-muted-foreground sm:h-44">
                    No Photo
                  </div>
                )}
                <div className="min-h-[96px] sm:min-h-[112px]">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-sm font-bold leading-tight text-foreground break-words sm:text-base">
                        {item.name}
                      </h3>
                    </div>
                    {item.pendingCount && item.pendingCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-400 sm:px-3 sm:text-xs">
                        Pending
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 min-w-0 sm:mt-1">
                    <p className="text-sm leading-snug text-muted-foreground break-words">{item.department}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:mt-1">
                      {item.role || "Event Coordinator"}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-2 sm:pt-4 space-y-1.5 text-sm text-muted-foreground">
                  <p>Participants: {item.participantCount || 0}</p>
                  <p>Events: {item.totalEvents || 0}</p>
                </div>
              </Link>
            );
          })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
