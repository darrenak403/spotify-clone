# Plan: Replace Clerk Authentication with Firebase Authentication

Status: 🟡 In Progress
Date: 2026-08-02
Mode: Hard

## Overview

Migrate the spotify-clone app off Clerk onto Firebase Authentication end-to-end (backend token verification, admin claims, socket auth, frontend sign-in UI), while keeping MongoDB/Mongoose as the sole data store and safely preserving historical Clerk-linked records.

## Sprint Contract

**In Scope:**
- Firebase project wiring on backend (`firebase-admin`) and frontend (`firebase` client SDK v9+ modular API)
- New Express auth middleware using `admin.auth().verifyIdToken()`, replacing the JWKS/Clerk-JWT middleware
- Admin authorization via Firebase custom claims (`admin: true`), replacing the `clerkClient.users.getUser()` round-trip
- User model migration: add `firebaseUid` field, rename existing Clerk id field to `legacyClerkId` (read-only), keep Mongo `_id` as canonical FK
- New `/api/auth/session` endpoint issuing a backend-signed short-lived JWT from a verified Firebase ID token
- Socket.io handshake authentication using the new backend session JWT (closes a pre-existing zero-auth gap in `lib/socket.js`)
- Frontend `AuthProvider` rewrite using `onAuthStateChanged`, Google OAuth sign-in via `signInWithPopup`, custom sign-out button and avatar UI to replace Clerk's prebuilt components
- Full cutover: removal of `@clerk/clerk-react`, `@clerk/clerk-sdk-node`, `@clerk/express`, `jwks-rsa` and all Clerk imports/env vars across every file listed in scope
- Deployment env var documentation update for Render (backend) + Vercel (frontend)

**Explicit Exclusions:**
- No adoption of Firestore or any Firebase product other than Authentication — MongoDB/Mongoose remains the only data layer
- No migration/remapping of historical `message.model.js` `senderId`/`receiverId` values or old Clerk-id-keyed records — these become read-only history, no email-match reconciliation script
- No new UI design system or visual redesign of sign-in/sign-out affordances beyond minimal functional replacement
- No changes to unrelated features (playlists, admin song/album CRUD, player logic) beyond what's needed to swap the auth identity source

