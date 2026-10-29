# Observability

Logging is [evlog](https://www.evlog.dev). Its options live in one file, `apps/web/evlog.config.ts`, which `hooks.server.ts` passes to both the logger and the request hooks.

## One wide event per request

The evlog `handle` hook in `apps/web/src/hooks.server.ts` owns the event. It opens one wide event per request on `locals.log` and emits it when the response finishes, with the method, path, status, duration, request id and `service: "myapp-web"`.

Code that runs during a request adds fields to that event with `log.set({ ... })` and never emits events of its own. Group fields under a domain key, such as `{ order: { id, total } }`, so events from different features don't collide.

The server `handleError` hook records thrown `Error`s (SvelteKit's `kind: "unknown"`) on the same event at `error`. Errors raised with SvelteKit's `error(status, message)` and framework errors such as an unmatched route's 404 are expected. They aren't recorded, and the event's status already says what happened.

## Procedures

Procedures in `packages/api` get the request's event as `context.log`, because the web app's API `context()` passes `locals.log` through. They add fields with `context.log.set(...)` the same way as any other request code.

A single logging middleware (`packages/api/src/middleware/logging.ts`), applied once to the whole router in `router.ts`, does the rest:

- It sets `operation` to the procedure being called.
- It records **expected** errors at `warn`: the message as a `warn` entry in `requestLogs`, and `expectedError: { code, status }`. An error is expected when `expectedError(error)` from `@myapp/api/errors` returns something: an `ORPCError` whose code maps to a 4xx status, such as `NOT_FOUND` or `UNAUTHORIZED`. The in-process client that remote functions use (`apps/web/src/lib/server/api.ts`) rethrows these as SvelteKit `error(status, message)`, so the browser gets the real status instead of a 500.
- It records anything else as **unexpected** with `log.error`, under `error`. The caller gets a 500. Through a remote function, SvelteKit's `handleError` then records the same `Error` again; evlog merges both calls into the one `error` field, so it appears once.

Two things to know when reading these events:

- A remote function's request is `GET` or `POST /_app/remote/…`, and its `status` is 200 even when the procedure failed. SvelteKit sends a remote function's error inside a 200 response; the error the browser sees carries the real status. Go by `level`, `error` and `expectedError` instead.
- During server rendering, every procedure a page calls writes to that page's event. `operation` names the last one, and an expected error is kept apart from `error` so the two don't merge.

Throw `ORPCError` with a standard code for failures a caller can cause. Let everything else throw.

## Browser logs

`apps/web/src/hooks.client.ts` starts evlog's browser logger at `warn`, with its transport posting to `/api/logs`. Two things reach it:

- `log.warn`, `log.error` and `log.fatal` from `evlog/client`, called anywhere in browser code.
- The client `handleError` hook, which logs `kind: "unknown"` errors with the page path. It only sees errors SvelteKit catches during load, render and navigation. Errors thrown in event handlers and unhandled promise rejections never reach it, so log those explicitly where you catch them.

`apps/web/src/routes/api/logs/+server.ts` records each browser event on its own request's wide event: the browser event's level, its fields under `client`, and `source: "browser"`. The route accepts only evlog's flat wire format (`level`, `message`, `tag`, `action`, `path`, `timestamp`, `error: { name, message, stack }`) and cuts long strings rather than rejecting them. A body that doesn't parse gets a 400 and a `warn` event with `client: { outcome: "rejected", reasonCode: "invalid_payload" }`.

**Origin rule.** A request with `Sec-Fetch-Site` must say `same-origin`. Without it, a request with `Origin` must have this site's host. A request with neither comes from a non-browser client and is accepted, since such a client could forge either header anyway. Anything else gets a 403. Hosts are compared instead of origins because portless serves https locally but forwards http to Vite.

The route isn't authenticated, so treat everything under `client` as untrusted input.

## Data policy

- Never log secrets, tokens, passwords, cookies, session ids or full email addresses.
- Identify people by id only, such as `user: { id }`.
- Don't log request bodies, and never spread an untrusted object onto the event. Pick the fields you need.

evlog redacts common patterns (emails, card numbers, bearer tokens, keys named `*token`, `*secret`, `*password`) in production. That's a backstop, not permission to log them.

## Where events go

Nowhere yet: there is no drain until the project picks a logging backend. Events print to the console, as JSON lines in production and pretty in development, and Vercel captures them in the function logs. To send them somewhere, add a `drain` to `evlog.config.ts`.
