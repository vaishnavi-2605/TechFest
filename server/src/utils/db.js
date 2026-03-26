const mongoose = require("mongoose");

function getConnectionPlan() {
  const atlasUri = String(process.env.MONGODB_URI || "").trim();
  const localUri = String(process.env.LOCAL_MONGODB_URI || "").trim();
  const dbMode = String(process.env.DB_MODE || "").trim().toLowerCase();
  const isProduction = String(process.env.NODE_ENV || "").trim().toLowerCase() === "production";

  if (dbMode === "atlas") {
    return [{ label: "MONGODB_URI", uri: atlasUri }];
  }

  if (dbMode === "local") {
    return [{ label: "LOCAL_MONGODB_URI", uri: localUri }];
  }

  if (dbMode === "atlas-first") {
    return [
      { label: "MONGODB_URI", uri: atlasUri },
      { label: "LOCAL_MONGODB_URI", uri: localUri },
    ];
  }

  if (dbMode === "local-first") {
    return [
      { label: "LOCAL_MONGODB_URI", uri: localUri },
      { label: "MONGODB_URI", uri: atlasUri },
    ];
  }

  return isProduction
    ? [
        { label: "MONGODB_URI", uri: atlasUri },
        { label: "LOCAL_MONGODB_URI", uri: localUri },
      ]
    : [
        { label: "LOCAL_MONGODB_URI", uri: localUri },
        { label: "MONGODB_URI", uri: atlasUri },
      ];
}

async function connectDatabase() {
  const targets = getConnectionPlan().filter((item) => item.uri);

  if (!targets.length) {
    throw new Error("Missing database URI. Add MONGODB_URI or LOCAL_MONGODB_URI in server/.env.");
  }

  let lastError;

  for (const target of targets) {
    try {
      await mongoose.connect(target.uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`Connected to MongoDB using ${target.label}`);
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection failed for ${target.label}: ${error.message}`);
    }
  }

  throw lastError || new Error("Failed to connect to MongoDB.");
}

module.exports = { connectDatabase };
