import { drizzle } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: Drizzle takes the whole schema.
import * as schema from "./schema/index.ts";

// The app owns configuration and passes the connection string in; this
// package never reads env vars at runtime.
export const createDb = (databaseUrl: string) =>
  drizzle(databaseUrl, { schema });

export type Db = ReturnType<typeof createDb>;
