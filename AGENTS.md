# myapp

## Architecture

Web adapts; API decides.

- `apps/web` owns routing, rendering, form UX and transport.
- `packages/api` owns contracts, authorization and product behavior.
- `packages/db` owns the schema, migrations and the client factory.

Biome enforces each boundary (`biome.jsonc`), so crossing one fails `bun run check`:

- Web code reaches the database only through the API. `noRestrictedImports` bans `@myapp/db` and `#lib/server/db.ts` in `apps/web`, except in the server wiring (`src/lib/server/api.ts` and `db.ts`).
- Only remote functions (`*.remote.ts`) and the HTTP API route (`src/routes/api/`) call procedures. `noRestrictedImports` bans `@myapp/api` and `#lib/server/api.ts` everywhere else in `apps/web`; `@myapp/api/schema` stays importable.
- Each workspace imports only what its own `package.json` declares: `noUndeclaredDependencies`.
- App and package code never reads `process.env` (`noProcessEnv` on `apps/web/src` and `packages/*/src`) or SvelteKit's `$env/*` (`noRestrictedImports`). Packages take configuration as arguments, such as `createDb(databaseUrl)`.

When a new rule can be expressed as a Biome rule, add it to `biome.jsonc` instead of writing it here.

Scripts run with plain `bun run --cwd <dir>` or `--filter`. There is no task orchestrator.

## A new feature is a procedure plus a remote function

Write the procedure in `packages/api` (see `packages/api/AGENTS.md`), call it from a remote function in `apps/web` (see `apps/web/AGENTS.md`), then render it. Extend the layer that already owns a concern instead of adding a new one.

## Env

- `apps/web/.env.schema` declares every config item. Declare an item in the same change that first reads it; `varlock audit` fails on unused items.
- Read config from `ENV` in `varlock/env`.
- Never set `DATABASE_URL` in `.env.local`. Each checkout computes its own; a fixed value makes every worktree share one database.
- Never print secret values. `bun run env:check` validates the env without revealing them.

## Dev server

- Run `bun run setup` first in every checkout, including a fresh worktree. It installs dependencies and creates this checkout's database, and is safe to rerun.
- `bun run dev` serves through portless at `https://myapp.localhost`, or `https://<branch>.myapp.localhost` in a linked worktree.
- The portless proxy needs `bunx portless service install`, once per machine, with sudo. Only a human can run it; ask for it. Until then, `PORTLESS=0 bun run dev` runs plain Vite at `http://localhost:5173`.

## Verification

- `bun run check` must pass: lint, format, types and the env audit, the same command CI runs. `bun run fix` fixes formatting.
- The pre-commit hook fixes staged files and blocks committed secrets. Never skip hooks unless told to.
- Rely on TypeScript for what it guarantees; write tests for behavior it can't check.

## Logging

Read `docs/OBSERVABILITY.md` before adding logging, handling errors or changing the hooks.
