# Repository Rules

## Commands

- `bun run check` verifies a change: lint, format, and type checks. Run it before you finish; it must pass.
- `bun run fix` applies safe lint and format fixes.
- `bun run dev` serves the web app through Portless at `https://app.localhost`, or `https://<branch>.app.localhost` in a linked worktree. The dev script prints the URL; never hardcode a port or `localhost:<port>`.
- If `bun run dev` fails with "Proxy is not running", the Portless proxy needs sudo to bind port 443. Ask the user to run `bunx portless proxy start` once, or use `PORTLESS=0 bun run dev` for a plain Vite server.
- The pre-commit hook fixes staged files only. Never skip it (`--no-verify`) unless explicitly told to.
