# Spec: Migrate MongoDB → PostgreSQL

**Date:** 2026-08-03
**Status:** Ready

---

## Problem Statement

The backend currently uses MongoDB/Mongoose, which complicates deploying the app to third-party hosting (Vercel/Render) with a managed, connection-pooled, easily provisioned database. Moving to PostgreSQL (via Neon, a serverless Postgres provider with built-in connection pooling) and Prisma (ORM) makes deployment to either host straightforward, at the cost of rewriting the entire data layer: models, controllers, and Mongo-specific query patterns (`.lean()`, `populate()`, `$sample` aggregation, `ObjectId` refs).

---

## User Stories

<!-- P1 = MVP (must ship), P2 = nice-to-have, P3 = future/out-of-scope -->

- **[P1]** As a developer, I want the backend to run entirely on PostgreSQL (via Prisma) with no remaining Mongoose/MongoDB dependency, so that the app can be deployed to Neon + Vercel/Render without a Mongo hosting dependency.
  Accepted when: `mongoose` is removed from `backend/package.json`, all 4 models (`User`, `Song`, `Album`, `Message`) exist as Prisma schema models, and the app boots and serves all existing routes against a Postgres database.

- **[P1]** As a developer, I want the Song↔Album relationship simplified to a clean one-to-many (`Song.albumId` FK), so that there's no redundant two-way reference to keep in sync (unlike the current Mongoose `Album.songs` array + `Song.albumId`).
  Accepted when: `Album.songs` is a derived Prisma relation (no stored array column); `Song.albumId` is the sole FK, nullable (a song may have no album).

- **[P1]** As a user, I want song/album list pagination (`limit`/`skip`, added in the prior performance-optimization phase) to keep working identically after the migration, so that there's no functional regression.
  Accepted when: `GET /songs` and `GET /albums` accept the same `limit`/`skip` query params, return the same response shape, and enforce the same `limit > 0` / max-100 clamp already in place.

- **[P1]** As a user, I want the random song endpoints (`getFeaturedSongs`, `getMadeForYouSongs`, `getTrendingSongs`) to keep working correctly after the migration, so that the home page still shows randomized results.
  Accepted when: random selection uses a plain `ORDER BY random() LIMIT n` raw query (via Prisma `$queryRaw`) — resolved during plan validation in favor of this simpler, unbiased approach over the originally-considered indexed `randomSortKey` technique, which was found to have a real sampling bias and to be overengineered at this app's current scale (~500 songs).

- **[P2]** As a developer, I want the seed scripts (`seed:songs`, `seed:albums`) rewritten against Prisma, so that a fresh Postgres database can be populated without needing to migrate real Mongo data.
  Accepted when: `npm run seed:songs` and `npm run seed:albums` insert rows via Prisma into a fresh Postgres DB and the app displays them correctly.

- **[P2]** As a developer, I want `.env.example` and setup docs updated to reflect `DATABASE_URL` (Neon connection string, pooled + direct variants for Prisma migrate) instead of `MONGODB_URI`, so that setup instructions stay accurate.
  Accepted when: `backend/.env.example` has `DATABASE_URL`/`DIRECT_URL` in place of `MONGODB_URI`, with inline comments explaining Neon's pooled vs. direct connection strings.

- **[P3]** _(out of scope)_ Migrating real production data from MongoDB into PostgreSQL — this migration starts from a fresh, empty database (reseeded), not a data transform of existing records.
- **[P3]** _(out of scope)_ Resolving the Socket.io / serverless hosting mismatch for chat — noted as a risk in the brainstorm, but unrelated to the database engine choice and not addressed by this migration.

---

## Functional Requirements

