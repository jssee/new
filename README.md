# myapp

- **Runtime:** Bun locally, Node 24 on Vercel
- **Web:** SvelteKit with remote functions, Tailwind, shadcn-svelte
- **API:** oRPC, contract-first, with valibot schemas and an OpenAPI handler at `/api`
- **Database:** Postgres 18 in Docker Compose on OrbStack, Drizzle ORM
- **Env:** varlock, declared in `apps/web/.env.schema`
- **Logging:** evlog, one wide event per request
- **Lint and format:** Biome via Ultracite, with Lefthook pre-commit hooks
- **Dev URLs:** portless, one per checkout
- **Deploy:** Vercel, with CI migrating production after merge

## Quick start

You need Bun at the version in `package.json`'s `packageManager`, and [OrbStack](https://orbstack.dev) (or see [Don't have OrbStack?](#dont-have-orbstack)).

<!-- rename:start -->

First, rename the project from the `myapp` placeholder. The name must be kebab-case, such as `my-project`. Rename before the first `bun run setup` if another unrenamed copy of this template runs on the machine, because both would share one Postgres container.

```sh
bun scripts/rename.ts my-project
```

<!-- rename:end -->

```sh
bun run setup                  # install, start Postgres, create this checkout's database
bunx portless service install  # once per machine; needs sudo
bun run dev                    # https://myapp.localhost
```

Every checkout gets its own dev URL and database. A linked worktree on branch `feat/x` serves `https://x.myapp.localhost` and uses a database named after `x`. Run `bun run setup` in each new worktree.

Without the portless proxy, `PORTLESS=0 bun run dev` serves plain Vite at `http://localhost:5173`.

## Commands

| Command               | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `bun run setup`       | Install dependencies and push the schema to this checkout's database  |
| `bun run dev`         | Start the dev server through portless                                 |
| `bun run check`       | Lint, format check, type check and env audit; CI runs the same        |
| `bun run fix`         | Fix lint and formatting                                               |
| `bun run build`       | Build the web app for Vercel                                          |
| `bun run env:check`   | Validate the env without printing secrets                             |
| `bun run db:push`     | Sync the schema to the local database while iterating                 |
| `bun run db:generate` | Generate a migration from the schema                                  |
| `bun run db:rehearse` | Reset the local database and apply every migration                    |
| `bun run db:migrate`  | Apply migrations to `$DATABASE_URL`                                   |
| `bun run db:studio`   | Open Drizzle Studio on this checkout's database                       |
| `bun run db:prune`    | Drop local databases whose worktree is gone                           |
| `bun run db:stop`     | Stop the local Postgres container                                     |

## Layout

```text
apps/web/        SvelteKit app: routes, remote functions, UI, env schema
packages/api/    oRPC contract, router and middleware
packages/db/     Drizzle schema, migrations and local Postgres
docs/            OBSERVABILITY.md: what gets logged and where
.github/         CI: check every change, migrate production after merge
```

Each directory with rules has an `AGENTS.md`.

## Deploy

1. Import the repo in Vercel. `vercel.json` sets the root directory, framework and install command. Vercel Services is in beta; if the import doesn't pick up the `web` service, set the project's root directory to `apps/web`.
2. Link this checkout to the project with `bunx vercel link`.
3. Give preview and production separate encryption keys for the env varlock injects:

   ```sh
   bunx varlock generate-key --plain | bunx vercel env add _VARLOCK_ENV_KEY preview --sensitive
   bunx varlock generate-key --plain | bunx vercel env add _VARLOCK_ENV_KEY production --sensitive
   ```

4. Set `DATABASE_URL` on Vercel, for preview and production, to the database provider's **pooled** (transaction-mode) URL. Serverless instances exhaust direct connections. The build needs it too.
5. Add a GitHub Actions secret `DATABASE_URL` with production's **direct** URL. CI's `migrate` job uses it after each merge to `main`; migrations through a transaction pooler can break session-level statements. Without the secret, the job skips with a warning.

Migrations run in CI alongside the deploy, never at build time, and Vercel can serve new code before its migration finishes. Keep every migration expand-only: add columns and tables before code depends on them, and remove them in a later change.

CI migrates only production. If previews use a separate database, migrate it yourself with `DATABASE_URL=<direct url> bun run db:migrate`.

## Don't have OrbStack?

OrbStack serves Postgres at `postgres.myapp.orb.local` without publishing a port. On Docker Desktop or Linux, publish it on loopback instead. In `packages/db/docker-compose.yml`, add to the `postgres` service:

```yaml
ports: ["127.0.0.1:5432:5432"]
```

Then, in `packages/db/scripts/local.ts`, change `host` to `localhost`.

Bind to 127.0.0.1, never all interfaces: the credentials are `postgres`/`postgres`. Two projects set up this way compete for port 5432, so stop one with `bun run db:stop` before starting the other.
