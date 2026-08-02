# Phase 5: Cutover — Remove Clerk Entirely

## Requirements

No trace of Clerk remains anywhere in the codebase — packages, imports, environment variables, or middleware — and the app runs fully on Firebase Authentication as its only identity provider.

## Steps

1. Remove the old Clerk-based authentication middleware and any Clerk-specific admin lookup logic from the backend now that the new middleware and admin claim check from earlier phases are proven working.
2. Remove the Clerk client library and its provider/wrapper from the frontend app entry points, replacing them with the new Firebase-based provider from Phase 4.
3. Sweep every file identified in scope (frontend and backend) for remaining Clerk imports, hooks, or components and remove or replace each one with its Firebase-based equivalent.
4. Remove the Clerk packages from both the backend and frontend dependency lists, along with the now-unused JWKS verification library.
5. Remove all Clerk-related environment variables from local env files and any example/template env files.
6. Run the app end-to-end locally: sign in, browse protected pages, use the admin panel, send a chat message, and sign out — confirming nothing regresses.
7. Search the whole repository for any remaining mention of Clerk and resolve each one.

## Success Criteria

- A repository-wide search for Clerk references (imports, package names, env var names) returns nothing outside of historical planning notes.
- The backend and frontend both start and run correctly with only Firebase-related authentication dependencies installed.
- A full manual pass — sign in, view protected content, use the admin panel, send/receive a chat message, sign out — succeeds without errors.

## Risks

- A forgotten Clerk reference in a rarely-used file causing a runtime import error: mitigate with the explicit repo-wide search step before closing this phase.
- Removing an environment variable that's still referenced somewhere overlooked: cross-check the sweep against Phase 6's env var documentation before finalizing.
