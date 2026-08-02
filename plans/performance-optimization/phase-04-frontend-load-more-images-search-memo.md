# Phase 4: Frontend Polish — Load More, Image Optimization, Search Debounce & Memoization

Covers: FR-04, FR-11, FR-12, FR-13, FR-14

## Requirements

The admin song/album tables load more items on demand instead of fetching everything upfront (built on the Phase 3 pagination endpoints), images across the app load lazily and at an optimized format/size, the search input stops filtering/firing on every keystroke, and re-render-prone list components stop re-rendering unnecessarily.

**Scope correction from red-team review:** the home page's `SectionGrid.tsx` (Featured/Made For You/Trending) is fed by `$sample`-based random-draw endpoints, which Phase 3 did **not** paginate (there's no stable "next page" for a random sample) — so `SectionGrid.tsx` gets lazy-loading + Cloudinary transforms + `React.memo` in this phase, but **not** a "Load More" control. "Load More" is scoped to `SongTable.tsx`/`AlbumsTable.tsx` only, which genuinely consume the Phase 3 `limit`/`skip` endpoints. **FR-12 scope correction:** no backend search endpoint exists or is planned in this effort — search is a client-side filter over already-fetched data. The debounce here throttles re-filtering/re-rendering as the user types, not a network call; if a real backend search endpoint is added later, revisit this (unescaped input into a Mongo `$regex` would be an injection/ReDoS risk and needs its own review).

## Steps

1. Add a **new, separate** paginated fetch action for the admin song/album tables (e.g. `fetchSongsPage`/`fetchAlbumsPage`) that requests one page at a time and appends to its own dedicated state — do **not** repurpose the existing `fetchSongs`/`fetchAlbums` actions used by `LeftSidebar.tsx` and other full-list consumers, since converting those to page-and-append semantics would silently truncate/duplicate data in every other screen that calls them.
2. Add a "Load More" control to `SongTable.tsx`/`AlbumsTable.tsx` only, wired to the new paginated action, that fetches and appends the next page when clicked and hides itself once there's nothing left to load.
3. Add `loading="lazy"` to every image tag across the identified components (including `SectionGrid.tsx`) so offscreen images don't block page rendering.
4. Apply an automatic format/quality optimization to image URLs at render time (without touching how images are stored), so images are served in a lighter format without a visible quality drop.
5. Build a small reusable delay mechanism for the search input so it only re-filters the already-fetched list after the user pauses typing, instead of on every keystroke (no backend call involved — see scope correction above).
6. Wrap the identified list/row components (including `SectionGrid.tsx`) so they skip re-rendering when their relevant data hasn't actually changed.
7. Manually verify admin-table pagination, home-page lazy-loading/memoization (without a Load More control), search debounce, and reduced re-renders all work correctly together with no regressions to `LeftSidebar.tsx`'s full-list rendering or other existing screens.

## Success Criteria

- Admin song/album tables initially render only the first page of results, then correctly append more on "Load More" clicks, with no duplicate or missing items across pages.
- `LeftSidebar.tsx` and any other existing full-list consumer of `fetchSongs`/`fetchAlbums` is unaffected — still renders the complete list as before this phase.
- All previously-identified image tags load lazily, confirmed by inspecting rendered markup.
- Image requests visibly use the optimized delivery format/quality without a noticeable visual quality drop.
- Typing quickly in the search input results in one re-filter after typing pauses, not one per keystroke — no network request involved.
- The identified list/row components no longer re-render on unrelated store updates, confirmed via React DevTools profiling.

## Risks

- Mitigated by design (per red-team finding): a **new, separate** paginated action is added instead of repurposing `fetchSongs`/`fetchAlbums`, so `LeftSidebar.tsx` and other full-list consumers are structurally unaffected. Still read the full store file first and manually test every screen that consumes the existing actions, to confirm nothing else was touched.
- Cloudinary URLs already contain a transform segment from a prior change, and inserting a new one creates a broken/duplicate transform path: verify by inspecting a sample of actual stored URLs before writing the insertion logic.
- `React.memo` is added to a component whose parent always passes new object/array references, making the memoization a no-op: verify with React DevTools profiling before/after, not just by adding the wrapper.

## Files & Concrete Changes

- `frontend/src/stores/useMusicStore.ts` — add **new** `fetchSongsPage`/`fetchAlbumsPage` actions (distinct from the existing `fetchSongs`/`fetchAlbums`) that accept a page/offset, call the Phase 3 `limit`/`skip` query params, and append results to their own dedicated state (e.g. `paginatedSongs`/`paginatedAlbums` + `hasMoreSongs`/`hasMoreAlbums`); leave `fetchSongs`/`fetchAlbums` untouched for existing full-list consumers (`LeftSidebar.tsx`, etc).
- `frontend/src/pages/admin/components/SongTable.tsx`, `frontend/src/pages/admin/components/AlbumsTable.tsx` — add a "Load More" button wired to the new paginated action/state; hide it once `hasMore` is false; wrap the component (or its row sub-component) in `React.memo`.
- `frontend/src/pages/home/components/SectionGrid.tsx` — add `loading="lazy"` + Cloudinary transform helper to its images and wrap in `React.memo`; **no** "Load More" control here (no backing paginated endpoint — see scope correction above).
- `frontend/src/layout/components/LeftSidebar.tsx`, `frontend/src/pages/home/components/SectionGrid.tsx`, `frontend/src/pages/album/AlbumPage.tsx`, `frontend/src/layout/components/PlaybackControls.tsx`, `frontend/src/pages/admin/components/SongTable.tsx`, `frontend/src/pages/admin/components/AlbumsTable.tsx` — add `loading="lazy"` to every `<img>` tag; route each image `src` through a new small helper that inserts `f_auto,q_auto/` into the Cloudinary URL path.
- New helper file (e.g. `frontend/src/lib/getOptimizedImageUrl.ts`) — small function that inserts `f_auto,q_auto/` into a plain Cloudinary delivery URL's path; first verify against `backend/src/controller/admin.controller.js`'s `uploadToCloudinary` helper that stored URLs are untransformed, to avoid producing a duplicate/conflicting transform segment.
- New hook file (e.g. `frontend/src/hooks/useDebounce.ts`) — minimal `useDebounce(value, delay)` implementation (no new dependency), used to debounce the search input's value before it re-filters the already-fetched list client-side (no backend endpoint involved).
- Search input component (locate during implementation — no existing search feature found in `frontend/src`; this is net new) — wire the debounced value to a client-side filter over already-loaded songs/albums, defaulting to a ~300ms delay.

**Manual verification:**
- Load the admin song/album tables; confirm only the first page renders initially, and clicking "Load More" appends the next page with no duplicates, using the Phase 3 `limit`/`skip` params (check via network tab).
- Load the home page and `LeftSidebar`; confirm both still render their full lists exactly as before this phase (no truncation from the new paginated actions).
- Inspect rendered HTML for the six identified components and confirm every `<img>` has `loading="lazy"` and a URL containing `f_auto,q_auto`.
- Type rapidly into the search input and confirm the visible filtered results update once shortly after typing stops, not on every keystroke, and confirm no network request fires at all for the search itself.
- Use React DevTools Profiler to confirm `SectionGrid`, `SongTable`, and `AlbumsTable` (or their row components) skip re-rendering on unrelated store updates.
