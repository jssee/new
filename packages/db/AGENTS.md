# packages/db

The schema (`src/schema/`), the migrations (`migrations/`) and `createDb`, the client factory.

## Who touches the database

- Only `packages/api` queries the database, through `context.db`.
- The web app owns the one pool (`apps/web/src/lib/server/db.ts`). `createDb` opens a new pool on every call, so nothing else calls it.

## Changing the schema

- While iterating, `bun run db:push` syncs the schema to this checkout's local database. It refuses any database that isn't local.
- Before merge: rebase onto `main`, run `bun run db:generate`, then `bun run db:rehearse` (it resets the local database and applies every migration), and commit the generated SQL and `migrations/meta/`. Generating before the rebase gives two branches the same migration number.
- Never edit a committed migration. Generate a new one.
- Keep changes expand-only. Vercel deploys before CI migrates production, so add columns and tables before code depends on them, and remove them in a later change.
