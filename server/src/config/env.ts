import path from "path";

export const isProd = process.env.NODE_ENV === "production";

// Comma-separated list of allowed frontend origins
export const clientOrigins = (process.env.CLIENT_URL || "http://localhost:8080")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

export const uploadsDir = path.join(__dirname, "../../uploads");

export const requireEnv = (keys: string[]) => {
    const missing = keys.filter((k) => !process.env[k]);
    if (missing.length) {
        console.error(`Missing required env vars: ${missing.join(", ")}`);
        process.exit(1);
    }
};
