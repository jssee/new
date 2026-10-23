# Database Package Rules

- This package owns the Drizzle schema, migrations, and `createDb()`. It never reads env vars at runtime; the app passes `DATABASE_URL` in.
- Change tables in `src/schema/` and export them from `src/schema/index.ts`. Then run `bun run db:generate`, read the generated SQL in `migrations/`, and commit it with the schema change. Apply it with `bun run db:migrate`.
- Never edit a migration that has been committed; generate a new one instead. Don't use `drizzle-kit push`.
