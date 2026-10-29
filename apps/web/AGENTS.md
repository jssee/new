# apps/web

The SvelteKit app. It adapts: routing, rendering, form UX and transport. Product behavior lives in `packages/api`.

## Remote functions

A remote function (`src/lib/**/*.remote.ts`) is a thin adapter that calls one procedure through `api` from `#lib/server/api.ts`, as `src/lib/health.remote.ts` does. When it takes arguments, validate them with the procedure's input schema from `@myapp/api/schema`. Authorization, product rules and queries belong in the procedure. `api` turns a procedure's expected errors into SvelteKit errors with the same status.

## UI components

- Add shadcn-svelte components with `bunx shadcn-svelte@latest add <name> --yes`, then `bun run fix` to format them. Without a terminal and `--yes`, the CLI stops at its confirmation prompt, installs nothing and still exits 0.
- The CLI owns `src/lib/components/ui/**` and `src/lib/utils.ts`. Never hand-edit them; compose or wrap them in your own components.
- Style with the design tokens in `src/routes/layout.css` through their Tailwind classes, such as `bg-background`, `text-muted-foreground`, `border-border` and `bg-primary`. Add a token there when a new color or radius is needed.

## SvelteKit 3

- Import from `#lib/*` (there is no `$lib`). It resolves exact files only: `#lib/components/ui/button/index.js`, not the directory.
- `dev` comes from `$app/env`, and hook types from `@sveltejs/kit/hooks`.
- Portless serves https but forwards http to Vite. To check that a request is same-origin, compare hosts, not protocols or origins.
