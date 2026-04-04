import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import { fetchCoordinatorMe, updateCoordinatorProfile } from "@/data/api";
import { getAuth } from "@/data/auth";
import { Eye, EyeOff } from "lucide-react";

const departmentOptions = [
  "Computer Engineering",
  "Information Technology",
  "Electronics and Telecommunication",
  "Instrumentation and Control Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence and Data Science",
  "Electrical Engineering",
  "MBA",
  "MCA",
  "Other",
];

const coordinatorRoleOptions = [
  "Event Manager",
  "Fest Convenor",
  "Vice Convenor",
  "General Secretary",
  "Treasurer",
  "Tech Lead",
  "Web Developer",
  "App Developer",
  "Marketing Head",
  "PR Manager",
  "Social Media Lead",
  "Design Head",
  "UI/UX Designer",
  "Event Coordinator",
];

const CoordinatorUpdateProfilePage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [paymentQr, setPaymentQr] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    department: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    coordinatorRole: "",
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || String(auth?.user?.role || "") !== "coordinator") {
      navigate("/portal");
      return;
    }
    fetchCoordinatorMe()
      .then((data) => {
        const me = (data.coordinator || {}) as { name?: string; department?: string; phone?: string; email?: string; coordinatorRole?: string };
        setForm({
          name: String(me.name || ""),
          department: String(me.department || ""),
          phone: String(me.phone || ""),
          email: String(me.email || ""),
          password: "",
          confirmPassword: "",
          coordinatorRole: String(me.coordinatorRole || ""),
        });
      })
      .catch((error) => setAlert(error instanceof Error ? error.message : "Failed to load profile."));
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setAlert("");
      if (form.password && form.password !== form.confirmPassword) {
        setAlert("Confirm password does not match.");
        return;
      }
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("department", form.department);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("coordinatorRole", form.coordinatorRole);
      if (form.password) fd.append("password", form.password);
      if (photo) fd.append("photo", photo);
      if (paymentQr) fd.append("paymentQr", paymentQr);
      await updateCoordinatorProfile(fd);
      navigate("/coordinator/dashboard", { state: { flashMessage: "Profile updated successfully." } });
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <SectionHeader title="Update Profile" subtitle="Keep your coordinator details up to date." />
        <div className="flex justify-end">
          <Link to="/coordinator/dashboard" className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground">
            Back
          </Link>
        </div>

        {!!alert && <p className="text-sm text-destructive">{alert}</p>}

        <section className="glass-card p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <select
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              value={form.coordinatorRole}
              onChange={(e) => setForm({ ...form, coordinatorRole: e.target.value })}
            >
              <option value="">Select role</option>
              {coordinatorRoleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Select department</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              placeholder="Phone"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\\D/g, "").slice(0, 10) })}
            />
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border pr-12"
                placeholder="New password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border pr-12"
                placeholder="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <label className="text-sm text-muted-foreground mb-1 block">Profile Photo Upload</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
            <label className="text-sm text-muted-foreground mb-1 block">Payment QR Upload</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentQr(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold">
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CoordinatorUpdateProfilePage;
