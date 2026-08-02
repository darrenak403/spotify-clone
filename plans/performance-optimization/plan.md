# Plan: Performance Optimization

Status: 🟡 In Progress
Date: 2026-08-03
Mode: Hard

## Overview

Reduce home-page load time and initial bundle size via caching, compression, code-splitting, and auth-init parallelization (Phase 1-2 quick wins), then make list endpoints scale-safe with pagination/indexing and ship a matching frontend "load more" UI plus image/search optimizations (Phase 3-4).

## Sprint Contract

**In Scope:** FR-01 through FR-09, FR-11, FR-12, FR-13, FR-14 (FR-10 dropped per spec — no repeated Clerk lookup exists post-Firebase migration).
**Explicit Exclusions:** Redis/external cache infra (in-memory `node-cache` only, single Render instance assumed); virtualized list rendering (`react-window`); any auth-flow redesign beyond parallelizing existing calls; cursor-based pagination (offset/skip only); re-uploading/reprocessing existing Cloudinary assets (URL-transform insertion only).
**Verification Standard:** All FR-01 through FR-14 (minus dropped FR-10) manually verified per phase (bundle-analyzer output, curl diffs, build output chunk names, timing logs) — no automated test suite exists for this area, so "done" means the manual verification steps in each phase file pass and `npm run build` / server start succeed with no regressions to existing response shapes or auth checks.

## Pre-flight Fix (completed, blocking otherwise)

Red-team review found `backend/src/routes/song.route.js` and `backend/src/routes/stat.route.js` still imported the deleted `../middleware/auth.middleware.js` (leftover from the prior Clerk removal), which crashed the server on startup before any phase's manual verification (which requires a running server hitting `GET /songs` etc.) could be attempted. Fixed by switching both to `verifyFirebaseToken`/`requireFirebaseAdmin` from `../middleware/firebaseAuth.middleware.js` (the same pattern already used in `admin.route.js`). Verified: `node src/index.js` now logs "Server is running on port 5000" instead of crashing on import resolution.

## Phases

- [x] Phase 1: Backend quick wins — in-memory caching for home-page aggregations + gzip compression
- [x] Phase 2: Frontend quick wins — route code-splitting, vendor chunking, parallelized auth-init, bundle analyzer
- [x] Phase 3: Backend scalability — pagination, schema indexes, `.lean()` reads on song/album endpoints
- [x] Phase 4: Frontend list/image/search polish — "load more" UI on admin tables only, Cloudinary transforms + lazy images, client-side debounced search filter, `React.memo`

## Research Summary

Two parallel researchers confirmed the exact current code paths and settled all previously-open decisions:

