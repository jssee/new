---
name: sveltekit-starter
description: Build or audit a Bun + SvelteKit + oRPC + Drizzle monorepo that is deployed on Vercel and safe for several agents working in parallel worktrees. Use when starting a project from scratch, or when checking that a project made from the template still meets these rules.
---

# SvelteKit Monorepo Starter

You should be able to run this checklist from top to bottom, whether you are an agent or a human. Each phase lists the decisions already made, the gotchas, and a **Check** that shows the phase works. The gotchas come from earlier builds of this template; skipping them reintroduces real bugs.

`myapp` is the placeholder project name throughout. Keep it until Phase 10, which renames it.

Use the current stable version of every tool unless this file pins it. Pins and minimum versions are there for a reason, and each one says what it is.

## Principles

1. **Web adapts; API decides.** `apps/web` owns routing, rendering, form UX, and transport. `packages/api` owns contracts, authorization, and product behavior. `packages/db` owns the schema, migrations, and the client factory.
2. **Enforce boundaries with lint, not prose.** Whenever an `AGENTS.md` rule can be expressed as a Biome rule, it is.
3. **One command verifies everything.** `bun run check` runs lint, format, types, and the env audit. CI runs that same command.
4. **Every checkout is isolated.** The main checkout and each linked git worktree get their own dev URL and their own database, with no setup step beyond `bun run setup`.
5. **One decision, one place.** Configuration is declared once in `apps/web/.env.schema` and passed into packages explicitly. Packages never read env.
6. **No orchestrator.** Plain `bun run --cwd` / `--filter`; no Turborepo. With one app and two packages, a task cache adds config without saving any time.

## Decisions

| Concern | Choice |
|---|---|
| Runtime / package manager | Bun, pinned with `packageManager`; deploy runtime is Node (`nodejs24.x` on Vercel) |
| Web | SvelteKit (runes forced on), Tailwind, shadcn-svelte, remote functions |
| API | oRPC 2 (beta; every `@orpc/*` pinned exactly to one version, because 1.x lacks the APIs used here), contract-first, valibot schemas, OpenAPI handler at `/api` |
| Database | Postgres 18 (Debian image) via Docker Compose on OrbStack; Drizzle ORM |
| Schema workflow | `db:push` while iterating; generate one migration per branch before merge, then rehearse it |
| Env | varlock (`.env.schema`, generated types, audit, secret scan) |
| Logging | evlog: one wide event per request, browser warnings and errors forwarded |
| Lint / format | Biome via Ultracite (minimum 8) |
| Hooks | Lefthook: secret scan + `ultracite fix` on staged files |
| Dev URLs | portless (`myapp.localhost`, `<branch>.myapp.localhost`) |
| Deploy | Vercel via git integration; CI migrates production after merge |
| Auth | Optional (Phase 7): Better Auth, email + password |

---

## Phase 1: Workspace

- Root `package.json`:
  - `private: true`, `type: module`.
  - `workspaces.packages: ["apps/*", "packages/*"]`.
  - `workspaces.catalog` for any version shared by two or more workspaces.
  - `packageManager: "bun@<current>"`. Bun doesn't enforce it, so make sure the local `bun --version` matches. CI installs exactly this version, and `--frozen-lockfile` fails on a lockfile written by a different Bun.
  - The catalog can start as `{}`; later phases fill it.
