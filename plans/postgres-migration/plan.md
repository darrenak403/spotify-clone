# Plan: Migrate MongoDB → PostgreSQL (Prisma + Neon)

Status: 🟡 In Progress
Date: 2026-08-03
Mode: Hard

## Overview

Replace the Mongoose/MongoDB data layer with Prisma Client against a Neon-hosted PostgreSQL database — new schema, rewritten controllers/seeds, and deploy config — while keeping every existing route's request/response shape unchanged for the already-shipped frontend.

## Sprint Contract

**In Scope:** FR-01 through FR-14 (all functional requirements in spec.md) — Prisma schema for all 4 models, singleton Prisma client, full controller rewrite (song, album, user, admin, auth, chat/socket, stats), seed script rewrite, `.env.example` update, `postinstall`/`migrate deploy` wiring for CI/deploy.

**Explicit Exclusions:**
- Migrating real production data out of MongoDB (fresh, reseeded database only — no data-transform/export step).
- Resolving the Socket.io/serverless-hosting compatibility question — unrelated to the DB engine swap.
- Any frontend change of any kind — this is response-shape-preserving by contract.
- Many-to-many song/album relationships — one-to-many via `Song.albumId` only, as already decided in the spec.

**Verification Standard:** No automated test suite exists in this repo (consistent with the prior performance-optimization plan) — "done" means: `node src/index.js` boots cleanly against a real or locally-reachable Postgres/Neon URL with no Mongoose import errors anywhere in `backend/src`; `npx prisma migrate dev`/`deploy` succeeds and creates all 4 tables with the specified indexes; `npm run seed:songs && npm run seed:albums` populates a fresh DB without error; every route in the Functional Requirements list is manually curl-checked (or checked via the frontend, where a live DB is available) to return the same shape as the pre-migration version; `mongoose` is absent from `backend/package.json`.

## Phases

- [x] Phase 1: Prisma schema & connection foundation — schema.prisma, Prisma Client singleton, package.json deps
- [ ] Phase 2: Catalog read controllers — Song & Album list/detail endpoints on Prisma, with UUID param validation
- [ ] Phase 3: Random-sampling helper & home-page endpoints — featured/made-for-you/trending songs
- [ ] Phase 4: Admin mutation controller — song/album create/delete, cache invalidation preserved, plus `stat.controller.js`'s `getStats` (uncovered by any other phase — flagged in red-team review)
- [ ] Phase 5: Auth, user, and chat message persistence — auth callback/session, dbUser middleware, Socket.io message handler
- [ ] Phase 6: Seed scripts, deploy config & final verification pass

## Research Summary

Two parallel researchers confirmed the concrete implementation pattern and flagged one open decision:

