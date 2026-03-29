import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import { addCoordinatorSponsor } from "@/data/api";
import { getAuth } from "@/data/auth";
import { Sponsor } from "@/types";

const CoordinatorAddSponsorPage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tier: "Silver" as Sponsor["tier"],
    url: ""
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || String(auth?.user?.role || "") !== "coordinator") {
      navigate("/portal");
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setAlert("");
      await addCoordinatorSponsor({
        name: form.name,
        tier: form.tier,
        url: form.url
      });
      navigate("/coordinator/dashboard", { state: { flashMessage: "Sponsor added successfully." } });
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Failed to add sponsor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        <SectionHeader title="Add Sponsor" subtitle="Add sponsors using the same tier format shown on the public sponsors sections." />
        <div className="flex justify-end">
          <Link to="/coordinator/dashboard" className="px-5 py-3 rounded-lg border border-white/15 text-muted-foreground">
            Back
          </Link>
        </div>

        {!!alert && <p className="text-sm text-destructive">{alert}</p>}

        <section className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Sponsor Name</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                placeholder="Sponsor name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Type</label>
              <select
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                value={form.tier}
                onChange={(e) => setForm((prev) => ({ ...prev, tier: e.target.value as Sponsor["tier"] }))}
              >
                <option value="Title">Title</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Website Link (optional)</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border"
                placeholder="https://example.com"
                value={form.url}
                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold disabled:opacity-70"
            >
              {loading ? "Adding..." : "Add Sponsor"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CoordinatorAddSponsorPage;
