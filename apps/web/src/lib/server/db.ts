import { createDb } from "@app/db";
import { ENV } from "varlock/env";

// One pool for the process, shared by Better Auth and the API. Only those two
// receive it; Biome blocks importing it anywhere else in the web app.
export const db = createDb(ENV.DATABASE_URL);
