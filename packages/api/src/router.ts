import type { Db } from "@app/db";
import { implement } from "@orpc/server";
import type { Session } from "./auth.ts";

import { contract } from "./contract.ts";

// The app resolves the session once per request and passes it in with the db.
const os = implement(contract).$context<{
  db: Db;
  session: Session | null;
}>();

export const router = os.router({
  health: os.health.handler(() => "OK"),
});
