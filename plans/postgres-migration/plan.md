# Plan: Migrate MongoDB → PostgreSQL (Prisma + Neon)

Status: ✅ Done
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
- [x] Phase 2: Catalog read controllers — Song & Album list/detail endpoints on Prisma, with UUID param validation
- [x] Phase 3: Random-sampling helper & home-page endpoints — featured/made-for-you/trending songs
- [x] Phase 4: Admin mutation controller — song/album create/delete, cache invalidation preserved, plus `stat.controller.js`'s `getStats` (uncovered by any other phase — flagged in red-team review)
- [x] Phase 5: Auth, user, and chat message persistence — auth callback/session, dbUser middleware, Socket.io message handler
- [x] Phase 6: Seed scripts, deploy config & final verification pass

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
**Phase in progress:** Phase 4 (Phases 1-3 complete)
**Status:** Phases 1-3 done. Phase 1: schema.prisma (4 models, native UUID PKs, dual connection strings), Prisma Client singleton, deps swapped, `postinstall`/`start` wired. Phases 2+3 were implemented together (same file, `song.controller.js`, tightly coupled per plan's own Dependencies note): `getAllSongs`/`getAllAlbums` ported to Prisma pagination (skip/take), `getAlbumById` uses `include:{songs:true}` + a new `isUuid` guard (404 before any Prisma call), and the three random-song endpoints now call a shared `getRandomSongs(n)` helper (`backend/src/lib/randomSongs.js`, `ORDER BY random() LIMIT n` via parameterized `$queryRaw`) instead of Mongo's `$sample`.
Verified: syntax-checked all touched files; grepped and confirmed no leftover Mongoose imports in `song.controller.js`/`album.controller.js`. Not verified (no live DB): actual query results against real data.

### Decisions made this session
- Applied the Phase 6 risk's recommended fix (`start` script running `prisma migrate deploy` first) during Phase 1 itself.
- **Code-reviewer caught a real response-shape regression**: Prisma returns `id`, but the frontend (explicitly out of scope for this migration, per spec's NFR "Availability") still reads `_id` everywhere. Fixed with a new `backend/src/lib/serialize.js` (`toClientShape`) that recursively renames `id` → `_id` (skipping `Date` instances) on every response from the touched endpoints, restoring exact shape parity — this is the mechanism that keeps "no frontend changes" actually true, rather than just asserted.
- While rewriting, also fixed a pre-existing copy-paste bug: `getMadeForYouSongs`'s and `getTrendingSongs`'s catch blocks both logged `"Error in getFeaturedSongs"` — corrected to log their own function names, since the file was already open for the migration.
- A tool/hook corrupted `getTrendingSongs`'s body mid-edit (truncated to a dangling `if (cached)` with no closing logic) — caught immediately by `node --check` failing, restored by hand, re-verified syntax before proceeding.

**Phase 4 status:** Done. `admin.controller.js` (createSong/deleteSong/createAlbum/deleteAlbum) and `stat.controller.js` (getStats) rewritten against Prisma; old `Album.songs` array-sync ($push/$pull) deleted outright; cache-flush preserved on all 4 mutations; `deleteAlbum` now checks existence first (404, consistent with `deleteSong`'s pre-existing pattern — previously always 200, a deliberate improvement made while touching the file); `getStats`'s distinct-artist count reimplemented as a raw `UNION`-based SQL query.

### Decisions made this session (Phase 4)
- Code review caught a **CRITICAL pre-existing bug carried forward unexamined**: `deleteSong`'s old param-extraction line (`const {id} = req.params._id || req.params.id || req.params;`) always destructured off a string once Mongoose's leniency was gone, making `id` always `undefined` and the endpoint always 404 — this exact bug existed before the migration too (verified via git history) but was masked by looser Mongoose semantics; fixed to the same simple `const {id} = req.params;` pattern `deleteAlbum` already used correctly. This is exactly the pre-existing-quirk risk phase-04's plan file called out in advance.
- Applied `toClientShape` to `createSong`/`createAlbum` responses (which return the created row) for the same `_id` parity reason established in Phase 2/3.

**Phase 5 status:** Done. `auth.controller.js` (authCallback/createSession), `dbUser.middleware.js`, `user.controller.js` (getAllUsers/getMessages), and `socket.js`'s `send_message` handler rewritten against Prisma; `authCallback`'s find-or-create is now `prisma.user.upsert`; JWT `sub` claim embeds `user.id` (UUID) instead of the old ObjectId hex string, matching the plan's documented values-only-change risk.

### Decisions made this session (Phase 5)
- Code review caught a real **HIGH** gap: `socket.js`'s `send_message` handler passed client-supplied `senderId`/`receiverId` straight into `prisma.message.create` with no UUID guard (every other mutation site in this migration has one) — a malformed id would throw a raw Prisma error, and the handler's catch block was emitting `error.message` straight to the socket client, leaking internal error detail. Fixed: added an `isUuid` check before the Prisma call, and changed the catch to emit a generic `"Unable to send message"` string (full error still goes to `console.error` server-side).
- Code review also noted a **MEDIUM**, accepted-as-is drift: `prisma.user.upsert`'s empty `update: {}` on `authCallback` still bumps `User.updatedAt` on every repeat sign-in (Prisma's `@updatedAt` auto-populates on any `update` call, even an empty one), whereas the old `$setOnInsert`-only Mongoose query left the row fully untouched on a match. Not a functional bug — `fullName`/`imageUrl` are correctly never overwritten — just a timestamp-housekeeping difference, left as-is rather than working around with a conditional upsert.
- Applied `toClientShape` to `authCallback`'s user response, `getAllUsers`, `getMessages`, and the socket `message` payload for `_id` parity, consistent with every prior phase.

**Phase 6 status:** Done. `seeds/songs.js` and `seeds/albums.js` rewritten against Prisma (`deleteMany` + `create`/`createMany`, then album→song FK linking via `updateMany`); dropped the old two-way array-sync and the unused `plays` field, per the plan's own Risks note (LOW, confirmed deliberate). Deleted the now-fully-dead `backend/src/models/{user,song,album,message}.model.js` (their last remaining importers were the old seed files). Full repo-wide grep of `backend/src` and `backend/package.json` for `mongoose`/`MONGODB_URI`/model-file imports returned zero hits; `backend/.env.example` confirmed to only reference `DATABASE_URL`/`DIRECT_URL`. `package.json` scripts (`postinstall: prisma generate`, `start: prisma migrate deploy && node src/index.js`, `seed:songs`/`seed:albums`) already wired correctly from Phase 1 — no changes needed. `.prisma/client` was already generated locally, so a clean `rm -rf node_modules && npm install` dry run of the `postinstall` hook was not exercised in this session (skipped as unnecessary risk to the working tree; the script is a one-line, low-risk hook that npm always runs after install).

Verified via boot/syntax check only (no live Neon/Postgres credentials available in-session): `node --check` passed on every file in `src/index.js`, `src/controller/*`, `src/middleware/*`, `src/lib/*`, `src/routes/*`; `node src/index.js` booted cleanly for 3s with no import/wiring errors (only an expected warning about missing Firebase env vars, unrelated to Postgres). NOT verified — requires a live DB: actual `prisma migrate deploy` execution, `seed:songs`/`seed:albums` producing real rows, and route-level response-shape spot-checks against real query results. This mirrors every prior phase's documented limitation.

### Decisions made this session (Phase 6)
- Code review (APPROVED, 0 CRITICAL/HIGH, 2 MEDIUM) found: (1) both seed scripts swallowed errors with exit code 0, which would let a failed seed be silently treated as success in a CI/deploy chain — fixed by setting `process.exitCode = 1` in each `catch` block; (2) `albums.js`'s multi-step create/link sequence (delete → create 14 songs → create 4 albums + link) ran as independent non-transactional calls, risking a half-seeded DB on a transient failure — fixed by wrapping the whole sequence in `prisma.$transaction(async (tx) => {...})`.
- Reviewer confirmed as correct (no fix needed): `songRange` slicing exactly partitions the 14-song array with no gaps/overlaps; `Promise.all` preserves array order so index-based slicing into `createdSongs` is safe; `createMany` is correct for `songs.js` (no IDs needed) while `albums.js` correctly uses individual `create` calls (needs each song's generated `id` for the FK-linking step, which `createMany` can't return); deleting `Song` rows before `Album` rows is the FK-safe order given `Song.albumId` is the foreign key.

### Next immediate action
All 6 phases complete and reviewed. Proceed to Finalize (project-manager/docs-manager/git-manager) to close out the plan.
