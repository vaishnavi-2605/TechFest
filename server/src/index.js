require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDatabase } = require("./utils/db");
const { seedDefaultAdmin, seedSignatureCoordinator } = require("./utils/seedUsers");
const { applySecurityHeaders, createRateLimiter } = require("./middleware/security");
const { getJwtSecret } = require("./utils/authSecurity");
const { uploadDir } = require("./utils/upload");
const imageRouter = require("./routes/images");
const eventsRouter = require("./routes/events");
const registrationsRouter = require("./routes/registrations");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const coordinatorRouter = require("./routes/coordinator");
const contactRouter = require("./routes/contact");
const sponsorsRouter = require("./routes/sponsors");

const app = express();
const PORT = Number(process.env.PORT || 5000);
let server;
const privilegedRouteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: "Too many requests. Please slow down and try again."
});

app.set("trust proxy", 1);
app.disable("x-powered-by");

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
app.use(applySecurityHeaders);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.resolve(uploadDir)));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "techfest-backend" });
});

app.use("/api/images", imageRouter);
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/registrations", registrationsRouter);
app.use("/api/admin", privilegedRouteLimiter, adminRouter);
app.use("/api/coordinator", privilegedRouteLimiter, coordinatorRouter);
app.use("/api/contact", contactRouter);
app.use("/api/sponsors", sponsorsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

async function start() {
  getJwtSecret();
  await connectDatabase();
  await seedDefaultAdmin();
  await seedSignatureCoordinator();
  server = app.listen(PORT, () => {
    console.log(`TechFest backend running on http://localhost:${PORT}`);
  });
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Please free the port or change PORT in server/.env.local.`);
      process.exit(1);
      return;
    }
    console.error("Server error:", err?.message || err);
    process.exit(1);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

function shutdown(signal) {
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(() => {
    console.log(`Server closed (${signal}).`);
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGUSR2", () => shutdown("SIGUSR2"));
