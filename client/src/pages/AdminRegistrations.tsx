import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import ParticleBackground from "@/components/ParticleBackground";
import { fetchAdminRegistrations } from "@/data/api";
import { clearAuth, getAuth } from "@/data/auth";

const AdminRegistrationsPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Record<string, unknown>[]>([]);
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(true);

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
    try {
      setLoading(true);
      const data = await fetchAdminRegistrations();
      setRegistrations(data.registrations || []);
    } catch (error) {
      if (handleAdminAccessError(error)) return;
      setAlert(error instanceof Error ? error.message : "Failed to load registrations.");
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
    load();
  }, [navigate]);

  return (
    <div className="pt-24 pb-14 relative overflow-hidden">
      <ParticleBackground />
      <div className="container mx-auto px-4 max-w-7xl relative z-10 space-y-4">
        <div className="space-y-4">
          <SectionHeader title="Student Registrations" subtitle="View all registered students and their details" />
          <div className="flex justify-end">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {!!alert && <p className="text-sm text-destructive mb-4">{alert}</p>}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No registrations found.</p>
          </div>
        ) : (
          <div className="glass-card p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold">Registration ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">College</th>
                    <th className="text-left py-3 px-4 font-semibold">Department</th>
                    <th className="text-left py-3 px-4 font-semibold">Year</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Event</th>
                    <th className="text-left py-3 px-4 font-semibold">Payment Ref</th>
                    <th className="text-left py-3 px-4 font-semibold">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((row) => {
                    const reg = row as {
                      id: string;
                      registrationId: string;
                      fullName: string;
                      email: string;
                      phone: string;
                      studentCollege: string;
                      studentDepartment: string;
                      studentYear: string;
                      projectCategory?: string;
                      eventName: string;
                      paymentRef: string;
                      createdAt?: string;
                    };
                    return (
                      <tr key={reg.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 font-mono text-xs">{reg.registrationId}</td>
                        <td className="py-3 px-4">{reg.fullName}</td>
                        <td className="py-3 px-4">{reg.email}</td>
                        <td className="py-3 px-4">{reg.phone}</td>
                        <td className="py-3 px-4">{reg.studentCollege}</td>
                        <td className="py-3 px-4">{reg.studentDepartment}</td>
                        <td className="py-3 px-4">{reg.studentYear}</td>
                        <td className="py-3 px-4">{reg.projectCategory || "N/A"}</td>
                        <td className="py-3 px-4">{reg.eventName}</td>
                        <td className="py-3 px-4 font-mono text-xs">{reg.paymentRef}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistrationsPage;
