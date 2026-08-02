# Phase 2: Frontend Quick Wins — Code Splitting, Auth Parallelization & Bundle Analyzer

Covers: FR-03, FR-05, FR-06

## Requirements

The initial page load ships a smaller first-paint bundle by splitting routes and vendor code into separate chunks, the app's auth-startup sequence runs the two independent calls it safely can in parallel instead of one-by-one, and there is now an on-demand way to measure bundle size before/after.

## Steps

1. Convert each top-level route to load its code on demand instead of all upfront, with a single shared loading indicator while a route's code is fetched.
2. Split the largest third-party libraries (auth SDK, core UI framework, component library, realtime/socket library) into their own separate downloadable chunks instead of one giant bundle.
3. In the app's startup/auth sequence, run the admin-status check and the session call at the same time instead of one after the other, since neither depends on the other's result — leave the token fetch and the final socket connection where they are, since those genuinely depend on earlier steps finishing first.
4. Add an on-demand bundle-size report that a developer can generate manually, without affecting the normal production build.
5. Build the app and confirm route/vendor chunks show up as separate files, then generate the bundle report and record the sizes for before/after comparison.
6. Sanity-check the app still logs in and loads correctly after these changes — nothing here should change what the user sees, only how fast it appears.

## Success Criteria

- Production build output shows separate chunk files per top-level route and per major vendor library, instead of one large bundle.
- Login/auth-init visibly completes faster (fewer sequential network waits) with no change in what data ends up available to the rest of the app.
- A bundle-analysis report can be generated on demand and shows the chunk breakdown.
- Initial/main chunk size is reduced compared to the pre-change baseline.

## Risks

- Splitting vendor code into separate chunks introduces a runtime-only breakage (blank page) that a build-time check wouldn't catch: verify by actually running the app after building, not just inspecting build output.
- Parallelizing the wrong two calls accidentally races a call against data it needs: verify by re-confirming which calls depend on which before wiring `Promise.all`, and manually testing login end-to-end (including the admin-flagged account path) after the change.

## Files & Concrete Changes

- `frontend/package.json` — add `rollup-plugin-visualizer` as a dev dependency; add an `analyze` script (e.g. `vite build` with the analyzer plugin enabled).
- `frontend/src/lib/firebase.ts` — verify (read before editing) that only modular subpackage imports (e.g. `firebase/auth`) are used, not the umbrella `firebase` package; fix if it's importing the full package, since that would defeat the vendor-chunk split.
- `frontend/src/App.tsx` — convert each top-level route's import to `React.lazy()`; wrap the route tree in one shared `<Suspense fallback={...}>` reusing the existing `Loader` component pattern already used in `frontend/src/providers/AuthProvider.tsx`.
- `frontend/vite.config.ts` — add `build.rollupOptions.output.manualChunks` splitting `firebase` (own chunk), `react`/`react-dom` (vendor-react chunk), `@radix-ui/*` (vendor-ui chunk), and `socket.io-client` (own chunk); add the `rollup-plugin-visualizer` plugin, gated so it only runs during the `analyze` script (`gzipSize: true`, `open: true` only in that script, not the default build).
- `frontend/src/providers/AuthProvider.tsx` — wrap the existing `checkAdminStatus()` call and the existing `axiosInstance.post("/auth/session")` call in `Promise.all`, since both only need the already-resolved `idToken`/`data.user` from the prior `/auth/callback` step; keep `getIdToken()` → `/auth/callback` sequential before that, and keep `initSocket()` sequential after both resolve (it needs `data.user._id` and the session token from both).

**Manual verification:**
- Run the production build; inspect the output file list and confirm distinct chunk files exist for `firebase`, `react`-vendor, `@radix-ui`-vendor, and `socket.io-client`, plus one chunk per top-level route.
- Run `npm run analyze` (or equivalent) and confirm a visual report opens/generates showing the chunk breakdown and gzip sizes.
- Log in as a normal user and as an admin-flagged user; confirm both reach an authenticated, socket-connected state with no console errors, and time-to-interactive is visibly reduced vs. the pre-change sequential flow.
