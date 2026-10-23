# Repository Rules

## Commands

- `bun run check` verifies a change: lint, format, and type checks. Run it before you finish; it must pass.
- `bun run fix` applies safe lint and format fixes.
- `bun run dev` serves the web app through Portless at `https://app.localhost`, or `https://<branch>.app.localhost` in a linked worktree. The dev script prints the URL; never hardcode a port or `localhost:<port>`.
- In an Amp orb, the dev server is the `web` service in `.amp/services.yaml`: start it with `amp orb services ensure`, not `bun run dev`. It serves both `https://app.localhost` and the portal URL.
- If `bun run dev` fails with "Proxy is not running", the Portless proxy isn't installed on this machine. It needs sudo, so ask the user to run `bunx portless service install` once; meanwhile `PORTLESS=0 bun run dev` serves plain Vite.
- The pre-commit hook fixes staged files only. Never skip it (`--no-verify`) unless explicitly told to.
