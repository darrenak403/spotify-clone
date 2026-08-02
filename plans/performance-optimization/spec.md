# Spec: Performance Optimization

**Date:** 2026-08-02
**Status:** Ready

---

## Problem Statement

The app (Vite + React 19 frontend, Express + Mongoose/MongoDB backend) currently has poor perceived performance: slow home-page load (3 uncached `$sample` aggregations per visit), a single unsplit frontend bundle, unoptimized images, and a sequential auth-init sequence blocking first paint. There is currently no pagination or indexing on list endpoints, and no measurement tooling (Lighthouse, bundle analyzer, slow-query logging) exists to quantify the problem or verify fixes.

---

## User Stories

<!-- P1 = MVP (must ship), P2 = nice-to-have, P3 = future/out-of-scope -->

- **[P1]** As a user, I want the home page to load and become interactive quickly, so that browsing doesn't feel sluggish.
  Accepted when: home-page aggregation queries are cached (not re-run on every visit) and measured response time is reduced vs. baseline.

- **[P1]** As a user, I want the app's initial page load to be fast, so that I'm not staring at a blank/loading screen.
  Accepted when: route-level code splitting is in place, auth-init calls (`getToken`, `checkAdminStatus`, socket init) run in parallel instead of sequentially, and measured bundle size for the initial chunk drops.

- **[P1]** As a user, I want images (album art, avatars) to load without stalling the page, so that scrolling/browsing feels smooth.
  Accepted when: images use `loading="lazy"` and are served at an appropriately sized resolution via Cloudinary transforms.

- **[P2]** As a developer, I want basic performance measurement in place (bundle analyzer, Lighthouse, slow-query logging), so that before/after improvements are verifiable rather than assumed.
  Accepted when: a bundle-analyzer report and a Lighthouse run (or equivalent) can be produced on demand, and slow Mongo queries are logged.

- **[P2]** As the system, I want song/album list endpoints to support pagination and use indexed, `.lean()` queries, so that response time stays flat as the dataset grows beyond its current small size (~500 songs/albums).
  Accepted when: `GET` list endpoints accept `limit`/`skip` (or cursor) params, Mongoose schemas have indexes on fields used in `sort`/`$match` (`createdAt`, `artist`, `albumId`), and reads use `.lean()`.

- **[P2]** As a user, I want images served in an optimal format/quality automatically, so that image payload is minimal without visible quality loss.
  Accepted when: Cloudinary image URLs include `f_auto,q_auto` transform params (or equivalent upload preset), on top of the existing lazy-load change.

- **[P2]** As a user, I want the search input to not spam the API on every keystroke, so that typing feels responsive and the backend isn't overloaded.
  Accepted when: search input is debounced (e.g. 300ms) before triggering the API call.

- **[P2]** As a user, I want song/album list rendering to avoid unnecessary re-renders, so that the UI stays smooth as the store updates.
  Accepted when: `SectionGrid.tsx`, `SongTable.tsx`, `AlbumsTable.tsx` (or their row sub-components) are wrapped in `React.memo` where profiling shows repeat re-renders.

- **[P2]** As a user, I want song/album lists to load more items as I scroll instead of loading everything upfront, so that the initial list render is fast even as the dataset grows.
  Accepted when: song/album list UI ("load more" or infinite scroll, not virtualized) consumes the Phase 2 `limit`/`skip` endpoints.

- **[P3]** _(out of scope for this round)_ Full virtualized rendering (e.g. `react-window`) for song and album lists — infinite scroll ships this round, but windowed rendering is deferred.
- **[P3]** _(out of scope for this round)_ Custom audio Range-request handling — confirmed unnecessary: audio is delivered via Cloudinary CDN, which supports HTTP Range/206 Partial Content by default. No backend streaming code needed.

---

## Functional Requirements

