const DEFAULT_ORIGINS = [
  "https://spotify-omega-ashen.vercel.app",
  "http://localhost:3000",
];

export const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",").map((origin) => origin.trim())
  : DEFAULT_ORIGINS;