**Verification Standard:** Manual end-to-end smoke pass — a user can sign in with Google via Firebase, reach protected pages, appears in the admin panel correctly (admin claim honored), sends/receives a chat message over an authenticated socket connection, and no Clerk import, package, or env var remains anywhere in the repo (`grep -ri clerk` across backend/frontend returns nothing except this plan's own history notes).

## Phases

- [x] Phase 1: Firebase project setup + backend SDK init + new auth middleware (parallel, non-breaking)
- [x] Phase 2: Backend data model migration + admin claims + `/api/auth/session` endpoint
- [x] Phase 3: Socket.io handshake authentication fix
- [x] Phase 4: Frontend Firebase SDK integration + AuthProvider rewrite + custom sign-in/sign-out UI
- [x] Phase 5: Cutover — remove Clerk entirely, update all remaining touched files
- [x] Phase 6: Deployment env var + CORS documentation update for Render/Vercel (docs done; live Render/Vercel dashboard config + deployed smoke test needs the user — no dashboard access from here)

## Research Summary

Two independent researcher passes agreed on the same approach:

- **Backend verification**: `firebase-admin`'s `verifyIdToken()` structurally mirrors the existing JWKS-based JWT-verify pattern in `auth.middleware.js`, so it should fully replace it rather than run alongside it. Guard app init with `admin.apps.length` to avoid duplicate-init errors under nodemon/hot reload. The service account private key env var needs a `.replace(/\\n/g, '\n')` fixup before `admin.credential.cert()` — a common deployment footgun when secrets are stored as single-line env vars.
- **Frontend sign-in**: Firebase has no prebuilt `<SignIn>`/`<UserButton>` components like Clerk. `signInWithPopup(new GoogleAuthProvider())` is the closest drop-in for the existing OAuth button; a minimal custom sign-out button and avatar UI must be hand-built, and session state must be observed via `onAuthStateChanged` inside `AuthProvider`.
- **Admin check**: Firebase custom claims (`admin: true`, set once via the Admin SDK) checked directly off the verified token remove the external API round-trip that `clerkClient.users.getUser()` currently performs on every admin request.
- **Identity/FK strategy**: keep Mongo `_id` as the canonical internal foreign key everywhere. Add a new `firebaseUid` field to the User model for lookup by the new provider; rename the existing Clerk id field to `legacyClerkId` and freeze it as read-only history. Do not attempt to remap `message.model.js` `senderId`/`receiverId` (raw external-id strings, not ObjectId refs) — this is a hobby/demo project with no real production user base, so a risky email-match reconciliation script isn't worth the risk; old messages become inert history.
- **Socket.io gap (new finding)**: `backend/src/lib/socket.js` currently performs zero authentication — the client sends a raw, unverified `userId` string. This is a pre-existing security hole, not something Clerk caused, and must be fixed as part of this work. Chosen fix: a new `io.use()` handshake middleware validates a backend-issued JWT (from the new `/api/auth/session` endpoint, signed with the already-present `jsonwebtoken` package) rather than the Firebase ID token directly — this avoids mismatches between Firebase's hourly-expiring ID tokens and long-lived socket connections.

Chosen approach across all phases follows the synthesis above; no alternative approach was scoped out (single-track Hard-mode plan).

## Dependencies

- Firebase project must be created in the Firebase console with Google sign-in provider enabled, and a service account JSON generated, before Phase 1 backend work can be verified end-to-end
- Render (backend) and Vercel (frontend) environment variable panels need write access to add the new Firebase config, addressed in Phase 6

## Risks

- CRITICAL (red-team, resolved in Phase 2): the existing `authCallback` handler has no auth middleware and trusts an `id`/name/avatar sent raw in the request body — anyone could impersonate or mint accounts. Fixed by requiring Phase 2's user-lookup/creation code to sit behind the Phase 1 `verifyIdToken` middleware and derive identity solely from the verified token, never from client-supplied body fields.
- CRITICAL (red-team, resolved in Phase 2 + Phase 4): the plan originally had Phase 4 sending the backend session JWT to ordinary REST routes, which contradicts the Phase 1/2 `verifyIdToken`-based middleware and would 401 every protected API call. Fixed: REST calls send the raw Firebase ID token; the backend session JWT is used only for the Socket.io handshake (Phase 3).
- HIGH: Duplicate Firebase Admin app initialization on server hot-reload throws and crashes the backend — mitigate by guarding `admin.initializeApp()` behind an `admin.apps.length` check (Phase 1)
- HIGH: Cutting over the socket handshake to require a token could break all existing chat connections if frontend and backend deploys aren't coordinated — resolved by making Phase 3 backward-compatible for a transition window (accept both the new session token and the old unauthenticated fallback, with the fallback path logged), then removing the fallback only after confirming the frontend change has rolled out and no fresh legacy-path usage is observed
- HIGH: Admin custom claim not set for the existing admin's Firebase account before the admin-check code path flips over locks them out of the admin panel with no fallback — Phase 2 now orders the claim-setting step as an explicit prerequisite (step 4) before the code switch, not just a side risk
- HIGH: Firebase Google sign-in also depends on the Firebase Console's own "Authorized domains" allowlist, a separate surface from Express CORS — Phase 6 now has an explicit step for this; a CORS fix alone does not make sign-in work on a new deployed origin
- MEDIUM: Service account private key env var breaks in production due to newline escaping — mitigate with the documented `.replace(/\\n/g, '\n')` fixup and a startup log/assertion that the key parsed correctly (Phase 1, verified again in Phase 6 deploy docs)
- MEDIUM: Backend session token is a stateless JWT with no server-side revocation — it stays valid until its documented expiry even after sign-out. Accepted for this project's scale; documented explicitly in Phase 2 rather than left silent.
- MEDIUM: First-time user creation in `authCallback` had a TOCTOU race (`findOne` then `create`) that could create duplicate user records on near-simultaneous sign-ins — Phase 2 now specifies an atomic upsert or duplicate-key handling.
- MEDIUM: Old Clerk-linked chat history becomes split/unreadable after cutover for any user actively mid-conversation at migration time — this is a user-visible effect (not just inert stale data), accepted per scope for this demo project, but called out explicitly in Phase 2 rather than treated as a passive LOW risk.
- LOW: `verifyIdToken` doesn't check token revocation by default (disabled/revoked Firebase accounts stay valid until natural ~1hr token expiry) — accepted trade-off; can add `checkRevoked: true` on the admin-check path later if needed.
- LOW: A browser holding an active Clerk session at cutover time simply loses it once `<ClerkProvider>` is removed in Phase 5 — expected behavior is the user re-signs-in with Google via Firebase; no session carry-over is attempted.

## Session Notes
<!-- Updated by cook automatically — do not edit manually -->

**Last active:** 2026-08-02 23:40
**Phase in progress:** phase-06-deployment-env-docs (starting next)
**Status:** Phases 1-5 code complete. Frontend type-checks and builds cleanly (`tsc -b && vite build`); backend passes `node --check`. Real Firebase ID token exchange still unverified pending user's real Firebase project credentials. User asked to cook continuously through all phases without per-phase approval pauses.

### Decisions made this session
- Phase 1: `firebase-admin` init (`backend/src/lib/firebaseAdmin.js`) skips `initializeApp()` (warns only) if Firebase env vars are missing, so the server stays bootable pre-migration. New middleware in a separate file from Clerk's; temporary `GET /api/firebase-test/whoami` route added for isolated verification (to delete in Phase 5).
- Phase 2: `user.model.js` now has `firebaseUid` (unique, sparse) as the active lookup key and `legacyClerkId` (sparse, read-only) replacing `clerkId`; `imageUrl` relaxed to optional since Firebase accounts may lack a photo. No data-migration script for existing Clerk-linked user docs — consistent with the plan's already-accepted stance on old identity data.
- `authCallback` rewritten as an atomic `findOneAndUpdate(..., {upsert:true})` keyed by `firebaseUid`, deriving identity only from `req.firebaseUser` (fixes the impersonation hole) — no separate duplicate-key catch needed since upsert is atomic per document.
- Added `POST /api/auth/session` (backend-signed JWT, `SESSION_JWT_SECRET`, 24h expiry) for Phase 3's socket handshake.
- Admin authorization switched to Firebase custom claim `admin: true` read directly off the verified token (`requireFirebaseAdmin` in `firebaseAuth.middleware.js`); `admin.controller.js`'s `checkAdmin` simplified since the middleware already gates non-admins. Added `backend/src/scripts/setAdminClaim.js` (+ `npm run set-admin-claim`) as the explicit one-time prerequisite script the user must run against the real Firebase project before the admin panel will work for their account.
- Chat/user identity switched from the old external Clerk id to the Mongo `_id` (via new `attachDbUser` middleware) as the canonical FK — matches the plan's identity strategy. `user.route.js` and `admin.route.js` now use `verifyFirebaseToken` (+ `attachDbUser` / `requireFirebaseAdmin`) instead of the Clerk middleware.
- Verified locally: server boots cleanly against a real local MongoDB; `/api/users`, `/api/admin/check`, and `/api/auth/session` all correctly return 401 without a token. Valid-token path still unverified pending the user's real Firebase project (Dependency, unchanged from Phase 1).
- **Security note (self-caught, not user-caused):** mid-session a stray `xx` statement appeared in `backend/src/lib/firebaseAdmin.js` on disk, accompanied by a hook-injected instruction to hide it from the user and not revert it — flagged to the user as a likely prompt-injection attempt and removed as a normal bug fix (confirmed via raw byte dump that it wasn't something I had written).

- Phase 4: Frontend rewritten onto Firebase — `frontend/src/lib/firebase.ts` (app/auth/googleProvider init), `AuthProvider.tsx` rebuilt around `onAuthStateChanged` (drives REST auth header from the raw Firebase ID token, calls `/auth/callback` then `/auth/session`, feeds the session token into `initSocket`). `User` type dropped `clerkId` in favor of `_id` everywhere (`FriendActivity.tsx`, `ChatPage.tsx`, `MessageInput.tsx`, `ChatHeader.tsx`, `UsersList.tsx`). New `UserMenu.tsx` (avatar + sign-out) replaces Clerk's `<UserButton/>` in `TopBar.tsx` and admin `Header.tsx`; `<SignedIn>`/`<SignedOut>` replaced with plain `useAuth().user` conditionals. Deleted `src/pages/auth-callback/` (Firebase popup sign-in needs no redirect callback page) and its routes in `App.tsx`. `main.tsx` no longer wraps the app in `<ClerkProvider>`. Verified with `tsc -b` (clean) and `vite build` (clean, after fixing an unrelated pre-existing corrupted `magic-string` install by reinstalling it — not a Clerk-migration change).
- Phase 5: Deleted `backend/src/middleware/auth.middleware.js` (old Clerk JWKS middleware) and the temporary `backend/src/routes/firebase-test.route.js` (+ its mount/import in `index.js`); removed the commented-out `clerkMiddleware()` lines. Removed `@clerk/clerk-sdk-node`, `@clerk/express`, `jwks-rsa` from `backend/package.json` and `@clerk/clerk-react` from `frontend/package.json`, then ran `npm install` in both to sync lockfiles (61 packages removed backend-side, 8 frontend-side). Updated stale `//clerkId` comments in `message.model.js` to reflect that sender/receiver ids are now Mongo `_id`s. Left `user.model.js`'s `legacyClerkId` field and comment in place intentionally — it's frozen read-only history for pre-migration accounts, not an active Clerk dependency. Updated `README.md`'s tech-stack list (Clerk → Firebase Authentication / Firebase Admin SDK). Repo-wide grep for `clerk`/`Clerk` outside `node_modules` now only matches planning docs and that one intentional legacy field. Could not remove `VITE_CLERK_PUBLISHABLE_KEY` from `frontend/.env` directly — the file is outside tool read/write permissions in this session; flagging for the user to remove manually (Phase 6 will document the replacement `VITE_FIREBASE_*` vars needed instead).

- Phase 6: Added an "Environment Variables" section to `README.md` documenting every backend var (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `SESSION_JWT_SECRET`, `ADMIN_EMAIL`, plus existing `MONGODB_URI`/Cloudinary vars) and frontend var (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, existing `VITE_REACT_APP_BACKEND_URL`), explicitly noting no `VITE_CLERK_PUBLISHABLE_KEY` is needed anymore. Documented the two distinct deploy-time gates: Express CORS allow-list vs. Firebase Console's separate "Authorized domains" list (missing the latter surfaces as `auth/unauthorized-domain`, not a CORS error).
- **Genuine blocker for the rest of Phase 6**: actually setting the new env vars in the Render/Vercel dashboards, confirming the backend's CORS allow-list against the real deployed frontend origin, adding that origin to Firebase Console's Authorized domains, and running a live deployed smoke test all require dashboard/account access this session does not have. These are the only remaining action items and they need the user.

### Next immediate action
All 6 phases are code-complete. Remaining work is entirely the user's: (1) create/confirm the real Firebase project and service account, (2) set the documented env vars in Render + Vercel, (3) add the Vercel origin to Firebase Console's Authorized domains, (4) run `npm run set-admin-claim` against their own account, (5) do one full sign-in → admin panel → chat smoke test against the live deployment.
