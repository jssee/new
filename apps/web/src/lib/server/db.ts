import { createDb } from "@myapp/db";
import { ENV } from "varlock/env";

// The app's one connection pool. pg connects lazily, on the first query.
export const db = createDb(ENV.DATABASE_URL);
