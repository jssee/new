# Auth Package Rules

- `createAuth()` holds the Better Auth config; `apps/web` creates the instance with its env in `#lib/server/auth.ts`.
- After changing the config in a way that affects tables, such as adding a plugin, run `bun run auth:schema` here to regenerate `packages/db/src/schema/auth.ts`, then `bun run db:generate` from the root.
