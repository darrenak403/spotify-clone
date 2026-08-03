# Phase 2: Catalog Read Controllers (Song & Album)

## Requirements

Rewrite the public song/album listing and detail endpoints against the new database client, preserving today's exact pagination behavior and response shapes, and close the new UUID-validation gap this migration introduces on any endpoint that looks up a record by its ID.

## Steps

1. Rewrite the "list all songs" endpoint to read from the new database client instead of the old one, keeping the existing pagination rules exactly as they are today — no `limit` param means the full list, an invalid or non-positive `limit` also means the full list, and a valid `limit` gets capped at 100.
2. Rewrite the "list all albums" endpoint with the identical pagination behavior as the songs list, since both currently share the same logic.
3. Rewrite the "get one album by ID" endpoint so it fetches the album along with its songs in a single call, replacing the old two-step fetch-then-attach pattern — the response shape (an album object with a nested songs list) must stay identical to what the frontend already expects.
4. Before any of these ID-lookup calls run, add a guard that rejects a malformed ID in the URL with a clean, existing-style "not found" response instead of letting it reach the database client — the new database client fails ugly on a bad ID format where the old one failed quietly, so this guard is new, required behavior, not optional cleanup.
5. Sweep every other controller for a similar by-ID lookup pattern (not just the album one) so the same guard gets applied everywhere a URL parameter feeds directly into an ID-based fetch, not only at the one call site named in the spec.
6. Manually verify (via direct request or through the running frontend, if a live database is reachable) that both list endpoints and the album detail endpoint return the same shape as before, including the "album not found" and "malformed ID" cases.

## Success Criteria

- `GET /songs` and `GET /albums` return identical response shapes and honor the same pagination rules (no-limit-means-all, cap at 100) as the pre-migration version.
- `GET /albums/:albumId` returns an album with its songs nested inside, in one call, matching the old response shape.
- Requesting an album (or any similarly ID-looked-up resource) with a garbage ID returns a clean 404-style response, not an unhandled server error.
- No route handler in the touched controllers still imports the old database models.

## Risks

- Missing a by-ID lookup site during the sweep in step 5, leaving one endpoint exposed to the ugly-500 failure mode — mitigate by grepping every controller file for URL-parameter-driven lookups before considering this phase done, not just the one named in the spec.
- Subtly changing the pagination cap/validation logic while porting it (e.g. treating `limit=0` as "no limit" the way the underlying driver used to) — mitigate by copying the existing validation conditions line-for-line rather than re-deriving them from intent.
