# Phase 3: Random-Sampling Helper & Home-Page Endpoints

## Requirements

Replace the Mongo-specific random-sampling aggregation behind the three home-page endpoints (featured, made-for-you, trending songs) with a Postgres-native equivalent.

## Decision (resolved during plan validation — confirmed with user)

The spec originally described an indexed "random sort key" technique for random sampling, with a wrap-around query for when the first pass returns too few rows. At this app's actual data scale (roughly 500 songs), that technique is more complex than it needs to be and carries a known, real statistical bias: rows sitting near the wrap-around point get pulled more often than everything else. A plain, unbiased random-order-and-limit query is simpler to implement, has no bias, and costs nothing meaningful at this row count.

**Resolved: implement the simple, unbiased `ORDER BY random() LIMIT n` approach** (confirmed with the user during plan validation, overriding the spec's literal `randomSortKey` wording). No `randomSortKey` column, index, or wrap-around fallback query is needed — a plain `ORDER BY random() LIMIT n` raw query already returns all available rows (never errors, never returns fewer than what exists) when fewer rows exist than requested, so the "under-filled results" case in the spec is naturally covered without extra logic.

## Steps

1. Build a small, dedicated helper (not inline in the route handlers) that runs a raw `ORDER BY random() LIMIT n` query against the songs table (via the database client's parameterized raw-query mechanism, not string interpolation) and returns plain song records — since the database client has no built-in way to ask for "N random rows," this has to go through a raw query.
3. Rewrite the featured-songs endpoint to call the new helper for its 6 random songs, keeping the existing short-lived cache and the existing narrowed response shape (title/artist/image/audio only, no extra fields).
4. Rewrite the made-for-you-songs and trending-songs endpoints the same way, each requesting 4 random songs, reusing the same helper rather than duplicating the query.
5. Preserve the existing timing log around each of these three endpoints so query-cost visibility doesn't regress.
6. Verify with a small seeded dataset that requesting more random songs than exist returns everything available, never fewer than what's actually in the table, and never errors.

## Success Criteria

- The random-sampling helper uses a plain `ORDER BY random() LIMIT n` raw query, with no `randomSortKey` column/index/wrap-around logic.
- `GET` calls to the featured, made-for-you, and trending song endpoints return the same response shape (song objects with the same field subset) as before, and never return more than the requested count.
- None of the three endpoint handlers contain the raw random-sampling query directly — it lives in one shared helper.
- Requesting more random songs than exist in the table returns all available songs without erroring.

## Risks

- The raw-query helper being written as string-interpolated SQL instead of using the database client's parameterized raw-query mechanism, opening a SQL-injection-shaped hole even though these particular queries take no user input today — mitigate by using the client's safe raw-query form regardless, as a matter of habit for any raw SQL introduced by this migration.
