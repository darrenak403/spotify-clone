# Brainstorm: Performance Optimization

**Date:** 2026-08-02

## Ideas Explored

- **Quick wins (frontend + backend)**: cache home-page aggregation queries, add compression middleware, lazy-load images, route-level code splitting, parallelize auth init calls. Low effort, high visible impact, no API contract changes.
- **Data layer rework**: add Mongoose indexes, add pagination to song/album list endpoints, use `.lean()` on reads. Fixes root cause for scale but changes API contract (frontend must consume paginated responses).
- **Observability first**: add Lighthouse CI, Mongo slow-query logging/`explain()`, bundle analyzer before touching code. Safest, but delays visible improvement — dismissed as sole first step since dataset is currently small and evidence from static scout is already strong enough to act on.

## User's Direction

User wants both frontend and backend addressed, prioritizing whatever the user notices first (perceived speed). Chose to do quick wins (A) first, then data-layer work (B) as a follow-up — not done simultaneously. Current data scale is small (< ~500 songs/albums), so pagination/indexing is preparatory rather than urgent, but still valuable before the collection grows. Success measured technically: bundle size reduction (target 30-40%) and reduced API response time/query count, not just subjective feel.

## Additional Ideas Added After First Pass

User asked to expand further. New directions surfaced and triaged:

- **Audio Range-request support** — investigated and confirmed unnecessary: audio files are uploaded/delivered via Cloudinary CDN (`admin.controller.js:9,31`, `lib/cloudinary.js`), which supports HTTP Range/206 Partial Content by default. No custom backend streaming code exists or is needed. Moved to spec as [P3]/out-of-scope, documented as "confirmed fine" rather than a task.
- **Cloudinary `f_auto,q_auto`** — accepted into spec as [P2]/FR-11, complements the already-planned lazy-loading change.
- **Search debounce** — accepted into spec as [P2]/FR-12.
- **React.memo on list/row components** — accepted into spec as [P2]/FR-13.
- Dismissed (not added, no strong signal from user): Cache-Control/ETag headers, Mongoose connection pool tuning, DB/server region latency, route hover-prefetch — noted here in case a future round wants to revisit.

## Open Questions

- Exact current bundle size and API response times are unmeasured — no Lighthouse/bundle-analyzer/slow-query logging exists yet in the repo. `/ck:plan` should include adding lightweight measurement (bundle-analyzer run, simple response-time logging) as part of Phase 1 so before/after numbers exist.
- Whether Redis or in-memory caching (e.g. `node-cache`) is acceptable for home-query caching — no cache infra currently exists, deployment environment unknown.
- Whether pagination on song/album endpoints (Phase 2) requires new frontend infinite-scroll/pagination UI, or can ship as a non-breaking `limit`/`skip` query param with existing UI unaffected initially.

## Risks

- Changing song/album API responses to paginated shape (Phase 2) is a breaking change for existing frontend consumers (`SectionGrid.tsx`, `SongTable.tsx`, `AlbumsTable.tsx`) — must be sequenced carefully, not shipped silently.
- No before/after metrics currently exist — without adding minimal measurement first, "30-40% bundle reduction" and "reduced response time" claims cannot be verified.
- Caching home aggregations (`$sample`) risks staleness (same songs shown repeatedly) if cache TTL is too long — needs a sane invalidation/TTL policy.
