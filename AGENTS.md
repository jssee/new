# Repository Rules

## Commands

- `bun run check` verifies a change: lint, format, type checks, and an env audit. Run it before you finish; it must pass.
- `bun run fix` applies safe lint and format fixes.
- `bun run dev` serves the web app through Portless at `https://app.localhost`, or `https://<branch>.app.localhost` in a linked worktree. The dev script prints the URL; never hardcode a port or `localhost:<port>`.
- In an Amp orb, the dev server is the `web` service in `.amp/services.yaml`: start it with `amp orb services ensure`, not `bun run dev`. It serves both `https://app.localhost` and the portal URL.
- If `bun run dev` fails with "Proxy is not running", the Portless proxy isn't installed on this machine. It needs sudo, so ask the user to run `bunx portless service install` once; meanwhile `PORTLESS=0 bun run dev` serves plain Vite.
- The pre-commit hook fixes staged files and blocks commits that contain a secret value. Never skip it (`--no-verify`) unless explicitly told to.

## Environment

- `apps/web/.env.schema` declares every env var the web app reads, with its type and whether it is sensitive. Add a var there before using it, and read it with `ENV` from `varlock/env`, never `process.env` or `$env/*`. The audit in `bun run check` fails on undeclared or unused vars.
- Local values go in `apps/web/.env.local`, which is gitignored. Never print secret values; inspect config with `bunx varlock load --agent` from `apps/web`, which redacts them.
