import type { Db } from "@app/db";
import { implement } from "@orpc/server";
import { type EvlogOrpcContext, evlog } from "evlog/orpc";

import type { Session } from "./auth.ts";
import { contract } from "./contract.ts";

// The app passes these in per request: its db pool, the session it resolved,
// and its request logger as `log`, so procedures enrich the app's wide event.
const os = implement(contract).$context<
  EvlogOrpcContext & { db: Db; session: Session | null }
>();

// evlog() names the procedure on the event and records thrown errors. Apply it
// only here: oRPC runs middleware twice when a procedure also uses it.
export const router = os.use(evlog()).router({
  health: os.health.handler(() => "OK"),
});
