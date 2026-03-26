import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { login, registerCoordinator } from "@/data/api";
import { saveAuth } from "@/data/auth";

const departmentOptions = [
  "Computer Engineering",
  "Information Technology",
  "Electronics and Telecommunication",
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

const PortalAuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    coordinatorRole: "Event Manager",
    department: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function update(key: keyof typeof form, value: string) {
    setAlert("");
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setAlert("");

      if (mode === "register" && form.password !== form.confirmPassword) {
        setAlert("Confirm password does not match.");
        return;
      }

      const response = mode === "login"
        ? await login({ email: form.email, password: form.password })
        : await registerCoordinator((() => {
            const fd = new FormData();
            fd.append("name", form.name);
            fd.append("coordinatorRole", form.coordinatorRole);
            fd.append("department", form.department);
            fd.append("phone", form.phone);
            fd.append("email", form.email);
            fd.append("password", form.password);
            if (photo) fd.append("photo", photo);
            return fd;
          })());

      const auth = saveAuth(response);
      const role = String((auth.user as { role?: string })?.role || "");
      if (role === "admin" || role === "super_admin") navigate("/admin/dashboard");
      else navigate("/coordinator/dashboard");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <SectionHeader title="Event Portal" subtitle="Admin can login here. Coordinators can register and manage their events and participants." />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8">
          <div className="glass-card p-8 card-hover-glow">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4">Add Event</h3>
            <p className="text-lg text-muted-foreground mb-2">Want to create and publish a new event?</p>
            <p className="text-lg text-muted-foreground mb-8">Login/Register as coordinator first.</p>
            <button
              type="button"
              onClick={() => setMode("register")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-heading text-xl font-semibold shadow-[0_0_30px_hsl(187,94%,43%,0.25)]"
            >
              Add Event
            </button>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-5 py-2 rounded-full text-sm font-semibold ${mode === "login" ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`px-5 py-2 rounded-full text-sm font-semibold ${mode === "register" ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}
              >
                Register
              </button>
            </div>

            {mode === "register" && (
              <>
                <input className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
                <select className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border" value={form.department} onChange={(e) => update("department", e.target.value)}>
                  <option value="">Select department</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
                <select className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border" value={form.coordinatorRole} onChange={(e) => update("coordinatorRole", e.target.value)}>
                  {coordinatorRoleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                  placeholder="Phone"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
                <input className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border" placeholder="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Upload Photo</label>
                  <input className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </div>
              </>
            )}

            <input className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border" placeholder="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value.toLowerCase())} />
            <div className="relative">
              <input
                className="w-full px-4 py-3 pr-12 rounded-lg bg-muted/50 border border-border"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
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
            {mode === "register" && (
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-muted/50 border border-border"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
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
            )}

            {!!alert && <p className="text-sm text-destructive">{alert}</p>}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold">
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register as Coordinator"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PortalAuthPage;
