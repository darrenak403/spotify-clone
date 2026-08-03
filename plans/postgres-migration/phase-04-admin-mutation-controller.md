# Phase 4: Admin Mutation Controller

## Requirements

Rewrite song/album creation and deletion so admins can still manage the catalog, with the same cache-invalidation and file-upload behavior as today, now that there's no stored song list on the album to keep in sync. Also rewrite the admin stats endpoint, which was not covered by any other phase despite being named in the spec's own success criteria.

## Steps

1. Rewrite song creation so a new song is inserted with its optional album link set directly — there's no longer a second step to push the new song's ID into an album's song-list array, since that list no longer exists as stored data.
2. Rewrite song deletion the same way — deleting a song no longer requires pulling its ID out of an album's array, just removing the song row itself (after confirming it exists, returning a clean not-found response otherwise, preserving the existing 404 guard).
3. Rewrite album creation and album deletion, including the existing "delete all songs belonging to this album" step that happens before the album itself is removed.
4. Keep the existing short-lived cache invalidation call in place on all four of these mutation actions (song create, song delete, album create, album delete) so featured/made-for-you/trending data doesn't go stale after an edit.
5. Confirm the existing file-upload-to-storage step (for song audio/images and album art) is untouched by this rewrite — only the database read/write side changes, not how files get uploaded.
6. Rewrite the admin stats endpoint (`stat.controller.js`'s `getStats`) against the new database client: total song/album/user counts become simple row-count queries; the current cross-collection "distinct artist" count (a Mongo-specific union-across-collections aggregation) has no direct equivalent and must be reimplemented as a raw SQL query unioning distinct artist names from both the song and album tables (or as two separate distinct-artist queries combined and de-duplicated in application code) — either approach is acceptable as long as the returned count matches today's semantics (unique artists across both songs and albums).
7. Manually verify (where a live database is reachable) that creating and deleting a song or album still works end-to-end, that a song's album link is null (not erroring) when no album was specified, and that the stats endpoint returns the same shape/semantics as before.

## Success Criteria

- Creating a song with no album specified succeeds, and that song's album field is empty/null rather than causing an error.
- Deleting an album also removes its songs, matching current behavior.
- The cache-flush call still fires on all four mutation actions, unchanged from today.
- The stats endpoint returns the same fields (song/album/user totals, unique-artist count) with no remaining import of the old database models.
- No mutation handler still imports the old database models or references the old stored song-list array.

## Risks

- Forgetting to drop the "push/pull song ID into album's array" logic entirely rather than translating it 1:1 — since that array doesn't exist in the new schema, any leftover reference to it will error — mitigate by re-reading each mutation function's old array-sync lines and deleting them outright rather than converting them.
- The pre-existing parameter-destructuring quirk in the current delete-song handler (a slightly unusual `req.params` access pattern) getting carried forward unexamined — mitigate by reading the handler's parameter-extraction line carefully during the rewrite rather than copying it verbatim.
- The unique-artist count silently double-counting or under-counting artists that appear in both songs and albums if the union/de-duplication logic is implemented incorrectly — mitigate by testing with a small seeded dataset containing an artist present in both a song and an album, and confirming the count treats them as one.
