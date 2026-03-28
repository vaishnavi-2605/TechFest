import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import { fetchAdminCoordinators, fetchAdminUnreadMessageCount, updateAdminEventStatus } from "@/data/api";
import { clearAuth, getAuth } from "@/data/auth";
import { resolveApiAssetUrl } from "@/data/helpers";

const ADMIN_DASHBOARD_CACHE_KEY = "techfestAdminDashboardCache";

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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
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
            return (
              <Link
                to={`/admin/coordinators/${item.id}`}
                key={item.id}
                className="glass-card p-6 card-hover-glow flex flex-col h-full"
              >
                {resolveApiAssetUrl(item.photoUrl) ? (
                  <img src={resolveApiAssetUrl(item.photoUrl)} alt={item.name} className="w-full h-44 object-cover rounded-xl border border-white/10 mb-4" />
                ) : (
                  <div className="w-full h-44 rounded-xl border border-white/10 bg-card/40 mb-4 flex items-center justify-center text-muted-foreground">
                    No Photo
                  </div>
                )}
                <div className="flex items-start justify-between gap-4 min-h-[72px]">
                  <div className="min-w-0">
                    <h3 className="font-heading text-lg font-bold text-foreground break-words">{item.name}</h3>
                    <p className="text-sm text-muted-foreground break-words">{item.department}</p>
                    <p className="text-xs text-muted-foreground break-words">{item.role || "Event Coordinator"}</p>
                  </div>
                  {item.pendingCount && item.pendingCount > 0 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
                      Pending
                    </span>
                  ) : null}
                </div>
                <div className="mt-auto pt-4 space-y-2 text-sm text-muted-foreground">
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
