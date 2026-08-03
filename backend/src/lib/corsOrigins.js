const DEFAULT_ORIGINS = [
  "https://spotify-clone-v1-fqb8.onrender.com",
  "https://spotify-clone-server-fhgn.onrender.com",
  "https://spotifak.darrenak.id.vn",
  "http://localhost:3000",
];

export const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",").map((origin) => origin.trim())
  : DEFAULT_ORIGINS;
