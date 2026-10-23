import { createDb } from "@app/db";
import { ENV } from "varlock/env";

// The app's one database client. Server code passes it to the packages that
// need it rather than letting them connect themselves.
export const db = createDb(ENV.DATABASE_URL);
