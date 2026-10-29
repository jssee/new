# packages/api

The API decides: contracts, authorization and product behavior. The web app calls it in-process from remote functions and serves the same router over HTTP at `/api`.

## Adding a procedure

Work in this order:

1. **Schema** (`src/schema.ts`): valibot input and output schemas. They are public shapes; map Drizzle rows onto them instead of exposing row types, so a schema change never changes the API.
2. **Contract** (`src/contract.ts`): every procedure declares `.meta(openapi({ method, path }))` and `.output(...)`, plus `.input(...)` when it takes one.
3. **Router** (`src/router.ts`): implement it with `os.<name>.handler(...)`.

A `GET` procedure has no side effects: browsers send cookies on top-level GET navigations.

The path `/logs` is reserved: `/api/logs` is the web app's browser-log endpoint, which takes precedence over the API.

Split a crowded file into `src/schemas/`, `src/contracts/` and `src/routers/`, and keep the `exports` in `package.json` pointing at their entry points.

## Context

Every procedure receives `Context`, declared once in `src/router.ts`: evlog's `EvlogOrpcContext` (the request's wide event as `log`) plus `db`. The web app builds it per request in `apps/web/src/lib/server/api.ts`; a new field changes both.

The logging middleware is applied once, to the whole router. Applying it to a procedure as well makes oRPC run it twice. Add fields to the event with `context.log.set(...)`.

## Errors

- For a failure the caller can cause, throw `ORPCError` with a standard code, such as `NOT_FOUND` or `BAD_REQUEST`. `expectedError` in `src/errors.ts` is the one definition of expected: a code that maps to a 4xx status. These log at `warn` and reach the caller with their status.
- Let everything else throw. It logs at `error` and the caller gets a 500.
- Never put secrets, tokens or personal data in an error's `message` or `data`; callers see both.
