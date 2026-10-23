// Read by the Better Auth CLI (`bun run auth:schema`) to generate the auth
// tables in packages/db. Generating never connects to the database.
import { createDb } from "@app/db";

import { createAuth } from "./src/auth.ts";

export const auth = createAuth({
  allowedHosts: ["localhost"],
  db: createDb("postgresql://localhost/unused"),
  secret: "unused-because-generating-never-signs-anything",
});
