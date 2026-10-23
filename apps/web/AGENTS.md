# Web App Rules

## UI

- Build UI from the shadcn-svelte primitives in `#lib/components/ui`. Add missing ones with `bunx shadcn-svelte@latest add <name>` from `apps/web`; never hand-edit files in `ui/`.
- Put feature components that compose primitives in `#lib/components`.
- Style with the theme tokens in `src/routes/layout.css` (`bg-primary`, `text-muted-foreground`); add a token instead of hardcoding a color.

## Auth

- `hooks.server.ts` resolves the session once per request into `locals.session`; read it there instead of calling Better Auth again.
- Sign-in, sign-up, and sign-out are remote forms in `#lib/auth/auth.remote.ts`. Pass the request headers to every `auth.api` call; Better Auth needs them to resolve its base URL.
- Auth pages live in `routes/(auth)/[authtype=authtype]`; the `authtype` matcher in `src/params.ts` lists them. Add a page there by extending the matcher, not with a new route.
- Guard each page that needs a signed-in user in its own `+page.server.ts` by calling `requireSession(event)` from `#lib/auth/session.server.ts` first in `load`. Don't guard with layout groups. Loads don't cover remote functions, so private data must come from a procedure that checks the session; see `packages/api/AGENTS.md`.

## Logging

- evlog emits one wide event per request from `hooks.server.ts`, with the signed-in user already on it. Add context to that event with `locals.log.set({ feature: { ... } })` instead of `console.log` or separate log lines; procedures add theirs through `context.log`.
- `handleError` records unexpected errors; `error(...)`, 404s, and invalid remote input show up only as the response status. Options and a future drain go in `evlog.config.ts`.
- In browser code, log with `log` from `evlog/client`. Warnings and errors, including uncaught ones, reach the server log through `/api/logs` under `client`. That endpoint keeps only the fields in its schema, so extend the schema to send more.
- Log stable IDs, statuses, counts, and reason codes. Never log secrets, tokens, raw request bodies, or full emails.
