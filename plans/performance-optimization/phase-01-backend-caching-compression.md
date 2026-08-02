# Phase 1: Backend Quick Wins — Caching & Compression

Covers: FR-01, FR-02

## Requirements

The home page's featured/made-for-you/trending song queries stop re-running expensive `$sample` aggregations on every visit, and all API responses are gzip-compressed to cut payload size — with no change to response shapes or auth behavior.

## Steps

1. Add an in-memory cache to the backend and use it to wrap the three home-page song-list lookups, so repeat visits within a short window are served from memory instead of hitting Mongo again.
2. Give the cached entries a short, bounded lifetime (around a minute and a half) so data can't go stale for long, and document that this cache lives in one server process only.
3. Make sure any admin action that creates or removes a song or album clears the cache immediately, so edits show up right away instead of waiting out the TTL.
4. Turn on response compression for the whole API so payloads sent to the browser are smaller across the board.
5. Add a simple timing log around the home-page queries so there's a before/after number to point to.
6. Manually confirm the cached endpoints return identical data/shape to before, just faster on repeat calls, and that compression is actually applied on responses.

## Success Criteria

- Repeated calls to the featured/made-for-you/trending endpoints within the cache window return noticeably faster than the first call, confirmed via the added timing log.
- Creating or deleting a song/album immediately reflects in the next featured/made-for-you/trending response (no stale cache window).
- API responses include a compression header and are visibly smaller in size for a typical list response.
- No change to the JSON shape/fields returned by the three cached endpoints compared to before this phase.

## Risks

- Cache invalidation gets missed on one of the admin mutation paths, leaving stale data visible after an edit: verify every song/album create/update/delete handler triggers the cache clear, not just the obvious ones.
- Compression middleware ordering conflicts with existing body-parsing or CORS setup: verify by hitting a few existing endpoints end-to-end after the change, not just the new cached ones.

## Files & Concrete Changes

- `backend/package.json` — add `node-cache` and `compression` as dependencies.
- `backend/src/controller/song.controller.js` — instantiate a module-level `node-cache` singleton (`new NodeCache({ stdTTL: 90, checkperiod: 120 })`); wrap `getFeaturedSongs`, `getMadeForYouSongs`, `getTrendingSongs` in a `cache.get(key) ?? (compute + cache.set(key, result))` pattern, one cache key per function; add a `console.time`/`console.timeEnd` (or `Date.now()` diff log) around the underlying Mongo aggregation call in each.
- `backend/src/controller/admin.controller.js` — locate every song/album create/update/delete handler (grep for `Song.` / `Album.` write operations: `create`, `findByIdAndDelete`, `findByIdAndUpdate`, etc.) and call the same cache instance's `.flushAll()` at the end of each.
- `backend/src/index.js` — `const compression = require("compression")` (or ESM import matching existing style), add `app.use(compression())` immediately after the existing `cors()` middleware registration and before `express.json()`/route registration.

**Manual verification:**
- `curl` (or Postman) the featured/made-for-you/trending endpoints twice in a row within 90s; confirm the second call's logged timing is near-zero vs. the first, and the JSON body is byte-for-byte identical in shape.
- Create then delete a test song via the admin endpoints; re-`curl` the home endpoints and confirm the response reflects the change immediately (not cached).
- `curl -H "Accept-Encoding: gzip" -I` any list endpoint and confirm a `Content-Encoding: gzip` response header is present.