- **Neon + Prisma connection setup:** `schema.prisma`'s `datasource db` block needs both `url = env("DATABASE_URL")` (Neon's pooled, `-pooler` host — used at runtime by the app) and `directUrl = env("DIRECT_URL")` (Neon's direct/unpooled host — required by `prisma migrate dev`/`deploy`, which otherwise fails with cryptic Postgres advisory-lock errors against a pooled connection). Both must be wired into `backend/.env.example` and real `.env`.
- **Schema shape confirmed workable:** UUID `@id @default(uuid())` primary keys on all 4 models; `Song.albumId` is a nullable FK (`albumId String?` + `album Album? @relation(...)`) — no required album; `Album.songs` is a derived/bidirectional Prisma relation field, not a stored array (removing the current Mongoose two-way-sync bug class entirely); indexes on `createdAt`/`artist`/`albumId` per FR-03/FR-04.
- **`.lean()`/`populate()` migrate for free:** Prisma always returns plain objects (no `.lean()` equivalent needed), and `Album.findById(id).populate("songs")` becomes `prisma.album.findUnique({ where: { id }, include: { songs: true } })`.
- **Prisma Client singleton required:** a per-request `new PrismaClient()` exhausts Neon's connection limit under load. `backend/src/lib/prisma.js` must export a single module-level instance (replacing `backend/src/lib/db.js`), imported everywhere a Mongoose model import currently exists. Combined with using the pooled `DATABASE_URL` at runtime, this fully covers the Neon connection-limit risk — no additional task needed beyond building the singleton correctly.
- **Build/deploy wiring:** `prisma generate` must run on every fresh `npm install` — add `"postinstall": "prisma generate"` to `backend/package.json` specifically (not the root `package.json`), because the root build script (`npm install --prefix backend && ...`) already triggers backend's own `npm install`, which fires this hook. Schema migrations in CI/production must use `prisma migrate deploy` (non-interactive), never `prisma migrate dev` (interactive, hangs in CI).
- **UUID param validation gap:** Prisma throws a raw `PrismaClientValidationError` (ugly, unhandled 500) when a route param like `:albumId` isn't a well-formed UUID and gets passed straight into a `where: { id: ... }` clause — unlike Mongoose, which silently no-ops or returns null on a malformed ObjectId. A validation guard must run before any such Prisma call; `album.controller.js`'s `getAlbumById` is the first concrete call site, but the same pattern must be checked for other `:id`-style params.
- **User PK swap is lower-risk than typical:** grepped this repo already — no code depends on the User `_id` having Mongo's specific ObjectId format. `backend/src/lib/socket.js`'s auth uses the Firebase UID string as the lookup/session-signing key, not the Mongo `_id`, so switching `User.id` to a UUID string is a mechanical `._id` → `.id` rename at call sites, not a logic change.
- **Random sampling technique — resolved during plan validation:** the spec (FR-03/FR-10) originally specified an indexed `randomSortKey` column with a `WHERE randomSortKey > random() ORDER BY randomSortKey LIMIT n` query plus a wrap-around fallback for under-filled results. A second researcher pass flagged that this technique has a *known statistical bias* (rows near the wrap point get oversampled) and, at this repo's actual scale (~500 songs, confirmed via `backend/src/seeds/albums.js`), is overengineered relative to the alternative. **User confirmed during plan validation: use the plain `ORDER BY random() LIMIT n` raw query instead** (via `$queryRaw`, since Prisma Client has zero native `random()` support either way) — no `randomSortKey` column, index, or wrap-around logic. This overrides the spec's literal FR-03/FR-10 wording; Phase 3 implements this resolved decision directly, no confirmation step needed during `/ck:cook`.
- **Message model / chat rewrite:** `Message` create/query call sites are `backend/src/lib/socket.js`'s `send_message` handler (`Message.create(...)`) and `backend/src/controller/user.controller.js`'s `getMessages` (`Message.find({ $or: [...] })`) — both need Prisma rewrites; the `$or` query becomes a Prisma `OR: [...]` filter.

## Dependencies

- A reachable Neon Postgres project (pooled + direct connection strings) is required to run `prisma migrate dev/deploy` and to manually verify any phase beyond static/boot checks — same permission boundary noted throughout the prior performance-optimization plan (no live DB credentials available in-session); phases must document what was and wasn't verifiable without one.
- Phase 2 depends on Phase 1's schema and singleton client existing.
- Phase 3 depends on Phase 2's Song model/controller patterns being in place (shares the same controller file, `song.controller.js`).
- Phase 4 depends on Phase 2/3's Song/Album Prisma patterns (mutation logic touches the same models).
- Phase 6's seed scripts depend on Phase 1's schema being finalized and migrated.
- Phase 6's final verification depends on all prior phases being complete.

## Risks

- HIGH: A route param (`:albumId`, `:id`, `:userId`, etc.) reaches a Prisma `where: { id: ... }` clause without UUID-format validation first, turning a clean 404/400 into an unhandled 500 — mitigate by grepping every controller for `req.params` usage feeding a Prisma `where` clause during Phase 2, not just the known `getAlbumById` site, and adding a shared validation guard.
- MEDIUM: `backend/package.json`'s `postinstall` hook is added but the root `package.json`'s build script is not re-verified to actually trigger it (e.g. if `npm install --prefix backend` behavior changes or is refactored) — mitigate with an explicit local `rm -rf backend/node_modules && npm install --prefix backend` dry run in Phase 6 to confirm `prisma generate` fires.
- MEDIUM: No live Neon/Postgres credentials available in-session for full DB-backed verification (mirrors every phase's limitation in the prior performance-optimization plan) — mitigate by clearly separating "verified via boot/syntax/static check" from "requires live DB, deferred to a session with credentials" in each phase's success criteria, exactly as the prior plan's Session Notes did.
- LOW: Seed script rewrite (`songs.js`/`albums.js`) silently drops the `plays` field present in the current Mongoose album seed data — acceptable since `plays` isn't part of any spec'd model (FR-03 doesn't list it); confirm during Phase 6 this was a deliberate drop, not an oversight.
- LOW: `SESSION_JWT_SECRET`-signed token in `auth.controller.js`'s `createSession` embeds `user._id.toString()` under the `sub` claim — after the PK swap this becomes a UUID string instead of an ObjectId hex string; no consumer currently parses the format of `sub` (confirmed via `socket.js`), so this is a values-only change, not a logic change, but worth a final grep in Phase 6.
- NOTED (red-team review): Phase 6's "wire `migrate deploy` before server start" step has no concrete in-repo target named — this repo has no `Procfile`/`render.yaml`/`vercel.json`, so the live deployment's start command may be configured entirely outside the repo (in a platform dashboard), which can't be verified or edited during `/ck:cook`. Recommended concrete fix for Phase 6 to apply: change `backend/package.json`'s `start` script from `"node src/index.js"` to `"prisma migrate deploy && node src/index.js"` so the migration-apply step is guaranteed to run before boot regardless of platform, and note in Phase 6's session notes if the actually-deployed platform's start command lives outside the repo and needs a manual, out-of-band update to match.

## Session Notes
<!-- Updated by cook automatically — do not edit manually -->

**Last active:** 2026-08-03 (cook liên tục, continuous run)
**Phase in progress:** Phase 2 (Phase 1 complete)
**Status:** Phase 1 done — schema.prisma authored (4 models, native UUID PKs, dual connection strings), `backend/src/lib/prisma.js` singleton created, `backend/src/lib/db.js` removed, `mongoose`/`mongodb` dropped from `backend/package.json`, `prisma`/`@prisma/client` added with `postinstall: prisma generate` and `start: prisma migrate deploy && node src/index.js` (applies the red-team-recommended fix directly instead of deferring it to Phase 6). Verified: `npm install` runs `prisma generate` cleanly; `npx prisma validate` passes with placeholder connection strings. Not verified (no live Neon credentials in-session): `prisma migrate dev/deploy` actually creating tables — deferred to a session with real credentials, per plan Risk "MEDIUM: no live credentials."

### Decisions made this session
- Applied the Phase 6 risk's recommended fix (`start` script running `prisma migrate deploy` first) during Phase 1 itself, since the `start` script already needed editing here — avoids a second pass over the same file in Phase 6.
- Boot smoke test after Phase 1 still fails (`ERR_MODULE_NOT_FOUND: mongoose` from `message.model.js` via `socket.js`) — expected and not a Phase 1 defect; the remaining Mongoose model imports are removed phase-by-phase as each controller is rewritten (Phase 5 covers `socket.js`/`message.model.js`). Full clean boot is Phase 6's success criterion.

### Next immediate action
Phase 2: rewrite `song.controller.js`'s `getAllSongs` and `album.controller.js`'s `getAllAlbums`/`getAlbumById` against Prisma, add UUID-format validation guard before ID-based lookups.
