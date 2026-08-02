# Phase 4: Frontend Firebase SDK Integration + AuthProvider Rewrite + Custom Sign-In/Sign-Out UI

## Requirements

A user can sign in with Google through Firebase from the frontend, stay signed in across page reloads, see their signed-in state reflected app-wide, and sign out — replacing every Clerk-provided UI element and hook with an equivalent built on Firebase.

## Steps

1. Add the Firebase client SDK to the frontend and configure it with the project's public web credentials.
2. Rewrite the app's authentication provider to track sign-in state using Firebase's built-in session observer, so the rest of the app can react to sign-in/sign-out the same way it did with the previous provider.
3. Replace the existing OAuth sign-in button with a Firebase-based Google sign-in flow that looks and behaves the same way to the user.
4. Build a minimal sign-out control and a small user avatar/profile display to replace the previous provider's prebuilt account UI, placed everywhere the old UI appeared (top bar, sidebar, admin header, chat screens).
5. Update the post-sign-in callback/redirect flow, the shared type definitions for the authenticated user, and every component that reads the current user's id or profile info to use the new provider's data shape.
6. Two distinct token paths, do not mix them up: ordinary REST API calls (`/api/users`, `/api/admin/*`, `/api/songs`, etc.) continue to send the **raw Firebase ID token** as the `Authorization: Bearer` header — this is what the Phase 1/2 `verifyIdToken` middleware expects and verifies directly. Separately, exchange that Firebase ID token once for the backend-issued session token (Phase 2 step 5) and use **that** token only for the Socket.io handshake (Phase 3) — never send the session token to REST routes, and never send the raw Firebase ID token to the socket handshake.
7. Manually verify: signing in with Google succeeds and persists across a page refresh; the user's name/avatar appears correctly in every UI location that previously showed Clerk's account widget; signing out clears the session and returns the user to a signed-out state; REST API calls succeed using the Firebase ID token and the socket connection succeeds using the separate session token.

## Success Criteria

- A user can sign in with Google and remains signed in after refreshing the page.
- The user's profile info (name/avatar) displays correctly in the top bar, sidebar, admin header, and chat screens.
- Signing out clears the session and protected pages correctly redirect or show signed-out state.
- All API requests made while signed in are authenticated and succeed against the backend's new verification path.

## Risks

- Token mismatch between what the frontend sends and what the backend now expects: REST calls must use the raw Firebase ID token, and only the Socket.io handshake uses the backend session token — confirm this split is implemented correctly (not swapped or unified) before considering this phase complete.
- Missed UI locations still referencing old provider components, causing a broken import: sweep every file listed in scope for lingering references before closing this phase.
- A currently-signed-in Clerk session in the browser has no migration path once Clerk is removed in Phase 5 — the expected/accepted behavior is the user simply signs in again with Google via Firebase; no session carry-over is attempted.
