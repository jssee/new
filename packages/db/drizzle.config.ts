import { defineConfig } from "drizzle-kit";

// The db:* scripts run drizzle-kit through `varlock run`, which loads
// DATABASE_URL from apps/web/.env.schema.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Run drizzle-kit through a db:* script."
  );
}

export default defineConfig({
  dbCredentials: { url },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema/index.ts",
});
