# Brainstorm: Migrate MongoDB → PostgreSQL

**Date:** 2026-08-03

## Ideas Explored

- **Provider**: Neon (serverless Postgres, built-in pooling, stable free tier) vs. Supabase (adds auth/storage, overkill here) vs. Render Postgres (free tier expires after 90 days). → **Neon chosen** — best fit for connection-pooled access from both Vercel-style serverless and Render-style long-running processes.
- **ORM**: Prisma (type-safe, migrate CLI replaces Mongoose autoIndex, easy docs) vs. Drizzle (lighter, more serverless-friendly, but more raw-SQL-adjacent). → **Prisma chosen** — team has no raw-SQL background, Prisma's guided migration workflow fits better right now.
- **Album↔Song relation**: keep Mongo's redundant two-way ref (Album.songs array + Song.albumId) vs. collapse to a clean one-to-many FK. → **One-to-many via `Song.albumId` FK only** — Album.songs becomes a derived Prisma relation, no stored array, no data duplication.
- **Random song selection** (`$sample` aggregation used by `getFeaturedSongs`/`getMadeForYouSongs`/`getTrendingSongs`): plain `ORDER BY random() LIMIT n` (simple, but full-table-scan cost grows with data) vs. an indexed random-key technique. → **Indexed random-key technique chosen** (user explicitly wants scale-readiness): add a `randomSortKey` (float, indexed) column per row; query `WHERE randomSortKey > random() ORDER BY randomSortKey LIMIT n` (wrap-around fallback if fewer rows returned than requested) — avoids full-table scan as data grows, unlike naive `ORDER BY random()`.
- **User identity**: keep Mongo's internal `_id` as the join key for `Message.senderId`/`receiverId` (current Mongo design) vs. join directly on `firebaseUid`. → Keep the internal-id pattern: Postgres `User.id` (UUID, generated) stays the FK target for messages; `firebaseUid` remains a separate unique lookup column. Matches current Mongo design, no behavior change.
- **Legacy Clerk field** (`User.legacyClerkId`, dead weight from the earlier Clerk→Firebase migration): keep for historical reference vs. drop entirely. → **Dropped** — this is a from-scratch DB (no real data migrated), so there's no Clerk history to preserve.
- **Data migration**: migrate real Mongo data into Postgres vs. start fresh and reseed. → **Start fresh** — reseed via rewritten `seed:songs`/`seed:albums` scripts targeting Prisma/Postgres. No Mongo→Postgres data transform needed.

## User's Direction

User wants Postgres primarily for easier third-party deployment (works comfortably on both Vercel and Render), delegated provider/ORM choice ("dùng cái nào phù hợp là được"), and explicitly asked for the random-song-selection design to be scale-ready rather than the simplest possible approach — the one point where they pushed back against the "just do it simply" default.

## Open Questions

- Exact Prisma schema types for `Song.duration` (currently Mongoose `Number`, likely seconds) — confirm `Int` vs `Float` at plan time.
- Confirm connection-pooling setup details (Prisma + Neon `-pooler` connection string, `directUrl` for migrations) — a deployment-specific detail /ck:plan should pin down, not left ambiguous in code.
- `.env.example` needs a new `DATABASE_URL` (+ possibly `DATABASE_URL_UNPOOLED`/`directUrl` for Prisma migrate) replacing `MONGODB_URI` — plan should cover updating docs/`.env.example` alongside code.
- Existing Mongoose-specific code to retire: `.lean()` reads, `mongoose.Schema.Types.ObjectId` refs, `populate("songs")` calls, the `songSchema.index`/`albumSchema.index` declarations added in the prior performance-optimization phase (Phase 3) — these become Prisma `@@index` declarations instead; plan should explicitly account for this as a full backend rewrite, not an additive change.

## Risks

- **Full backend rewrite scope**: every model, controller, and query touching Song/Album/User/Message needs rewriting (not just a driver swap) — high risk of scope creep or missed call sites if not enumerated file-by-file in the plan.
- **Socket.io + serverless mismatch (noted, out of scope for this migration)**: the chat feature uses Socket.io, which needs a persistent connection — this doesn't play well with Vercel's serverless function model regardless of DB choice. Not a blocker for the Postgres migration itself, but flagged so it isn't mistaken as "solved" by this change if Vercel deployment is attempted later.
- **Random-sort-key technique correctness**: the wrap-around/fallback logic (when fewer rows exist than requested, or all remaining `randomSortKey` values are below the random threshold) must be handled carefully or `getFeaturedSongs`-style queries can silently return fewer results than expected — needs an explicit test case in the plan.
