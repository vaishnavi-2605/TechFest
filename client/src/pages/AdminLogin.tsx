import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { login } from "@/data/api";
import { clearAuth, saveAuth } from "@/data/auth";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setAlert("");

      const response = await login({ email, password });
      const role = String((response.user as { role?: string })?.role || "");

      if (!["admin", "super_admin"].includes(role)) {
        clearAuth();
        setAlert("Invalid login. Only admin can login here.");
        return;
      }

      saveAuth(response);
      navigate("/admin/dashboard");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-xl">
        <SectionHeader title="Admin Login" subtitle="Sign in to access the admin dashboard." />

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => {
                setAlert("");
                setEmail(e.target.value.toLowerCase());
              }}
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Password</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 pr-12 rounded-lg bg-muted/50 border border-border"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setAlert("");
                  setPassword(e.target.value);
                }}
                required
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
          </div>

          {!!alert && <p className="text-sm text-destructive">{alert}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold"
          >
            {loading ? "Please wait..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
