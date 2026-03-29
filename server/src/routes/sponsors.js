const express = require("express");

const Sponsor = require("../models/Sponsor");

const router = express.Router();

const tierOrder = { Title: 0, Gold: 1, Silver: 2 };

router.get("/", async (_req, res) => {
  try {
    const sponsors = await Sponsor.find().sort({ createdAt: 1 }).lean();
    const sortedSponsors = [...sponsors].sort((a, b) => {
      const tierDiff = (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
      if (tierDiff !== 0) return tierDiff;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    return res.json({
      sponsors: sortedSponsors.map((sponsor) => ({
        id: sponsor._id,
        name: sponsor.name,
        tier: sponsor.tier,
        url: sponsor.url || "",
        logo: ""
      }))
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load sponsors." });
  }
});

module.exports = router;
