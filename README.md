# Spotify Clone 
[![Spotify](https://github.com/darrenak403/spotify-clone/actions/workflows/node.js.yml/badge.svg)](https://github.com/darrenak403/spotify-clone/actions/workflows/node.js.yml)

- Live demo (backend on Render, frontend on Vercel): [See the demo here.](https://music.darrenak.id.vn/)

This project is a personal learning and exploration exercise inspired by Spotify. It was built out of my passion for music streaming platforms and my desire to learn and experiment with modern web technologies.
---

## 🖼️ Screenshots / Demo

![Screenshot 1](https://github.com/darrenak403/spotify-clone/blob/main/screenshots/Home.png)
![Screenshot 2](https://github.com/darrenak403/spotify-clone/blob/main/screenshots/Dashboard.png)
![Screenshot 3](https://github.com/darrenak403/spotify-clone/blob/main/screenshots/Chat%20RealTime.png)
<!-- Add more images as needed -->

---

## 🚀 Technologies

### Frontend
- **React**  
- **Vite**  
- **TypeScript**  
- **Tailwind CSS**  
- **Radix UI**  
- **Firebase Authentication**  
- **React Router DOM**  
- **Socket.io-client**  
- **Zustand**  
- **Lucide-react**  
- **React Hot Toast**  
- **React Resizable Panels**  
- **Class Variance Authority**  
- **clsx**  

### Backend
- **Express**  
- **PostgreSQL** (via Neon)
- **Prisma** (ORM)
- **Cloudinary**  
- **dotenv**  
- **CORS**  
- **express-fileupload**  
- **Firebase Admin SDK**
- **Jwts**
- **Socket.io**  
- **node-cron**  

---

## 🔐 Environment Variables

### Backend (Render)
| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL pooled connection string (Neon, ends in `-pooler`); used by the app at runtime |
| `DIRECT_URL` | PostgreSQL direct/unpooled connection string (Neon); required by `prisma migrate` only |
| `PORT` | Server port (Render sets this automatically) |
| `FIREBASE_PROJECT_ID` | Firebase project id, from the service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account client email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key. Paste with literal `\n` escapes for newlines — the app normalizes them at startup (`backend/src/lib/firebaseAdmin.js`) |
| `SESSION_JWT_SECRET` | Secret used to sign the short-lived session JWT issued by `POST /api/auth/session`, consumed only by the Socket.io handshake |
| `ADMIN_EMAIL` | Email of the account to grant the `admin` custom claim to, used by `npm run set-admin-claim` (one-time script, run locally against the target Firebase project) |
| `CLOUDINARY_*` | Cloudinary credentials (unchanged) |

### Frontend (Vercel)
| Variable | Description |
| --- | --- |
| `VITE_REACT_APP_BACKEND_URL` | Deployed backend base URL, used for REST + Socket.io |
| `VITE_FIREBASE_API_KEY` | Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web app config |
| `VITE_FIREBASE_APP_ID` | Firebase web app config |

No Clerk-related environment variables (e.g. `VITE_CLERK_PUBLISHABLE_KEY`) are needed anymore — remove them from any `.env` files and from the Render/Vercel dashboards.

### Deployment notes
- **CORS**: the backend's allow-list (`backend/src/index.js`) must include the deployed Vercel origin(s), separate from the next point.
- **Firebase Authorized domains**: in the Firebase Console under Authentication → Settings → Authorized domains, add the deployed Vercel origin(s). This is required for `signInWithPopup` to complete — a CORS fix alone does not cover this and its absence surfaces as `auth/unauthorized-domain`.
- After deploying, verify the backend logs show the Firebase Admin credentials parsed correctly (no "does not look like a valid PEM key" warning) before considering the deploy complete.
