function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  const isProduction = String(process.env.NODE_ENV || "").trim().toLowerCase() === "production";

  if (!secret) {
    throw new Error("Missing JWT_SECRET.");
  }

  if (isProduction && (secret.length < 32 || /techfest/i.test(secret))) {
    throw new Error("JWT_SECRET must be strong and unique in production.");
  }

  return secret;
}

module.exports = { getJwtSecret };
