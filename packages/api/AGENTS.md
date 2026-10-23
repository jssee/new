# API Package Rules

This package is contract-first oRPC v2 with Valibot. `notes` is the example feature; copy its shape and delete it when it no longer serves the project.

- Change the API in this order: schemas in `src/schema.ts`, the procedure's contract in `src/contract.ts`, then its handler in `src/router.ts`. Every procedure declares `.input` (if it takes any) and `.output`, plus `openapi({ method, path })` metadata.
- Implement handlers on `os` for public procedures and `authed` for signed-in ones. `authed` runs `requireAuth`, which throws `UNAUTHORIZED` without a session and puts `context.user` in context.
- Scope every query on user data to `context.user.id`. Treat another user's resource as missing: throw `NOT_FOUND`, not `FORBIDDEN`.
- Throw `ORPCError` with a standard code (`NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`) for expected failures. Its `message` and `data` reach the client, so keep secrets and internals out of them.
- The initial context is `{ db, session }`, supplied by `apps/web/src/lib/server/api.ts`. This package never reads env vars.
- `apps/web` calls procedures in-process from remote functions and serves them over HTTP at `/api`, with the reference UI there and the spec at `/api/spec.json`.
