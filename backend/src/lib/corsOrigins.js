const DEFAULT_ORIGINS = [
  "https://music.darrenak.id.vn",
  "https://spotify-omega-ashen.vercel.app",
  "http://localhost:3000",
  // Capacitor's iOS WKWebView serves the app from this fixed origin.
  "capacitor://localhost",
];

export const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",").map((origin) => origin.trim())
  : DEFAULT_ORIGINS;
