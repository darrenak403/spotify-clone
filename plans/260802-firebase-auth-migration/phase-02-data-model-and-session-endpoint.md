# Phase 2: Backend Data Model Migration + Admin Claims + Session Endpoint

## Requirements

Users can be looked up by their Firebase identity, an admin's Firebase account is recognized as an admin without an external round-trip, and the backend can issue its own short-lived session token from a verified Firebase sign-in.

## Steps

1. Extend the user record to support a new Firebase-based identity field, and rename the existing Clerk identity field so it is clearly marked as legacy, read-only history rather than an active lookup key.
2. Keep the database's own internal user identifier as the single source of truth for all relationships (chat, playlists, etc.) — the identity field only changes how a user is looked up, not how they're referenced elsewhere.
3. Update every place that currently looks up or creates users by the old identity field (auth controller, user controller, admin controller) to sit behind the Phase 1 `verifyIdToken` middleware and derive the user's identity (uid, email, name, picture) **exclusively from the verified token payload** — never from client-supplied request-body fields. This closes an existing impersonation hole in the current `authCallback` handler, which today has no auth middleware and trusts an `id`/name/avatar sent raw in the request body. Create a local user record on first sign-in if one doesn't exist, using an atomic upsert (e.g. `findOneAndUpdate` with `upsert: true`, or catch the duplicate-key error) to avoid a race condition creating duplicate records on near-simultaneous first sign-ins.
4. **Before** switching the admin-authorization check to read from custom claims, set the designated admin's Firebase account custom claim (`admin: true`) as an explicit, verified prerequisite step — do this and confirm it against the live Firebase project first. Only once that's confirmed working, update the admin-authorization check to read that status directly from the verified token instead of calling out to Clerk. Sequencing matters: flipping the code before the claim exists locks out the admin panel with no fallback.
5. Add a new endpoint that accepts a verified Firebase sign-in and, in exchange, issues a backend-signed session token for the caller, scoped for use as the Socket.io handshake credential only (see Phase 3) — not as a substitute for the Firebase ID token on ordinary REST API calls, which continue to be verified by the Phase 1 middleware directly. Set the token's expiry to **24 hours** (chosen to minimize how often the frontend needs to silently refresh it — see Phase 3 step 6 for the refresh-on-disconnect behavior this implies).
6. Document (in code comments or a short note) that historical messages tied to old Clerk identities are not being remapped and remain read-only — call out explicitly that any user actively mid-conversation at cutover time will see their chat history split/reset under the new identity, since this is a user-visible effect, not just inert stale data.
7. Manually verify: a brand-new sign-in creates a local user record correctly linked to their Firebase identity; two near-simultaneous first-time sign-ins from the same account don't create duplicate user records; the designated admin account passes the admin check; the session endpoint returns a usable token (with the documented expiry) for a valid Firebase sign-in and rejects an invalid one.

## Success Criteria

- A first-time sign-in via Firebase creates a corresponding local user record linked by the new identity field.
- The admin-only check passes for the designated admin account and fails for a normal account, with no external lookup call involved.
- Calling the new session endpoint with a valid Firebase sign-in returns a session token; calling it with an invalid or missing sign-in is rejected.
- Existing user records and their internal identifiers are unchanged; no data is deleted.

## Risks

- The existing admin loses access after cutover because their account isn't yet marked as an administrator: the claim-setting step is now an ordered prerequisite in Steps (step 4) rather than a side risk — do not flip the admin-check code path before it's confirmed.
- Confusing the legacy identity field with the new one in some code path, causing duplicate user records: audit every user lookup/creation path touched in this phase before moving on.
- The backend session token (step 5) is a stateless, self-contained JWT — it remains valid until its stated expiry even after the user signs out client-side, and there's no server-side revocation list. Acceptable for a demo project; document this as a known limitation rather than silently omitting it.
- Session token has no defined refresh/reconnect behavior for a socket connection that outlives the token's expiry — Phase 3 should treat an expired-token disconnect as an expected case the client reconnects from, not an unhandled error.
