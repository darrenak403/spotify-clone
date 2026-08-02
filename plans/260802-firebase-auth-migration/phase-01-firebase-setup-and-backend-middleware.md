# Phase 1: Firebase Project Setup + Backend SDK Init + New Auth Middleware

## Requirements

The backend can independently verify a Firebase ID token and identify the caller, without yet touching any existing Clerk-protected route — this phase is safe to land without breaking current sign-in.

## Steps

1. Create (or confirm) a Firebase project with Google sign-in enabled as an authentication provider, and generate a service account credential for server-side use.
2. Add the Firebase Admin SDK as a backend dependency and initialize it once at startup, guarding against re-initialization on server restarts/hot reload.
3. Store the service account credentials as backend environment variables, handling the private key's line-break formatting correctly so it parses in every environment (local and deployed).
4. Build a new authentication middleware that verifies an incoming Firebase ID token and attaches the verified identity to the request, functionally replacing the current token-verification middleware.
5. Expose a temporary, isolated test route protected only by the new middleware so the new verification path can be validated in isolation before anything else depends on it.
6. Manually verify: signing in via a temporary Firebase test client (or Firebase console token) and calling the new test route returns the verified identity; an invalid or missing token is rejected.

## Success Criteria

- The backend starts without errors and does not crash on restart (no duplicate Firebase app initialization).
- A request to the new test route with a valid Firebase ID token succeeds and returns the caller's identity.
- A request to the new test route with a missing or invalid token is rejected with an authentication error.
- No existing Clerk-protected route is affected or altered by this phase.

## Risks

- Duplicate Firebase Admin initialization crashing the server on hot reload: guard initialization behind a check for an already-initialized app.
- Service account private key failing to parse due to escaped newlines in the environment variable: normalize the key's line breaks before use and confirm with a startup check.
- `verifyIdToken` does not check for token revocation by default (disabled/revoked Firebase accounts stay valid until natural token expiry, ~1hr). Accepted trade-off for this project's scale; consider passing the revocation-check flag specifically on the admin-check path if tighter guarantees are ever needed there.
