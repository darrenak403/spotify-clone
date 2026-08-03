# Phase 1: Prisma Schema & Connection Foundation

## Requirements

Stand up Prisma as the data layer's foundation — a schema covering all 4 models, a single shared database client, and the right dependencies — so every later phase has a working, migratable schema and a safe way to talk to Postgres.

## Steps

1. Add Prisma to the backend project (both the CLI/dev tool and the runtime client) and remove the old Mongoose/MongoDB dependency from the package manifest.
2. Author a single schema file describing the User, Song, Album, and Message models, matching the fields, relationships, and indexes called for in the spec — UUID primary keys throughout, a nullable song-to-album link (not a required one), and no stored song list on the album side (that list is derived automatically). **Decision: use Postgres's native UUID column type for every primary/foreign key** (not a plain text column that merely happens to hold UUID-formatted strings) — this is what makes the malformed-ID guard in Phase 2 a real, required fix rather than optional hygiene, since only the native type causes the ORM to reject a bad ID with a raw validation error instead of just matching zero rows.
3. Configure the schema's database connection to use two separate connection strings — one for normal app traffic (pooled) and one dedicated to running migrations (direct/unpooled) — since Neon requires the unpooled path for schema changes to succeed reliably.
4. Replace the existing single-purpose database connection file with a shared, reusable database client that the rest of the app can import everywhere it currently imports a Mongoose model — built so it's created once per running process, never once per request.
5. Generate the initial migration and confirm it produces all 4 tables with the indexes specified in the spec.
6. Update the environment variable template to describe the two new connection strings in place of the old single Mongo URI, with comments explaining which is which.

## Success Criteria

- The backend's dependency manifest no longer lists the old MongoDB driver/ORM as a dependency, and lists the new Prisma packages instead.
- Running the migration command against a real (or locally reachable) Postgres database succeeds and creates exactly 4 tables with the specified indexes, with no manual SQL required.
- The app's entry point boots without throwing an import error for the removed database connection file (every import of it has been redirected to the new shared client).
- The environment variable template file contains the two new connection-string variables with explanatory comments, and no longer contains the old Mongo variable.

## Risks

- Using the pooled connection string for migrations instead of the direct one: produces a cryptic lock-related failure rather than a clear error — mitigate by double-checking which variable name the migration command reads from before running it.
- Getting the nullable album relationship or the derived (non-stored) song list wrong in the schema: would silently reintroduce the old two-way-sync problem this migration is meant to remove — mitigate by re-reading the spec's exact field/relationship wording for these two models before finalizing the schema, not just approximating from memory of the old Mongoose shape.