1. FR-01: Add Prisma (`prisma`, `@prisma/client`) to `backend`; define `schema.prisma` with 4 models: `User`, `Song`, `Album`, `Message`.
2. FR-02: `User` model: `id` (UUID, PK), `fullName`, `imageUrl` (default `""`), `firebaseUid` (unique, nullable), `createdAt`/`updatedAt`. Drop `legacyClerkId` entirely (not carried over from Mongoose schema).
3. FR-03: `Song` model: `id` (UUID, PK), `title`, `artist`, `imageUrl`, `audioUrl`, `duration` (Int, seconds), `albumId` (nullable FK → `Album.id`), `randomSortKey` (Float, indexed, default `random()`), `createdAt`/`updatedAt`. Indexes: `createdAt`, `artist`, `albumId`, `randomSortKey`.
4. FR-04: `Album` model: `id` (UUID, PK), `title`, `artist`, `imageUrl`, `releaseYear` (Int), `createdAt`/`updatedAt`. Indexes: `createdAt`, `artist`. `songs` is a Prisma relation field (no stored array).
5. FR-05: `Message` model: `id` (UUID, PK), `senderId` (FK → `User.id`), `receiverId` (FK → `User.id`), `content`, `createdAt`/`updatedAt`.
6. FR-06: Rewrite `song.controller.js` (`getAllSongs`, `getFeaturedSongs`, `getMadeForYouSongs`, `getTrendingSongs`) using Prisma Client — preserve existing pagination clamp logic (`limit > 0`, `Math.min(limit, 100)`) and response shapes.
7. FR-07: Rewrite `album.controller.js` (`getAllAlbums`, `getAlbumById`) using Prisma Client — `getAlbumById` uses Prisma's `include: { songs: true }` in place of `populate("songs")`.
8. FR-08: Rewrite `user.controller.js`/`admin.controller.js` Mongoose queries (User lookups by `firebaseUid`) using Prisma Client.
9. FR-09: Rewrite chat message persistence (wherever `Message` model is queried/created — Socket.io handlers + any REST route) using Prisma Client.
10. FR-10: Implement the `ORDER BY random() LIMIT n` random-sampling query as a shared helper used by all 3 random-song controller functions, using the database client's parameterized raw-query mechanism (never string-interpolated SQL).
11. FR-11: Rewrite `backend/src/seeds/songs.js` and `backend/src/seeds/albums.js` to insert via Prisma instead of `mongoose.connect()` + `.save()`.
12. FR-12: Remove `mongoose` from `backend/package.json` dependencies; add `prisma`, `@prisma/client`. Remove `backend/src/lib/db.js` (Mongoose connection) — replace with Prisma Client singleton (`backend/src/lib/prisma.js`).
13. FR-13: Update `backend/.env.example`: replace `MONGODB_URI` with `DATABASE_URL` (Neon pooled connection string) and `DIRECT_URL` (Neon direct connection string, required by `prisma migrate`).
14. FR-14: Add `postinstall`/`build` step running `prisma generate` (and `prisma migrate deploy` for production boot) so schema/client stay in sync on fresh installs and deploys.

---

## Non-Functional Requirements

- Performance: Random-song queries use `ORDER BY random() LIMIT n` — acceptable full-table-scan cost at the current ~500 songs/albums scale; revisit with an indexed sampling technique only if the dataset grows into the tens of thousands of rows.
- Security: No change to auth/authorization behavior — `requireFirebaseAuth`/`requireFirebaseAdmin` middleware and Firebase token verification are unaffected by the DB swap; only the `User` lookup underneath changes from Mongoose to Prisma.
- Availability: API response shapes for all existing routes (`/songs`, `/albums`, `/users`, chat) must remain unchanged, so the already-shipped frontend (Phase 1-4 performance work) requires no changes to consume the migrated backend.

---

## Success Criteria

- [ ] `backend/package.json` no longer lists `mongoose` as a dependency.
- [ ] `npx prisma migrate dev` (or `deploy`) succeeds against a fresh Neon database, creating all 4 tables with the specified indexes.
- [ ] `npm run seed:songs && npm run seed:albums` populates a fresh Postgres DB and the frontend renders the seeded songs/albums correctly (manual check).
- [ ] All existing REST endpoints (`/songs`, `/albums`, `/users`, `/stats`, chat message send/receive) return identical response shapes to the pre-migration Mongo version (manual diff or spot-check).
- [ ] Random-song endpoints (`getFeaturedSongs`/`getMadeForYouSongs`/`getTrendingSongs`) never return fewer than the requested count unless the table itself has fewer rows (verified with a small seeded dataset).
- [ ] `backend/.env.example` reflects `DATABASE_URL`/`DIRECT_URL`, no `MONGODB_URI` reference remains anywhere in backend source.

---

## Out of Scope

- Migrating real production data from MongoDB to PostgreSQL (this project starts from a fresh, reseeded database).
- Resolving the Socket.io/serverless hosting compatibility question for Vercel deployment — unrelated to the database engine.
- Changing the frontend in any way — this is a backend-only, response-shape-preserving migration.
- Multi-album songs (many-to-many) — explicitly decided against; one-to-many via `Song.albumId` is sufficient.

---

## Assumptions

- No real production data currently needs preserving — if this assumption is wrong (there is real user data on the current Mongo deployment that must be kept), this spec's "fresh reseed" approach must be revisited before planning proceeds.
- Neon's free tier and connection pooling are sufficient for current and near-term scale (~500 songs/albums, low concurrent user count) — if traffic/scale expectations are much higher, provider choice should be revisited.
- Existing frontend performance-optimization work (Phases 1-4, already shipped) is unaffected since API response shapes are preserved — no frontend changes anticipated.
