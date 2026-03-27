require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDatabase } = require("./utils/db");
const { seedDefaultAdmin } = require("./utils/seedUsers");
const { uploadDir } = require("./utils/upload");
const imageRouter = require("./routes/images");
const eventsRouter = require("./routes/events");
const registrationsRouter = require("./routes/registrations");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const coordinatorRouter = require("./routes/coordinator");
const contactRouter = require("./routes/contact");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.set("trust proxy", 1);

const allowedOrigins = String(process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS origin not allowed."));
  }
}));
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.resolve(uploadDir)));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "techfest-backend" });
});

app.use("/api/images", imageRouter);
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/registrations", registrationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/coordinator", coordinatorRouter);
app.use("/api/contact", contactRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

async function start() {
  await connectDatabase();
  await seedDefaultAdmin();
  app.listen(PORT, () => {
    console.log(`TechFest backend running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
