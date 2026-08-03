# Phase 6: Seed Scripts, Deploy Config & Final Verification

## Requirements

Rewrite the two seed scripts against the new database client, wire up the build/deploy pipeline so schema generation and migrations run automatically on install and deploy, and do a final end-to-end sweep confirming no trace of the old database layer remains and every route still behaves as expected.

## Steps

1. Rewrite the songs seed script to clear and re-insert its song list through the new database client instead of the old connect/insert/close pattern.
2. Rewrite the albums seed script the same way — insert songs first, then albums, then link each song to its album via the album relationship, dropping the old two-way array-sync step (and the unused `plays` field that never made it into the new schema) as deliberate, not accidental, changes.
3. Wire an automatic schema-generation step into the backend's own install process so it fires whenever dependencies are installed (including as a side effect of the existing root-level build script, which installs the backend's dependencies as one of its steps) — confirm this by doing a clean reinstall and checking the generation step actually runs.
4. Wire the non-interactive migration-apply command into whatever step runs before the server starts in a deployed environment, distinct from the interactive migration command used during local development.
5. Do a final repo-wide sweep for any remaining reference to the old database connection string name, the old database driver package, or the old primary-key field name, across both source and environment-template files.
6. Boot the server locally and confirm it starts cleanly with no import errors, then — wherever a live database is reachable — run both seed scripts and spot-check every route family (songs, albums, users, chat) against the same shapes verified in earlier phases.
7. Record in the plan's session notes exactly what was verified against a live database versus what could only be confirmed via boot/syntax checks, matching the transparency standard set by the prior performance-optimization plan.

## Success Criteria

- Both seed scripts run to completion against a fresh Postgres database and the frontend (or a direct request) shows the seeded songs/albums correctly.
- A clean dependency reinstall visibly triggers schema-client generation without a manual extra command.
- The deploy-time startup sequence applies pending migrations non-interactively, never using the interactive/dev-only migration command.
- No file in `backend/src`, `backend/package.json`, or `backend/.env.example` still references the old database connection variable, the old driver package, or the old primary-key field name.
- The server boots without error, and every route family manually spot-checked in this phase returns the same shape confirmed in its originating phase.

## Risks

- The root-level build script's assumption about triggering the backend's own install-time hook turning out to be wrong in practice (e.g. due to how the package manager caches or skips reinstalls) — mitigate with an explicit clean-reinstall dry run in step 3 rather than trusting the mechanism by inspection alone.
- Running out of session time/credentials before live-database verification is possible, leaving some success criteria only partially confirmed — mitigate by being explicit in session notes (per step 7) about exactly which checks were and weren't possible, rather than marking everything done uniformly.