1. FR-01: Add response caching (in-memory or Redis, TBD in plan) for `getFeaturedSongs`/`getMadeForYouSongs`/`getTrendingSongs` in `song.controller.js`, with a bounded TTL to avoid staleness.
2. FR-02: Add `compression()` middleware to the Express app in `backend/src/index.js`.
3. FR-03: Convert `App.tsx` route imports to `React.lazy()` + `Suspense`; add `manualChunks` in `vite.config.ts` for major vendor deps.
4. FR-04: Add `loading="lazy"` to all `<img>` usages found in scout (`LeftSidebar.tsx`, `SectionGrid.tsx`, `AlbumPage.tsx`, `PlaybackControls.tsx`, `SongTable.tsx`, `AlbumsTable.tsx`) and use Cloudinary URL transforms to request appropriately sized images.
5. FR-05: Parallelize `AuthProvider.tsx` init calls (`getToken`, `checkAdminStatus`, socket init) using `Promise.all` instead of sequential `await`s.
6. FR-06: Add bundle-analyzer script (e.g. `vite-bundle-visualizer`) and capture a baseline + post-change report.
7. FR-07 (Phase 2): Add pagination (`limit`/`skip` query params) to `Song.find()` in `song.controller.js` and `Album.find()` in `album.controller.js`.
8. FR-08 (Phase 2): Add indexes to Mongoose schemas on fields used for sort/filter (`createdAt`, `artist`, `albumId`).
9. FR-09 (Phase 2): Add `.lean()` to read-only Mongoose queries, including `populate()` calls in `album.controller.js`.
10. ~~FR-10 (Phase 2): Cache or short-circuit repeated Clerk user-lookup calls in `admin.controller.js` per session.~~ **Dropped** — obsolete after the Firebase Auth migration. `checkAdmin` now relies on the `admin` custom claim already verified once by `requireFirebaseAdmin` middleware; there is no repeated external API call left to cache.
11. FR-11: Add `f_auto,q_auto` (or equivalent) Cloudinary transform to image delivery URLs used across `LeftSidebar.tsx`, `SectionGrid.tsx`, `AlbumPage.tsx`, `PlaybackControls.tsx`, `SongTable.tsx`, `AlbumsTable.tsx`.
12. FR-12: Debounce the search input (~300ms) before it triggers the search API call.
13. FR-13: Wrap re-render-prone list/row components (`SectionGrid.tsx`, `SongTable.tsx`, `AlbumsTable.tsx`) in `React.memo`.
14. FR-14 (Phase 2): Add "load more" / infinite-scroll UI to song/album list views that consumes the `limit`/`skip` params added in FR-07, replacing the current full-list fetch-on-mount pattern.

---

## Non-Functional Requirements

<!-- Use numbers, not adjectives. "p95 latency < 500ms" not "fast" -->

- Performance: Initial JS bundle size reduced by 30-40% vs. baseline (measured via bundle-analyzer). API response time for home-page queries reduced (measured via simple timing log, before/after).
- Security: No change to auth/authorization behavior — caching and parallelization must not bypass existing Firebase Auth checks (`requireFirebaseAuth`/`requireFirebaseAdmin` middleware).
- Availability: No breaking change to existing API response shapes in Phase 1 (quick wins); Phase 2 pagination change must be additive (`limit`/`skip` optional, defaulting to current full-list behavior) to avoid breaking the current frontend consumers until they're updated.

---

## Success Criteria

- [ ] Bundle size (initial/main chunk): reduced 30-40% vs. pre-optimization baseline, measured via bundle-analyzer report.
- [ ] Home-page API response time: reduced vs. baseline (measured via added timing log), with cached responses serving repeat visits without re-running `$sample` aggregations.
- [ ] Route-level code splitting confirmed present (separate chunks per major route in build output).
- [ ] All identified `<img>` tags updated with lazy loading.
- [ ] AuthProvider init calls run in parallel (verified via code + reduced time-to-interactive).
- [ ] (Phase 2) List endpoints (`/songs`, `/albums`) support `limit`/`skip` and return correctly bounded results; indexes present in schema definitions.
- [ ] (Phase 2) Song/album list UI loads additional pages via "load more"/infinite scroll instead of fetching the full list on mount.

---

## Out of Scope

- Full virtualized list rendering (e.g. `react-window`) — a simpler infinite-scroll / "load more" UI on top of Phase 2 pagination is in scope, but windowed/virtualized rendering is not.
- Redis infrastructure setup — confirmed unavailable in the deployment environment; plan uses in-memory caching (`node-cache`).
- Any redesign of the auth flow beyond parallelizing existing calls.

---

## Assumptions

- Current dataset size (< ~500 songs/albums) means Phase 2 (pagination/indexing) is preparatory, not urgent — if this assumption is wrong (data about to grow fast), Phase 2 priority should move up.
- No existing APM/monitoring tool is in place; a lightweight, code-level measurement approach (bundle analyzer + manual timing logs) is acceptable for this round rather than adopting a full observability platform.
- Redis is confirmed unavailable in the deployment environment — plan uses in-memory caching (e.g. `node-cache`).

---

## Resolved Clarifications

- Redis is not available in the deployment environment; use in-memory caching (`node-cache`) for the home-query cache.
- Phase 2 pagination ships together with a frontend UI change (infinite scroll / "load more" pagination) in the same effort, not backend-only.