- **Caching (FR-01):** `node-cache` as a module-level singleton in `song.controller.js`, `stdTTL: 90` / `checkperiod: 120`, wrapping `getFeaturedSongs`/`getMadeForYouSongs`/`getTrendingSongs`. Invalidate via `cache.flushAll()` inside `admin.controller.js` on song/album create/delete — dataset is small enough that flush-all beats per-key invalidation complexity. Known limitation (accepted): per-process cache, not cross-instance safe if Render ever scales horizontally.
- **Compression (FR-02):** `compression()` added in `backend/src/index.js` immediately after `cors()`, before `express.json()`/route registration. No Express 5 compatibility issues.
- **Code splitting (FR-03):** `React.lazy()` per top-level route in `App.tsx` behind one shared `<Suspense>` (reuse the existing `Loader` pattern from `AuthProvider.tsx`). `vite.config.ts` gets `build.rollupOptions.output.manualChunks` splitting `firebase`, `react`/`react-dom` (vendor-react), `@radix-ui/*` (vendor-ui), and `socket.io-client` into separate chunks. Must first verify `frontend/src/lib/firebase.ts` only imports modular subpackages (e.g. `firebase/auth`), not the full `firebase` package.
- **Auth parallelization (FR-05):** Confirmed real sequential chain in `AuthProvider.tsx` is `getIdToken()` → `POST /auth/callback` → `checkAdminStatus()` → `POST /auth/session` → `initSocket()`. Full parallelization is impossible — `checkAdminStatus()` and `POST /auth/session` both need `data.user` from the callback response, and `initSocket` needs both to resolve first. Correct, safe scope: wrap only `checkAdminStatus()` and `axiosInstance.post("/auth/session")` in `Promise.all`, keep `getIdToken` → `/auth/callback` sequential (token must exist before the axios auth header is set), keep `initSocket` after both resolve.
- **Bundle analyzer (FR-06):** `rollup-plugin-visualizer` (not `vite-bundle-visualizer`, a thin wrapper around the same lib) wired into `vite.config.ts` plugins, gated behind a dedicated `analyze` npm script (`gzipSize: true`, `open: true` only in that script).
- **Pagination/indexing/.lean() (FR-07/08/09):** Confirmed zero pagination today — `song.controller.js`'s `getAllSongs` does `Song.find().sort({createdAt:-1})` with no limit; `album.controller.js`'s `getAllAlbums` does bare `Album.find()`; `getAlbumById` does `Album.findById(id).populate("songs")`. Decision: offset/skip (`req.query.limit`/`req.query.skip`), not cursor-based — dataset (~500 docs) doesn't justify cursor complexity, and skip/offset wires more simply into a "Load More" button. Must special-case "no `limit` param → return all" to stay additive per the spec's availability NFR. Indexes to add: `songSchema.index({createdAt:-1})`, `songSchema.index({artist:1})`, `songSchema.index({albumId:1})`, `albumSchema.index({createdAt:-1})`, `albumSchema.index({artist:1})`. Add `.lean()` to `Song.find()`, `Album.find()`, and `Album.findById(id).populate("songs")` — confirmed no downstream code calls Mongoose instance methods/virtuals on these results.
- **Load More UI (FR-14):** Manual "Load More" button + local `page`/`hasMore` state, via a **new, separate** store action (`fetchSongsPage`/`fetchAlbumsPage`) — not `IntersectionObserver` auto-scroll, not a library, and not a repurposing of the existing `fetchSongs`/`fetchAlbums` (red-team finding: those are still used by `LeftSidebar.tsx` for full-list rendering; overloading one action for both patterns would truncate the sidebar). Scoped to `SongTable.tsx`/`AlbumsTable.tsx` only — `SectionGrid.tsx` has no backing paginated endpoint (its `$sample`-based random-draw endpoints were never paginated in Phase 3), so it gets lazy-loading/transforms/memo but no Load More control.
- **Search (FR-12) scope correction:** no backend search endpoint exists or is planned this round (confirmed via grep) — the debounce applies to a client-side filter over already-fetched data, not an API call.
- **Cloudinary transforms (FR-11):** String-insert `f_auto,q_auto/` into the Cloudinary delivery URL path at render time via a small `getOptimizedImageUrl(url)` helper — not a re-upload. Must first verify stored URLs (via `admin.controller.js`'s `uploadToCloudinary` helper) are plain/untransformed, to avoid duplicate/conflicting transform segments.
- **Search debounce (FR-12):** No existing search feature/debounce hook anywhere in `frontend/src` — net new. Build a minimal ~10-line `useDebounce(value, delay)` hook rather than adding `use-debounce`/`lodash` as a dependency.
- **Dropped:** FR-10 (Clerk user-lookup caching) — obsolete; `admin.controller.js`'s `checkAdmin` now trusts the already-verified `admin` custom claim from `requireFirebaseAdmin` middleware, no repeated external call exists.
- **Confirmed stack:** Express 5, Vite 6, React 19, `firebase` 12. None of `compression`, `node-cache`, `rollup-plugin-visualizer` are currently installed in either `package.json`.

## Dependencies

- New backend packages: `node-cache`, `compression`.
- New frontend dev dependency: `rollup-plugin-visualizer`.
- No external services required (Redis explicitly out of scope/unavailable).
- Phase 4 depends on Phase 3 shipping first (frontend "load more" UI consumes the `limit`/`skip` params added in Phase 3).
- Phase 2's bundle-analyzer verification depends on Phase 2's own code-splitting changes being in place first (sequential within the phase, not a cross-phase dependency).

## Risks

- HIGH: Cache invalidation missed on some song/album mutation path in `admin.controller.js`, leaving stale featured/trending/made-for-you data after edits — mitigate by grepping all create/update/delete handlers in that controller before wiring `cache.flushAll()`, not just the obvious create/delete ones.
- HIGH: Pagination change breaks an existing frontend caller that doesn't send `limit`/`skip` and expects a full array — mitigate with the "no `limit` param → return all" special case and manual curl verification against every existing consumer before touching frontend code in Phase 4.
- MEDIUM: `manualChunks` vendor splitting introduces a circular-dependency or duplicate-module issue that only surfaces at runtime (blank page) rather than build time — mitigate by running the app after the build (not just checking build output) before considering Phase 2 done.
- MEDIUM: `.lean()` addition unexpectedly breaks a call site that does rely on a Mongoose document method/virtual not caught by the researcher's grep — mitigate by re-grepping usages of the affected query results in the same PR before merging.
- LOW: node-cache staleness (up to 90s) shows outdated featured/trending songs immediately after an admin edit until flush — acceptable per spec NFR, no mitigation needed beyond documenting it.
- LOW: `rollup-plugin-visualizer`'s `open: true` behavior differs in CI/headless environments — mitigate by only running the `analyze` script locally, never in CI.
- LOW (accepted, no mitigation needed): offset/skip pagination can duplicate or skip an item across page fetches if a song/album is created/deleted concurrently — acceptable tradeoff at ~500 docs / low write concurrency, documented rather than engineered around (cursor pagination was explicitly rejected for this reason in the Research Summary).

## Session Notes
<!-- Updated by cook automatically — do not edit manually -->

**Last active:** 2026-08-03 03:00
**Phase in progress:** none — all 4 phases complete
**Status:** All phases (1-4) complete, reviewed, and committed.

### Decisions made this session
- Phase 1: `node-cache` singleton (`homeQueryCache`, `stdTTL: 90`) exported from `song.controller.js`, imported by `admin.controller.js` for `.flushAll()` on all 4 existing mutation routes (createSong/deleteSong/createAlbum/deleteAlbum — confirmed these are the only write routes).
- `getAllSongs` deliberately left untouched in Phase 1 — pagination/`.lean()` is Phase 3's scope, not bundled in early.
- `compression()` added right after `cors()`, before `express.json()`.
- code-reviewer found one pre-existing (not introduced by this phase) HIGH bug adjacent to the new code: `deleteSong` dereferenced `song.albumId` without a null check when `id` doesn't match any document. Fixed with a 404 guard while in the function.
- Manual DB-backed endpoint verification (curl diff, cache timing) not possible in this session — no real MongoDB URI available (same permission boundary as the Firebase migration). Verified instead via: server boots cleanly (`node src/index.js` → "Server is running on port 5000"), `node --check` syntax pass on all 3 touched files, and static code-reviewer pass (WARNING → fixed → clean).
- Phase 2: `App.tsx` routes converted to `React.lazy()`; `vite.config.ts` given `manualChunks` (firebase, vendor-react, vendor-ui, socket-io) plus an `ANALYZE`-gated `rollup-plugin-visualizer`; `AuthProvider.tsx`'s `checkAdminStatus()` and `POST /auth/session` wrapped in `Promise.all` (confirmed independent — neither reads the other's response, both only need the already-resolved ID token/`/auth/callback` result).
- code-reviewer found one HIGH UX regression introduced by this phase: a single top-level `<Suspense>` wrapping the whole `<Routes>` tree unmounted `MainLayout` (sidebar/topbar) on every navigation between lazy routes nested under it, since Suspense replaces its entire subtree including already-mounted parents. Fixed by moving the `<Suspense>` boundary to wrap only `<Outlet/>` inside `MainLayout.tsx` (new `PageLoader` fallback, layout persists across nested route changes) and giving `/admin` its own separate `<Suspense>` in `App.tsx` (no shared layout to preserve there).
- Verified via `npx tsc -b && npx vite build` (unchanged correct per-route/per-vendor chunk output) and `ANALYZE=true npx vite build` (confirms `dist/stats.html` generation). Functional in-browser navigation/auth end-to-end test not possible in this session (same missing-real-credentials permission boundary as Phase 1's DB verification).

- Phase 3: added the 5 planned indexes (`song.model.js` x3, `album.model.js` x2); `getAllSongs`/`getAllAlbums` given `parseInt`-parsed, `Number.isInteger`-validated `limit`/`skip` with a `Math.min(limit,100)` clamp, applied only when a valid `limit` is present (absent/invalid → unchanged full-list behavior, matching the additive requirement); `.lean()` added to `getAllSongs`, `getAllAlbums`, and `getAlbumById`'s `populate("songs")` query.
- code-reviewer found one HIGH bug: `limit=0` satisfied `Number.isInteger(limit) && limit >= 0` and reached `.limit(0)`, which Mongoose/MongoDB treat as "no limit" (not "zero results") — silently returning the full unbounded collection on the public, unauthenticated `/albums` endpoint, defeating the DoS-prevention requirement this phase exists for. Fixed by requiring `limit > 0` to enter the paginated branch; `limit=0` (and negative) now correctly falls through to the existing full-list behavior instead of bypassing the clamp.
- Confirmed via code-reviewer: `getAllSongs` is already admin-gated (`verifyFirebaseToken`/`requireFirebaseAdmin` in `song.route.js`) — the plan's "public, unauthenticated" risk note applies accurately to the album endpoints only; clamping `getAllSongs` too is harmless defense-in-depth. `.lean()` confirmed safe via grep — no instance methods/virtuals/`.save()` called on results from these three queries anywhere in the codebase.
- DB-level verification (curl diffs, confirming indexes registered via `db.songs.getIndexes()`) not possible this session — no real MongoDB URI available (same permission boundary noted in every phase so far). Verified instead via: `node --check` syntax pass on all 4 touched files, server boot (`node src/index.js` → "Server is running on port 5000", only the expected Mongo-URI-missing error follows), and static code-reviewer pass (WARNING → fixed → clean).

- Phase 4: added new `paginatedSongs`/`paginatedAlbums` state + `fetchSongsPage`/`fetchAlbumsPage` actions to `useMusicStore.ts` (separate from the existing full-list `fetchSongs`/`fetchAlbums`, which stay untouched for `LeftSidebar.tsx`); `SongTable.tsx`/`AlbumsTable.tsx` rewritten to self-fetch their own first page, show a "Load More" button, and filter client-side via a new `useDebounce` hook (300ms, no backend search endpoint); new `getOptimizedImageUrl.ts` helper inserts `f_auto,q_auto/` into Cloudinary URLs, applied with `loading="lazy"` across `LeftSidebar.tsx`/`SectionGrid.tsx`/`AlbumPage.tsx`/`PlaybackControls.tsx`/`SongTable.tsx`/`AlbumsTable.tsx`; `SectionGrid.tsx`/`SongTable.tsx`/`AlbumsTable.tsx` wrapped in `React.memo`.
- code-reviewer found one HIGH regression: removing `AdminPage.tsx`'s mount-time `fetchAlbums()`/`fetchSongs()` calls (done on the assumption nothing else needed them) silently broke `AddSongDialog.tsx`'s album-picker dropdown, which reads the plain `albums` field that only `AdminPage`'s mount effect (or `LeftSidebar.tsx`, not reliably mounted in the admin flow) ever populated. Fixed by restoring `fetchAlbums()` in `AdminPage.tsx` (confirmed via grep that nothing else needs the full `songs` list, so that one stays removed) — the full-list `fetchAlbums` and the new paginated `fetchAlbumsPage` coexist safely since they write to different store fields.
- Verified via `npx tsc -b` (clean) and `npx vite build` (clean, chunk sizes essentially unchanged). Full in-browser manual verification (Load More network calls, image lazy-loading inspection, search debounce timing, React DevTools profiling) not possible this session — same missing-real-credentials/no-live-DB permission boundary noted in every phase.

### Next immediate action
All 4 phases complete. Remaining: `ck:cook` Step 5 Finalize (project-manager status sync, docs-manager doc check, git-manager final confirmation) — per-phase commits already cover the actual code changes.