- Root devDependencies: `ultracite` and `@biomejs/biome` (exact), `lefthook`, `typescript` (6.x until svelte-check's peer range allows 7), and `@types/node` matching the deploy runtime's major (24 for `nodejs24.x`).
- Pin prerelease dependencies exactly in the catalog (for example `"@orpc/server": "2.0.0-beta.45"`). A caret on a prerelease floats to the next breaking beta.
- Biome via Ultracite, both pinned exactly as root devDependencies:
  - `biome.jsonc` extends `["ultracite/biome/core", "ultracite/biome/svelte"]`.
  - Add only overrides you can justify. Don't restate preset rules, and don't turn off Svelte unused-variable checks: the Svelte preset sees template usage.
- TypeScript:
  - A root `tsconfig.base.json`, strict, with `noUncheckedIndexedAccess` and `types: ["node"]`.
  - Packages extend it by relative path (`../../tsconfig.base.json`). Don't create a workspace package just to hold one JSON file.
  - A root `tsconfig.json` with `"files": []` and `"include": ["scripts"]`. Without `files`, `tsc` fails with TS18003 whenever `scripts/` is empty, which is the case before Phase 10 and again after rename deletes its script.
- Lefthook `pre-commit`. Write `lefthook.yml` **before** adding `lefthook`; if the config doesn't exist yet, its postinstall writes an example config and installs no hook.
  - Job `fix`: `bunx ultracite fix {staged_files}` with `stage_fixed: true`. Its glob is an explicit list of every extension Biome handles: `js, jsx, ts, tsx, mjs, cjs, mts, cts, json, jsonc, css, scss, html, svelte, vue, astro, md, yaml, yml, graphql, gql, grit`.
  - The secret-scan job comes in Phase 3.
  - Don't add a `prepare` script. Lefthook's postinstall installs the hooks, and Bun trusts it by default.
- Root scripts:
  - `check`: `ultracite check && tsc --noEmit -p tsconfig.json && bun run --elide-lines=0 --filter './apps/*' --filter './packages/*' check`
  - `fix`: `ultracite fix`
  - `build`: `bun run --cwd apps/web build`
  - `setup` comes in Phase 4. Add the other scripts as later phases need them, always `bun run --cwd <dir> <script>`.
- `.gitignore`: `node_modules`, `.svelte-kit`, `.vercel`, `build`, `dist`, `*.tsbuildinfo`, `.DS_Store`, `*.log`, `.env` and `.env.*` with `!.env.schema`. Don't ignore `.env*`, because that also ignores `.envrc`.

Gotchas:
- Keep `--elide-lines=0`. Some Bun versions keep only the last 10 lines of each filtered script's output, which hides failures.
- Ultracite 7 turns off `noUndeclaredDependencies`. Phase 5's boundaries depend on that rule, so use 8 or newer.

**Check:** `ultracite check` and `tsc --noEmit -p tsconfig.json` pass. The full `bun run check` fails with "No workspace packages matched" until Phase 2 adds a workspace; that's expected, so don't add `--if-present`, which would hide a workspace that lost its `check` script. A badly formatted `.ts` file and a badly formatted `.css` file both come out fixed after `git commit`.

## Phase 2: Web app

- Scaffold `apps/web` with `bunx sv create`: SvelteKit minimal, TypeScript, Tailwind, Vercel adapter.
  - Name it `@myapp/web`.
  - SvelteKit 3's scaffold already sets up `#lib/*` imports (there is no `$lib`), keeps the config in `vite.config.ts`, and forces runes. `#lib/*` resolves exact files only, so import `#lib/components/ui/button/index.js`, not the directory.
  - Delete the files `sv` adds that the root already owns: `apps/web/.gitignore` (it would ignore Phase 3's `.env.schema`), `.npmrc`, `.vscode/` and `README.md`.
- Add to the SvelteKit config in `vite.config.ts`:
  - `adapter({ runtime: "nodejs24.x" })`
  - `experimental.remoteFunctions: true`
  - `compilerOptions.experimental.async: true`
  - Replace the scaffold's runes regex with `({ filename }) => filename.includes("node_modules") ? undefined : true`; Ultracite's `useTopLevelRegex` rejects the inline regex.
- Ultracite flags two scaffold files: `app.d.ts` (`noNamespace`, which SvelteKit's type augmentation needs) and `app.html` (`useBaseline` on `display: contents`). Suppress each inline with a reason.
- `apps/web/tsconfig.json` extends the generated config and adds `noUncheckedIndexedAccess`, so web is as strict as the packages.
- Its `check` script runs `svelte-kit sync && svelte-check`.
- Dev through portless:
  - Root devDependency `portless`, pinned.
  - In web's package.json: `"dev": "portless"`, `"dev:vite": "vite dev"`, and `"portless": { "name": "myapp", "script": "dev:vite" }`.
  - Root `dev`: `bun run --cwd apps/web dev`.
- shadcn-svelte: `bunx shadcn-svelte@latest init`, then add only `button`, `input`, `label`, `textarea` with `add --yes <names>`. Without `--yes` and without a terminal, `add` stops at its confirm prompt and exits 0 having installed nothing.
  - `--preset` takes a preset code, not a name, and init still prompts once before rewriting `layout.css`, with no `--yes`. Without a TTY it exits halfway, so agents run it under `script -q /dev/null …`.
  - The CLI owns `src/lib/components/ui/**` and `src/lib/utils.ts`. Turn the linter and assist off for them in one Biome override, placed last so it wins: lint findings there could only be fixed by hand-editing generated code. The formatter stays on; run `bun run fix` after the CLI.
  - Never hand-edit those files.
- Root `vercel.json`: one service `web`, with root `apps/web`, framework `sveltekit`, `installCommand: "cd ../.. && bun install"`, and a rewrite of `/(.*)` to that service.
- Root `.vercelignore`: excludes every `.env` file except `.env.schema`.

Gotchas:
- Don't run dev through `--filter` or an orchestrator. Piped output swallows stdin, so Vite's keyboard shortcuts stop working.
- Portless serves https but forwards http to Vite. Code that compares the request's protocol or origin to the page's will always see a mismatch locally. Compare hosts instead.
- Agents can't start the portless proxy themselves, because it needs sudo for port 443. A human runs `bunx portless service install` once per machine.
- A fresh worktree needs `bun install` before `bun run dev`. That install also re-points the shared git hook at the new worktree, which is harmless.
- Vercel Services is in beta. If an import doesn't pick up `vercel.json`'s service, set the project's root directory to `apps/web` instead.

**Check:**
- `bun run dev` serves `https://myapp.localhost`.
- In a linked worktree on branch `feat/x`, it serves `https://x.myapp.localhost`.
- `bun run check` passes.

## Phase 3: Environment

- `apps/web/.env.schema` is the single source of truth. Dependencies, all through the catalog:
  - `varlock` in web's `dependencies` (the app imports `varlock/env` at runtime) and in the root's devDependencies, so the hook's `bunx varlock` resolves the pinned copy instead of fetching the latest.
  - `@varlock/vite-integration` in web's devDependencies.
- Root decorators:
  - `@defaultSensitive=true`
  - `@generateTsTypes(path=./src/env.d.ts, processEnv=none, importMetaEnv=none)`
  - `@encryptInjectedEnv=$VERCEL`
- Every item says `@required` or `@optional` explicitly.
- `VERCEL=false`, marked `@required @internal @type=boolean @sensitive=false`. It gates local-only defaults.
- Until Phase 4 adds a non-internal item, every Vite load warns "No config items defined". Ignore it.
- Vite: `varlockVitePlugin({ ssrInjectMode: "resolved-env" })`.
- App code reads `ENV` from `varlock/env`, never `process.env`. Enforce it with a Biome override on `apps/web/src/**` that turns `style/noProcessEnv` on (Ultracite leaves it off). Phase 5 bans SvelteKit's `$env/*` modules the same way.
- Ignore the generated `src/env.d.ts` in git.
- Web's `check`: `varlock codegen && varlock audit -i .svelte-kit -i .vercel && svelte-kit sync && svelte-check …`
- Web's `env:check`: `varlock load --agent`. Root `env:check` calls it.
- Lefthook job `secrets`: `bunx varlock scan --path apps/web/ {staged_files}`. It blocks commits that contain a sensitive value.

Gotchas:
- A local default that shells out should be a pure computation, such as git plus a script. It must not need a running service, because CI builds evaluate it too.
- Gate local defaults on `$VERCEL` only, not on `$CI`. CI's `bun run build` needs `@required` values to resolve.
- Quote paths inside `exec(...)`. A checkout path with a space breaks an unquoted path.
- `varlock audit` fails on declared-but-unused items. Declare an item in the same change that reads it.

**Check:**
- `bun run env:check` passes.
- Add a scratch sensitive item to `.env.schema` and give it a value in `apps/web/.env.local`. Committing a file that contains that value is rejected. (With no sensitive items, the scan has nothing to look for and always passes.) Remove both afterwards.
- Reading an undeclared var fails `bun run check`.

## Phase 4: Database

- `packages/db` (`@myapp/db`):
  - `"exports": { ".": "./src/index.ts", "./schema": "./src/schema/index.ts" }`. Use explicit entries; a `./*` wildcard can't resolve a directory index.
  - `src/index.ts` exports `createDb(databaseUrl)`, a plain factory with no memoization, returning `drizzle(databaseUrl, { schema })` from `drizzle-orm/node-postgres`. It also exports `type Db = ReturnType<typeof createDb>`. `import * as schema` needs an inline suppression of `noNamespaceImport`, with a reason.
  - `src/schema/index.ts` starts as `export {};`.
  - A `check` script (`tsc --noEmit -p tsconfig.json`). Bun's `--filter` silently skips a workspace without one.
  - devDependencies: `drizzle-kit`, `@types/pg`, `varlock` (catalog).
  - Extend the Phase 3 `noProcessEnv` override to `packages/*/src/**`. Only scripts and `drizzle.config.ts` read env.
  - Biome override for `packages/db/src/schema/**`: turn off the `assist.actions.source.useSortedKeys` assist action (it's an assist, not a lint rule), or `bun run fix` alphabetizes every table's columns, and Drizzle creates columns in key order.
  - `schema/index.ts` re-exports each table file with `export *`, which needs an inline suppression of `noBarrelFile`, with a reason.
  - The web app owns the one pool (Phase 5).
- Drizzle config: `schema: "./src/schema/index.ts"`, `out: "./migrations"`.
  - Biome's linter, formatter and assist are off for `packages/db/migrations/**`.
  - Run `db:generate` once against the empty schema and commit the resulting `migrations/meta/_journal.json` (no entries), so CI's migrate has something to read before the first migration exists.
- Postgres:
  - `packages/db/docker-compose.yml` with `name: myapp`, `POSTGRES_PASSWORD: postgres`, image `postgres:18` (Debian, not alpine), volume at `/var/lib/postgresql` (the Postgres 18+ layout), and **no published port**.
  - OrbStack serves it at `postgres.myapp.orb.local`, so projects made from this template never compete for 5432.
  - Healthcheck: `pg_isready -h 127.0.0.1 -U postgres` with `start_period: 30s` and `start_interval: 1s` (Compose rejects `start_interval` without `start_period`). On first start the image initializes through a socket-only server; checking over TCP waits until the real server is up.
- `scripts/local.ts` with four commands: `url`, `ensure`, `reset`, `prune`. Resolve its own location with `fileURLToPath(import.meta.url)`, not `URL.pathname`, which percent-encodes spaces in the checkout path.
  - **`url`** prints this checkout's `DATABASE_URL`.
    - The prefix comes from the root `package.json` name, turned into an identifier: lowercase, runs of non-alphanumerics → `_`, trimmed.
    - Main checkout: `<prefix>`.
    - Linked worktree on a branch: `<prefix>_<slug>`, where the slug is the branch's **last** path segment, sanitized the same way. This matches portless's URL naming.
    - If the name exceeds 63 bytes, cut it short and append a 6-character hash of the full branch name.
    - Detect a linked worktree by comparing `git rev-parse --absolute-git-dir` with `--path-format=absolute --git-common-dir`.
  - **`ensure`**: if `$DATABASE_URL` points at the local server, run `docker compose up --detach --wait`, then `CREATE DATABASE` if the database is missing. For any other host, do nothing.
  - **`reset`**: refuse unless `$DATABASE_URL` is local, then drop and recreate that database.
  - **`prune`**: drop `<prefix>_*` databases that no live worktree maps to.
    - Read `git worktree list --porcelain`, skip entries marked `prunable`, and take each name from its `branch` line.
    - Never spawn a process inside another worktree's directory.
- `.env.schema`:
  ```
  # @required @type=url(allowedProtocols=[postgresql, postgres])
  DATABASE_URL=if($VERCEL, "", exec(`bun "$(git rev-parse --show-toplevel)/packages/db/scripts/local.ts" url`))
  ```
- Db scripts run through `varlock run --inject vars --path ../../apps/web/ --filter=DATABASE_URL -- …`. The filter means an unrelated broken env item can't block database work.
  - `db:push`, `db:migrate` and `db:studio` run `ensure` first. `db:push` also refuses a non-local URL.
  - `db:generate` doesn't.
  - `db:prune` and `db:stop` don't need env, so they skip varlock.
  - Web's `varlock audit` also scans `../../packages/db`. Until Phase 5, packages/db is the only reader of `DATABASE_URL`, and without that scan the audit reports it unused.
- `db:rehearse` is the step before merge. It runs `local.ts reset`, then `drizzle-kit migrate`. This way, the migration SQL has run locally before production runs it.
- Root `setup`: `bun install && bun run db:push`. It must be idempotent.

Gotchas:
- **Detached HEAD in a linked worktree** (rebase, bisect, `worktree add --detach`): portless's naming falls back to the main checkout here, and the database must not. `url` returns `<prefix>_detached_<6-char hash of the worktree path>`. It doesn't exit with an error, because every varlock load evaluates `url`, and an error would break `check` and `dev` mid-rebase. `prune` refuses while any worktree is detached, because porcelain output then has no branch line to tell which database belongs to it.
- Take the slug from the git branch, not by parsing the portless hostname. In a branch like `feat/myapp`, the project name appears twice in the hostname, and slicing at the first match maps the worktree to the main database.
- `postgres://` is as common as `postgresql://` from hosted providers, so accept both.
- Never point `drizzle-kit push` at a deployed database.
- `myapp` is shared by every unrenamed copy of this template, and by anything else whose Compose project is named `myapp`. Starting this one recreates the other's container on a new volume, and its `prune` would drop the other's databases. If another copy runs on the machine, rename (Phase 10) before the first `bun run setup`.
- A failed `drizzle-kit migrate` can exit 1 with no message. Check that the URL connects (for example with `psql`) before suspecting the SQL.
- Generate migrations only after rebasing onto `main`. Two branches that both generate `0001_*` conflict in `_journal.json`.

**Check:**
- In a fresh linked worktree, `bun run setup` creates `myapp_<slug>`, and running it a second time does nothing.
- In a detached worktree, `bun run db:push` targets `myapp_detached_<hash>`, never `myapp`, and `bun run db:prune` refuses.
- After you delete a worktree directory without `git worktree prune`, `bun run db:prune` still runs.
- `db:rehearse` applies a generated migration to an empty database.

## Phase 5: API

- `packages/api` (`@myapp/api`):
  - `exports`: `"."` (router), `"./schema"`, `"./errors"`.
  - Dependencies: `@myapp/db`, `@orpc/contract`, `@orpc/openapi`, `@orpc/server`, `evlog` (its context type is public), `valibot`. Types are `node`. Add a `check` script.
  - Web adds `@myapp/api`, `@myapp/db`, `@orpc/openapi`, `@orpc/server` and `@orpc/valibot`. Biome's `noUndeclaredDependencies` makes each workspace declare what it imports.
  - Files: `src/schema.ts` (valibot input and output schemas, which are public shapes, never Drizzle row types), `src/contract.ts` (`oc.meta(openapi({ method, path }))`, `.input`, `.output` on every procedure), and `src/router.ts` (`implement(contract).$context<Context>()`).
- `Context` is declared once in `router.ts`: `EvlogOrpcContext & { db: Db }`. Phase 7 adds `session`.
- In `router.ts`: `const os = implement(contract).$context<Context>()`, procedures from `os.<name>.handler(…)`, and `export const router = os.use(logging).router({ … })`.
- Ship one procedure, `health` (`GET /health` → `"OK"`, no input), and keep it.
- Errors (`src/errors.ts`): `expectedError(error)` returns `{ code, message, status }` for an `ORPCError` whose code maps to a 4xx status (oRPC's `COMMON_ERROR_STATUS_MAP`), and returns `undefined` for anything else. This is the single definition of "expected".
- Logging middleware (`src/middleware/logging.ts`) replaces `evlog/orpc`'s `evlog()`:
  - Typed with `os.$context<EvlogOrpcContext>().middleware(…)` (`os` from `@orpc/server`), so it fits any context that has `log`.
  - Sets `operation`.
  - Records expected errors with `log.warn(message, { expectedError: { code, status } })`, never under `error`: during SSR several procedures write to the page's one event, and evlog merges objects under the same key.
  - Records anything else with `log.error(error)`. SvelteKit's `handleError` later gets the same `Error` instance, and evlog merges repeated `log.error` calls into one field, so it lands once. Don't wrap or replace the error between the procedure and SvelteKit.
  - Apply it once with `os.use(logging)`; oRPC runs middleware twice when a procedure also applies it.
- Web side:
  - `apps/web/src/lib/server/db.ts`: `export const db = createDb(ENV.DATABASE_URL)`.
  - `apps/web/src/lib/server/api.ts`:
    - A single `context()` that returns `{ db, log: locals.log }` from `getRequestEvent()`.
    - `api = createRouterClient(router, { context, interceptors: [...] })`. The interceptor rethrows `expectedError` as SvelteKit `error(status, message)`.
  - `apps/web/src/routes/api/[...rest]/+server.ts`:
    - `OpenAPIHandler` with `OpenAPIReferenceHandlerPlugin({ spec: () => generator.generate(router, …) })` and a single `const prefix = "/api"`. The plugin's defaults put the UI at `/api` and the spec at `/api/spec.json`.
    - Build `generator` with `new OpenAPIGenerator({ converters: [new ValibotToJsonSchemaConverter()] })`. Valibot has no built-in JSON Schema, so without the converter every schema comes out as `{}`.
    - Uses the same `context` and answers 404 when nothing matches.
    - Exports **every** method: `DELETE`, `GET`, `PATCH`, `POST`, `PUT`.
  - One live example: `src/lib/health.remote.ts` (`query(() => api.health())`), rendered on `+page.svelte` inside `<svelte:boundary>` with pending and failed (Retry) states. The server renders the pending state, so `OK` shows only in a browser, not to `curl`.
- Biome `noRestrictedImports`, in order:
  1. On `apps/web/**`: ban `@myapp/db`, `@myapp/db/*` and `**/server/db*` (message: "reach the database through the API"). Also ban `@myapp/api` and `**/server/api*` (message: "call procedures only from remote functions").
  2. On `apps/web/**/*.remote.ts` and `apps/web/src/routes/api/**`: ban only the db group.
  3. On `lib/server/api.ts` and `lib/server/db.ts`: rule off.
  - Every group list on `apps/web/**` also bans `$env/**` ("read config from `varlock/env`"). Biome's `*` doesn't cross `/`, so `$env/*` lets `$env/static/private` through. A later override replaces the earlier pattern list instead of merging with it, so repeat that group in each list.

Gotchas:
- SvelteKit answers any error that isn't its own `HttpError` with a 500 and reports it to `handleError` as unexpected. Without the interceptor, a procedure's `NOT_FOUND` reaches the browser as "Internal Error".
- A route that exports only `GET` answers 405 for the first POST procedure.
- The HTTP API uses the browser's cookies (after Phase 7). GET procedures must have no side effects, because Lax cookies ride along on top-level GET navigations.
- A remote function's expected error reaches the browser as an `HttpError` with its status, but the remote function's own HTTP response is 200, so the wide event says `status: 200` at `warn`. The `expectedError` field is what to search on.
- During SSR, a `<svelte:boundary>` that catches a 404 `HttpError` still makes the whole page 404. Phase 7's guards rely on loads, not on boundaries, for this reason.
- Don't use `types: ["bun"]` in packages that deploy to Node. Bun APIs would type-check and then crash on Vercel.

**Check:**
- The home page shows `OK`.
- `GET /api/health` returns `"OK"`, and `/api` renders the reference.
- A scratch POST procedure answers 200 over HTTP, not 405.
- A scratch procedure that throws `ORPCError("NOT_FOUND")`, called from a remote function, gives the browser a 404 and logs at `warn`.
- Importing `#lib/server/db.ts` in a `+page.server.ts`, or `@myapp/api` in a component, fails `bun run check`.
- Delete the scratch code afterwards.

## Phase 6: Logging

- evlog, minimum 2.33 (earlier versions don't serialize nested errors on the client), and valibot. Both go in the catalog, since Phase 5 uses them too, and in web's `dependencies`.
- Declare `log: AuditableLogger` (from `evlog`) on `App.Locals` in `app.d.ts`. Phase 5's `EvlogOrpcContext` needs `audit`, so `RequestLogger` is too narrow.
- SvelteKit 3 renamed some modules: `dev` comes from `$app/env` (there is no `$app/environment`), and hook types come from `@sveltejs/kit/hooks`.
- `apps/web/evlog.config.ts`: `defineEvlog({ service: "myapp-web" })`. All evlog options (sampling, enrich, drain) go here. With no drain, events go to the console, which Vercel captures.
- `hooks.server.ts`:
  - `initLogger(toLoggerConfig(config))`.
  - `const evlog = createEvlogHooks(toMiddlewareOptions(config))`.
  - `export const { handle, handleError } = evlog`. Ultracite's `useDestructuring` rejects `const handle = evlog.handle`. Phase 7 switches `handle` to `sequence(evlog.handle, …)`.
  - evlog's `handleError` records any `Error` instance. In SvelteKit 3, expected and framework errors arrive as plain objects, so in practice it records only unexpected errors.
- `hooks.client.ts`:
  - `init` calls `initLog({ minLevel: "warn", pretty: dev, service: "myapp-web-client", transport: { enabled: true, endpoint: "/api/logs" } })`.
  - `handleError` logs `kind === "unknown"` errors with `{ error, path }`. Wrap non-Errors first (`error instanceof Error ? error : new Error(String(error))`): evlog sends a thrown string as `error: "x"`, which fails the endpoint's schema and loses the event.
- `routes/api/logs/+server.ts` (it takes precedence over the API catch-all), `POST` only:
  - **Origin:**
    - If `Sec-Fetch-Site` is present, it must be `same-origin`.
    - Otherwise, if `Origin` is present, its host must equal `url.host`.
    - Otherwise accept, since the request comes from a non-browser client.
    - Return 403 on failure.
  - **Schema:** it must match evlog's client wire format, which is **flat**: `level` (`warn | error | fatal`, required), `timestamp` (required), and optional `message`, `tag`, `action`, `path`, `error: { name, message, stack }`.
    - Ignore the client's `service` and identity fields; the server decides those.
    - Truncate long strings instead of rejecting the event: 200 characters for short fields, 2,000 for messages, 10,000 for stacks.
    - Use named valibot imports. Ultracite's `noNamespaceImport` rejects `import * as v`.
    - Respond 204 on success.
    - Valibot `object()` drops unknown keys, so a schema that doesn't match the wire format silently empties every event.
  - **Recording:** set the level, then put the parsed fields under `client`, plus `source: "browser"`. Never spread the body onto the event.
  - **Invalid body:** respond 400, recorded at `warn` with `client: { outcome: "rejected", reasonCode: "invalid_payload" }`.
- Write `docs/OBSERVABILITY.md` covering:
  - Event ownership: one wide event per request, owned by the hooks.
  - What procedures add, and expected vs unexpected errors.
  - Client logs and the origin rule.
  - The data policy: no secrets, tokens or full emails; identities are ids only.
  - That there is no drain until the project picks a backend.

Gotchas:
- Don't name the service through `evlog/vite`'s plugin. It uses a Vite `define` that never applies to evlog inside `node_modules` on Vercel, so production logs say `service: "app"`.
- Logging from the client `handleError` during a load triggers SvelteKit's dev-only `window_fetch_in_load` warning. It's harmless.
- Client `handleError` sees only errors SvelteKit catches (load, render, navigation). Errors thrown in event handlers and unhandled rejections don't reach it, so don't claim they do.
- If an evlog route filter skips a path, `locals.log` is undefined there. Never filter SvelteKit routes that read it.

**Check** (use a scratch page with a button that calls `log` from `evlog/client`, and delete it afterwards):
- `log.error(new Error("boom"))` in the browser shows up in the dev server's request event with `client.error.message === "boom"`.
- A `curl` POST with `Origin: https://evil.example` gets 403.
- An oversized message is truncated, not rejected.
- `service` reads `myapp-web` in `bun run build && bun run --cwd apps/web preview` output.

## Phase 7 (optional): Auth

- Better Auth, email and password.
  - `better-auth` in the catalog, used by api, web, and db (dev, for the seed).
  - `packages/api/src/auth.ts` exports `createAuth({ allowedHosts, db, plugins, secret })`, built on `better-auth/minimal` and the adapter from `better-auth/adapters/drizzle`. Web passes `plugins: [sveltekitCookies(getRequestEvent)]`, without which remote forms can't set the session cookie.
  - It also exports `type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]`.
  - Declare product plugins inside `createAuth`. Plugins passed in from outside don't show up in `Session`.
- Generate the schema with the Better Auth CLI into `packages/db/src/schema/auth.ts`, then format it. It's generated, so exclude it from lint.
  - The CLI is now the `auth` package (`bunx auth@<better-auth version> generate`). It needs an exported instance, so point it at web's `lib/server/auth.ts` and run it under `varlock run` so `ENV` resolves. Put the exact command in the commit message, since the CLI isn't a dependency.
  - Then `db:generate` the migration. If the branch is rebased later, regenerate it.
- Env:
  - `BETTER_AUTH_SECRET`: `@required @type=string(minLength=32)`. Locally it defaults to `cache(randomHex(64))`; on Vercel it's empty, so a missing secret fails the deploy.
  - `BETTER_AUTH_ALLOWED_HOSTS`: built from `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_BRANCH_URL` and `VERCEL_URL` on Vercel. Declare those three as `@optional @internal`. Locally it's `localhost,localhost:*,*.localhost,*.localhost:*`: hosts are matched with their port, so without the port forms `vite preview` and `PORTLESS=0` answer 500 on every page.
- `apps/web/src/lib/server/auth.ts` creates the instance from `ENV` and the shared `db`.
  - Add it to the Biome server-wiring override.
  - Restrict it like `server/db*` everywhere except remote functions and hooks. That needs separate pattern lists for remote functions, `routes/api/**` and `hooks.server.ts`, plus an exemption for `app.d.ts`'s `Session` type import.
- `hooks.server.ts`:
  - A `session` handle resolves `auth.api.getSession` once into `locals.session`.
  - It calls `identifyUser(log, session, { fields: ["id"], session: false })`. Without `session: false` it still logs the IP and user agent.
  - `handle = sequence(evlog.handle, session)`.
  - Add `session` to the API `context`.
- Pages:
  - `/sign-in` and `/sign-up` are one route, `(auth)/[authtype=authtype]`, with a picklist param matcher. In SvelteKit 3, matchers live in `src/params.ts` (`defineParams`). Its load redirects signed-in visitors.
  - Forms are remote `form`s. `_password` fields are never echoed back. Better Auth's `APIError` becomes `invalid(message)`.
  - Protected pages call `requireSession(event)` in their own `+page.server.ts` load, not in a layout.
  - Remote functions check the session themselves, because loads don't protect them.
- Redirect targets go through `sanitizeRedirect`. Accept only paths that start with `/`, reject `//` and `/\`, and compare origins after parsing.
- API: an `authed` middleware in `router.ts` that throws `UNAUTHORIZED` and narrows `context.user`. Scope queries by `context.user.id`, and return `NOT_FOUND` rather than `FORBIDDEN`. Ship one procedure that uses it (`GET /account`), so it's type-checked.
- `db:push` and `db:migrate` against a local database seed `dev@example.com` / `password` idempotently (`setup` runs `db:push`, so seeding only on migrate misses it). They never seed a remote database.

Gotchas:
- **`auth.api.*` called on the server skips Better Auth's rate limiter.** Posting to Better Auth's own handler would break the remote-form design, so the remote forms limit themselves: 10 attempts per client address per minute. The template counts in memory, and each Vercel instance counts separately, so **move the counter to a shared store (Redis, the database) before launch.**
- `identifyUser`'s default fields include name and image. Logging only the id keeps PII out of every event.

**Check:**
- Sign up, sign out and sign in work.
- `/account` redirects to `/sign-in?redirectTo=/account` when signed out.
- `?redirectTo=//evil.example` lands on `/`.
- The 11th rapid wrong-password attempt is throttled.

## Phase 8: CI

`.github/workflows/ci.yml`:

- **Triggers and concurrency:**
  - `on: pull_request` and `push: branches: [main]`.
  - `permissions: contents: read`.
  - Workflow `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: ${{ github.ref != 'refs/heads/main' }} }`. This alone serializes main, so the migrate job needs no group of its own.
- **Shared steps** (both jobs, `runs-on: ubuntu-latest`): `actions/checkout`, `oven-sh/setup-bun` (it reads `packageManager` by default), `actions/cache` on `~/.bun/install/cache` keyed by `hashFiles('bun.lock')`, `bun install --frozen-lockfile`. Use each action's current major tag; pin to SHAs if your policy requires it.
- **Job `check`** (`timeout-minutes: 15`): `bun run check`, then `bun run build`.
- **Job `migrate`** (`timeout-minutes: 10`):
  - `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`, `needs: check`.
  - A step-level `if` can't read `secrets`, and a step's own `env` isn't visible to its `if`. So one step (with the secret in its `env`) writes `set=${DATABASE_URL:+true}` to `$GITHUB_OUTPUT`. A warning step runs when that output isn't `true`, and the `bun run db:migrate` step runs when it is.
  - Give `DATABASE_URL` only to those two steps, not the job, so `bun install`'s lifecycle scripts never see the production URL.

Gotchas:
- Vercel deploys on the same push, while `migrate` waits for `check`. New code can go live before its column exists, which is one more reason migrations must be expand-only (Phase 9).
- Validate locally with `actionlint`, and with `act` if you have Docker.

**Check:**
- A PR runs `check`, and pushing again cancels the older run.
- A merge with no secret shows the migrate step skipped with a warning.

## Phase 9: Deploy (Vercel)

- Import the repo in Vercel (or `bunx vercel link` from the repo root). `vercel.json` already sets the root, framework and install command.
- Generate a separate `_VARLOCK_ENV_KEY` for preview and for production:
  `bunx varlock generate-key --plain | bunx vercel env add _VARLOCK_ENV_KEY <env> --sensitive`
  (If you did Phase 7, do the same for `BETTER_AUTH_SECRET`.)
- `DATABASE_URL` is `@required`, so every Vercel environment needs one, previews included, or the build fails.
  - Previews need their own database (or a provider branch per preview). CI migrates only production, so apply a branch's migrations to the preview database yourself (`DATABASE_URL=<preview> bun run db:migrate`), or use a provider that branches from production. This is an open decision for each project.
  - On Vercel, use the provider's **pooled** (transaction-mode) URL, because serverless instances otherwise exhaust connections.
  - As the GitHub secret for CI migrations, use the **direct** URL. Migrations through a transaction pooler can break session-level statements.
- Migrations run in CI alongside the deploy, never at build time. They must be **expand-only**: add columns and tables before code depends on them, and remove them in a later change.

**Check:**
- The preview deploy builds.
- `/api/health` answers `"OK"` on the preview URL.
- The function logs show `service: "myapp-web"`.

## Phase 10: Agent docs, README, rename

- **Root `AGENTS.md`:** the principles above, in rule form:
  - Architecture, and which Biome rule enforces each part.
  - "A new feature is a procedure plus a remote function".
  - Env rules: read `ENV` from `varlock/env`; never set `DATABASE_URL` in `.env.local`, or worktrees share one database; never print secrets, use `bun run env:check`.
  - Dev server: `bun run setup` first; portless; the human-only `portless service install`; `PORTLESS=0 bun run dev` as the fallback.
  - Verification: `bun run check` must pass; never skip hooks unless told to.
  - Extend the layer that already owns a concern; don't add tests for what TypeScript guarantees.
  - The pointer to `docs/OBSERVABILITY.md`.
- **`apps/web/AGENTS.md`:**
  - Remote functions are thin adapters that call one procedure.
  - Add shadcn components with `bunx shadcn-svelte@latest add <name>`, and never hand-edit `ui/`.
  - Use design tokens.
  - The auth rules, if you did Phase 7.
- **`packages/api/AGENTS.md`:**
  - Order: schema → contract → router.
  - Every procedure declares `.output` and `openapi({ method, path })`.
  - The context shape.
  - Expected errors are `ORPCError` with standard codes; never put secrets in `message` or `data`.
  - Don't expose Drizzle row types.
  - Split files into `schemas/`, `contracts/` and `routers/` once one file gets crowded.
  - `/api/logs` is reserved.
- **`packages/db/AGENTS.md`:**
  - Only `packages/api` queries the database.
  - The web app owns the one pool.
  - `db:push` while iterating.
  - Before merge: rebase, `db:generate`, `db:rehearse`, commit the SQL.
  - Never edit a committed migration.
  - Expand-only changes.
  - With Phase 7: the seed must stay safe to rerun.
- **`README.md`:**
  - The stack.
  - Quick start: rename (between `<!-- rename:start -->` and `<!-- rename:end -->` markers; everything about renaming stays inside them, and steps aren't numbered across them), `bun run setup`, `bunx portless service install`, `bun run dev`.
  - A command table and the layout.
  - Deploy (Phase 9).
  - A **"Don't have OrbStack?"** section: on Docker Desktop or Linux, add `ports: ["127.0.0.1:5432:5432"]` to the compose service and change the server host in `scripts/local.ts` to `localhost`. Bind to 127.0.0.1, never all interfaces, because the credentials are `postgres`/`postgres`.
- **`scripts/rename.ts <name>`:**
  - Validate with `/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/` (Ultracite's `useNamedCaptureGroup` rejects a plain capture group). That accepts only strict kebab-case, which is valid as a hostname label, npm scope and Compose project.
  - Replace `myapp` in every tracked file except STARTER.md. The placeholder is unique, so a plain `replaceAll` is safe.
  - Remove the README's rename block.
  - Delete the script itself.
  - Run `bun install` and then `bun run fix`, because the new scope can sort imports differently.

Gotchas:
- Any name derived from the project name (database prefix, Compose project, service name) must be computed from one source, not written as a separate literal that rename has to keep in sync. A hyphenated name, for example, becomes `my_project` as a database prefix.
- The same applies to docs: don't write derived names like `myapp_x` in prose. A plain `replaceAll` would turn it into `my-project_x`, which is wrong. Describe the rule instead.
- After renaming, the README must not mention the rename script.
- Rename leaves STARTER.md alone. It describes the template, placeholder included, and stays in derived projects as their design notes; rewriting it turns its instructions into nonsense.

**Check:**
- In a scratch clone, `bun scripts/rename.ts my-project` leaves `bun run check` passing.
- Commit the rename in the clone, then run `bun run setup`: it creates Compose project `my-project` and database `my_project`. A linked worktree on `feat/scratch` gets `my_project_scratch`, and after you delete that worktree's directory, `bun run db:prune` drops it. Remove the clone's container, volume and network afterwards.
- `rg myapp -g '!STARTER.md'` finds nothing.

## Optional: Amp orbs

Orbs are Linux sandboxes, not OrbStack. Use the "Don't have OrbStack?" setup in them.

- `.agents/setup`: install the pinned Bun, run `bun install --frozen-lockfile`, `portless trust`, and `portless service install`, then enable Docker and run `bun run setup`.
- `.amp/services.yaml`: run `PORTLESS_APP_PORT="$PORT" bun run dev` as service `web`.
- Vite: set `server.allowedHosts` to true only when `AMP_ORB` is set.
