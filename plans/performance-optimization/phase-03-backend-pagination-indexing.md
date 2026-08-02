# Phase 3: Backend Scalability — Pagination, Indexes & Lean Reads

Covers: FR-07, FR-08, FR-09

## Requirements

Song and album list endpoints support optional page-size/offset parameters and use indexed, lean database reads, so response time stays flat as the dataset grows — with zero change in behavior for any caller that doesn't yet pass the new parameters.

## Steps

1. Add optional page-size and offset parameters to the song list and album list endpoints, defaulting to today's "return everything" behavior when the caller doesn't send them. Parse both with `parseInt`; if either is non-numeric or negative, ignore it and fall back to full-list behavior; clamp `limit` to a max of 100 regardless of what the caller requests (these are public, unauthenticated endpoints — an unbounded `limit` is a cheap DoS vector).
2. Add database indexes on the fields these lists sort and filter by, so lookups stay fast as row counts grow.
3. Switch the read-only list and detail queries (including the album-with-songs lookup) to a lighter read mode that skips unnecessary Mongoose overhead, since nothing downstream needs full document instances for these.
4. Manually verify the endpoints behave identically to before when called without the new parameters, and correctly return a bounded page when called with them.
5. Confirm the new indexes are actually registered against the database, not just declared in code.

## Success Criteria

- Calling the song/album list endpoints without any new parameters returns the exact same data as before this phase.
- Calling the same endpoints with a page-size/offset returns a correctly bounded subset of results, in the same order as before.
- Newly declared indexes are visible on the corresponding collections.
- No downstream code breaks from the lighter-weight read mode (list and detail pages still render correctly, including album-with-songs).

## Risks

- A caller elsewhere in the codebase depends on the full-list response and doesn't pass the new parameters as expected, silently getting truncated data: verify by grepping every caller of these two endpoints before changing anything, and keeping "no parameter = full list" as the explicit fallback.
- The lighter-weight read mode strips something a downstream consumer secretly relies on (an instance method, virtual field, or similar): verify by re-checking every place that consumes these query results before merging.
- Offset (`skip`/`limit`) pagination is not stable under concurrent writes — if a song/album is created or deleted between two "Load More" page fetches, items can shift, causing a duplicate or a skipped item in the next page. Accepted, documented limitation at this dataset size (~500 docs, low write concurrency); not worth cursor-pagination complexity for this round.
- `limit`/`skip` are public, unauthenticated query params (no auth middleware on the list endpoints) — must be parsed and clamped (see Steps) before use, otherwise a caller can request an unbounded or malformed page size.

## Files & Concrete Changes

- `backend/src/models/song.model.js` — add `songSchema.index({ createdAt: -1 })`, `songSchema.index({ artist: 1 })`, `songSchema.index({ albumId: 1 })`.
- `backend/src/models/album.model.js` — add `albumSchema.index({ createdAt: -1 })`, `albumSchema.index({ artist: 1 })`.
- `backend/src/controller/song.controller.js` — in `getAllSongs`, read `req.query.limit` / `req.query.skip`; parse with `parseInt`, treat `NaN`/negative as absent; if `limit` is absent, keep current `Song.find().sort({createdAt:-1})` behavior unchanged; if present, clamp to `Math.min(limit, 100)` and apply `.skip(skip).limit(limit)` on top of the same sort. Add `.lean()` to this query.
- `backend/src/controller/album.controller.js` — apply the same optional, parsed-and-clamped `limit`/`skip` pattern to `getAllAlbums`'s `Album.find()`; add `.lean()` to `Album.find()` and to `getAlbumById`'s `Album.findById(id).populate("songs")`.

**Manual verification:**
- `curl` `GET /songs` and `GET /albums` with no query params; diff the response against a pre-change capture to confirm identical shape and full result count.
- `curl` the same endpoints with `?limit=10&skip=0` and `?limit=10&skip=10`; confirm each returns exactly 10 distinct, correctly ordered items with no overlap or gaps.
- Connect to the database and confirm the five new indexes exist on the `songs` and `albums` collections (e.g. via `db.songs.getIndexes()` / `db.albums.getIndexes()` or equivalent).
- Load an album detail page in the running app and confirm its song list still renders correctly after the `.lean()` change on `getAlbumById`.
