# API Package Rules

This package is contract-first oRPC v2 with Valibot, plus the Better Auth config.

- Change the API in this order: schemas in `src/schema.ts`, the procedure's contract in `src/contract.ts`, then its handler in `src/router.ts`. Every procedure declares `.input` (if it takes any) and `.output`, plus `openapi({ method, path })` metadata.
- The initial context is `{ db, log, session }`, supplied by `apps/web/src/lib/server/api.ts`. This package never reads env vars.
- `log` is the request's evlog event. Enrich it with `context.log.set({ feature: { ... } })`. The router-level `evlog()` middleware already records the procedure name and any thrown error; never add it to a procedure too, or it runs twice.
- Implement public procedures on `os`. When the first procedure needs a signed-in user, add the oRPC docs' auth middleware to `src/router.ts` and implement signed-in procedures on `authed`:

  ```ts
  const requireAuth = os.middleware(({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({ context: { user: context.session.user } });
  });

  const authed = os.use(requireAuth);
  ```

- Scope every query on user data to `context.user.id`. Treat another user's resource as missing: throw `NOT_FOUND`, not `FORBIDDEN`.
- Throw `ORPCError` with a standard code (`NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`) for expected failures. Its `message` and `data` reach the client, so keep secrets and internals out of them.
- `apps/web` calls procedures in-process from remote functions and serves them over HTTP at `/api`, with the reference UI there and the spec at `/api/spec.json`. `/api/logs` belongs to the web app's browser logger, so no procedure may use the `/logs` path.

## Auth

- `createAuth()` in `src/auth.ts` holds the Better Auth config; `apps/web` creates the instance with its env in `#lib/server/auth.ts` and resolves the session that procedures receive.
- After changing the config in a way that affects tables, such as adding a plugin, run `bun run auth:schema` here to regenerate `packages/db/src/schema/auth.ts`, then `bun run db:generate` from the root.
