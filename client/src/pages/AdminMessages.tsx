import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import ParticleBackground from "@/components/ParticleBackground";
import { deleteAdminMessage, fetchAdminMessages, markAdminMessageRead } from "@/data/api";
import { clearAuth, getAuth } from "@/data/auth";

const AdminMessagesPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [alert, setAlert] = useState("");

  function handleAdminAccessError(error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("Signature coordinator cannot access admin routes") ||
      message.includes("permission")
    ) {
      clearAuth();
      navigate("/portal");
      return true;
    }
    return false;
  }

  async function load() {
    const data = await fetchAdminMessages();
    setMessages(data.messages || []);
  }

  useEffect(() => {
    const auth = getAuth();
    const role = String(auth?.user?.role || "");
    if (!auth?.token || !["admin", "super_admin"].includes(role)) {
      navigate("/portal");
      return;
    }
    load().catch((error) => {
      if (handleAdminAccessError(error)) return;
      setAlert(error instanceof Error ? error.message : "Failed to load messages.");
    });
  }, [navigate]);

  return (
    <div className="pt-24 pb-14 relative overflow-hidden">
      <ParticleBackground />
      <div className="container mx-auto px-4 max-w-5xl relative z-10 space-y-4">
        <div className="space-y-4">
          <SectionHeader title="Notifications" subtitle="" />
          <div className="flex justify-end">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground"
            >
              Back
            </button>
          </div>
        </div>
        {!!alert && <p className="text-sm text-destructive mb-4">{alert}</p>}
        <div className="space-y-4">
          {messages.map((row) => {
            const item = row as { id: string; subject: string; name: string; email: string; phone?: string; message: string; isRead: boolean; createdAt?: string };
            return (
              <div key={item.id} className={`glass-card p-6 relative ${item.isRead ? "" : "border-amber-400/30"}`}>
                {!item.isRead && (
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400">
                    New
                  </span>
                )}
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div className="min-w-0 flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-foreground">{item.subject}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">From: {item.name} • {item.email}</p>
                      <p className="text-sm text-muted-foreground">{item.phone || "No phone"}</p>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{item.message}</p>
                  </div>
                  <div className="flex flex-col justify-end items-end">
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <button
                          onClick={() => markAdminMessageRead(item.id).then(load)}
                          className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const ok = window.confirm("Delete this message? This cannot be undone.");
                          if (!ok) return;
                          deleteAdminMessage(item.id).then(load);
                        }}
                        className="px-3 py-2 rounded-lg border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
