import { defineConfig } from "drizzle-kit";

// The db:* scripts inject DATABASE_URL from apps/web/.env.schema via varlock.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Run drizzle-kit through `bun run db:*`."
  );
}

export default defineConfig({
  dbCredentials: { url },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema/index.ts",
});
