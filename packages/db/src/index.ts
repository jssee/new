import { drizzle } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: drizzle takes the whole schema as one object.
import * as schema from "./schema/index.ts";

// Each call opens a new pool. The web app calls this once and owns the result.
export const createDb = (databaseUrl: string) =>
  drizzle(databaseUrl, { schema });

export type Db = ReturnType<typeof createDb>;
