# Phase 6: Deployment Env Var + CORS Documentation Update

## Requirements

The Render-hosted backend and Vercel-hosted frontend both have the correct Firebase configuration available in their deployed environments, with clear documentation so the deploy migration already underway isn't blocked by missing auth configuration.

## Steps

1. Document every new environment variable the backend needs (Firebase service account fields, session token signing secret) in the project's environment variable reference/README.
2. Document every new environment variable the frontend needs (Firebase public web config) in the same reference.
3. Add or update the corresponding environment variables in the Render dashboard for the backend service, taking care with any multi-line secret formatting.
4. Add or update the corresponding environment variables in the Vercel dashboard for the frontend project.
5. Re-check the backend's CORS allow-list still includes the correct deployed frontend origin(s) so API calls from the deployed frontend succeed.
6. Separately from CORS, add the deployed Vercel origin(s) to the Firebase Console's own **Authorized domains** list (Authentication → Settings) — this is a distinct configuration surface from Express CORS and governs whether `signInWithPopup`/redirect-based Google sign-in is allowed to complete at all. Missing this causes an `auth/unauthorized-domain` error regardless of any CORS fix.
7. Do a final deployed-environment smoke test: sign in, use the admin panel, and send a chat message against the live Render/Vercel deployment, not just locally.

## Success Criteria

- The environment variable reference documentation lists every Firebase-related variable needed by both backend and frontend, with no Clerk variables remaining.
- The deployed backend on Render starts successfully and its Firebase Admin credentials parse correctly.
- The deployed frontend on Vercel can sign a user in against the live backend.
- A full sign-in, admin-panel-use, and chat-message smoke test succeeds against the live deployed environment.

## Risks

- Private key formatting breaking specifically in the Render environment (different from local .env handling): verify with a startup log/assertion after deploying, not just locally.
- CORS misconfiguration blocking the Firebase sign-in redirect or API calls from the deployed frontend: confirm the allow-list matches the live Vercel origin exactly before considering this phase done.
