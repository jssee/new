# Repository Rules

## Architecture

- `apps/web` renders UI and reaches the API only through remote functions (`*.remote.ts`), which call procedures with the `api` client from `#lib/server/api.ts`. Pages, components, loads, and hooks never call the API or the database directly; Biome fails those imports.
- `packages/api` owns product behavior and is the only layer that queries the database. It also holds the Better Auth config. A new feature is a procedure there plus a remote function here.
- `packages/db` owns the schema and migrations. Configuration lives in `apps/web/.env.schema`; the web app passes values such as `DATABASE_URL` into the packages that need them.

## Commands

- `bun run check` verifies a change: lint, format, type checks, and an env audit. Run it before you finish; it must pass.
- `bun run fix` applies safe lint and format fixes.
- `bun run dev` serves the web app through Portless at `https://app.localhost`, or `https://<branch>.app.localhost` in a linked worktree. The dev script prints the URL; never hardcode a port or `localhost:<port>`.
- In an Amp orb, the dev server is the `web` service in `.amp/services.yaml`: start it with `amp orb services ensure`, not `bun run dev`. It serves both `https://app.localhost` and the portal URL. Read its request logs with `amp orb service logs web`.
- If `bun run dev` fails with "Proxy is not running", the Portless proxy isn't installed on this machine. It needs sudo, so ask the user to run `bunx portless service install` once; meanwhile `PORTLESS=0 bun run dev` serves plain Vite.
- `bun run db:migrate` starts the local Postgres container if needed, creates this checkout's database, and applies migrations. Run it in a fresh checkout or worktree and after pulling migrations. `bun run db:reset` drops and recreates the local database.
- Local databases are seeded with a user: sign in as `dev@example.com` with password `password`.
- Pushes deploy to Vercel. When a deployment fails, run `bun run deploy:logs [branch]` (the current branch by default): it waits for the build, then prints its logs if it failed or the runtime errors if it built. It needs the repo linked once with `bun run deploy:setup`.
- The pre-commit hook fixes staged files and blocks commits that contain a secret value. Never skip it (`--no-verify`) unless explicitly told to.

## Environment

- `apps/web/.env.schema` declares every env var the web app reads, with its type and whether it is sensitive. Add a var there before using it, and read it with `ENV` from `varlock/env`, never `process.env` or `$env/*`. The audit in `bun run check` fails on undeclared or unused vars.
- `DATABASE_URL` defaults to this checkout's own local database: `app` in the main checkout, `app_<branch>` in a linked worktree. Don't set it in `.env.local`, or worktrees will share one database.
- Deployments read values set on Vercel. `bun run env:preview` and `bun run env:production` push the non-local values from `.env.local` and generate per-environment secrets. `DATABASE_URL` must be set there by hand; the allowed auth hosts come from Vercel's own hostnames.
- Local values go in `apps/web/.env.local`, which is gitignored. Never print secret values; inspect config with `bunx varlock load --agent` from `apps/web`, which redacts them.
