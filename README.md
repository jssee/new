# New

A template for web side projects: a SvelteKit app over a contract-first API and Postgres, set up for working with coding agents.

- Bun workspaces, Biome via Ultracite, Lefthook
- SvelteKit with remote functions, shadcn-svelte, Tailwind
- oRPC with Valibot, and an OpenAPI reference page
- Postgres with Drizzle, Better Auth (email and password)
- evlog, varlock, Portless, Vercel

## Start a project

You need Bun, Docker (or OrbStack), and the Portless proxy. The proxy needs sudo, so install it once per machine:

```sh
bunx portless service install
```

After creating a repo from this template, replace the placeholder name `app`. The script renames the package scopes, the local URL, and the database, then deletes itself:

```sh
bun scripts/rename.ts <name>
```

Then install, create the local database, and start the app:

```sh
bun install
bun run db:migrate
bun run dev
```

`db:migrate` starts a shared `dev-postgres` container if needed, creates this checkout's database, migrates it, and seeds a user: `dev@example.com` with password `password`. The app runs at `https://app.localhost`. Each git worktree gets its own URL and database, so parallel branches never collide.

## Commands

| Command | Does |
| --- | --- |
| `bun run dev` | Serve the app through Portless |
| `bun run check` | Lint, format, type check, and audit env vars |
| `bun run fix` | Apply safe lint and format fixes |
| `bun run build` | Build the app |
| `bun run db:generate` | Generate a migration from schema changes |
| `bun run db:migrate` | Apply migrations (creates and seeds the local database) |
| `bun run db:reset` | Drop and recreate the local database |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run deploy:logs` | Show why the branch's latest deployment failed |
| `bun run env:preview` | Push env values and secrets to Vercel previews |
| `bun run env:production` | Push env values and secrets to Vercel production |

## Layout

```txt
apps/web       SvelteKit app: routes, components, remote functions
packages/api   oRPC contract and router, Better Auth config
packages/db    Drizzle schema, migrations, local database scripts
scripts        Project scripts
```

The web app reaches the API only through remote functions, and only the API queries the database; Biome enforces both. Env vars are declared in `apps/web/.env.schema`. The `AGENTS.md` files describe these rules for coding agents.

## Deploy to Vercel

1. Import the repo in Vercel. `vercel.json` sets the root directory, framework, and install command.
2. Link this checkout: `bun run deploy:setup`.
3. Create a Postgres database and set its pooled connection string as `DATABASE_URL` for preview and production:

   ```sh
   bunx vercel env add DATABASE_URL production --sensitive
   bunx vercel env add DATABASE_URL preview --sensitive
   ```

4. Run `bun run env:preview` and `bun run env:production`. Each generates the environment's `BETTER_AUTH_SECRET` and the `_VARLOCK_ENV_KEY` that encrypts the env baked into the build, and pushes any non-local values from `apps/web/.env.local`.
5. Add the production database's direct connection string as the `DATABASE_URL` secret in GitHub Actions. CI then applies migrations after each merge to `main`, while the new code deploys, so keep migrations expand-only.

Auth accepts the deployment's Vercel hostnames by default. Set `BETTER_AUTH_ALLOWED_HOSTS` on Vercel only to add another domain.

## Amp orbs

`.agents/setup` prepares an orb: Bun, dependencies, Portless, Docker, and the database. `.amp/services.yaml` runs the dev server as the `web` service and exposes it as a portal.
