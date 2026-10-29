import type { Db } from "@myapp/db";
import { implement } from "@orpc/server";
import type { EvlogOrpcContext } from "evlog/orpc";
import { contract } from "./contract.ts";
import { logging } from "./middleware/logging.ts";

/** What every procedure receives. The web app builds it once per request. */
export type Context = EvlogOrpcContext & { db: Db };

const os = implement(contract).$context<Context>();

// Logging is applied here, once, at the router. Applying it to a procedure as
// well would make oRPC run it twice.
export const router = os.use(logging).router({
  health: os.health.handler(() => "OK" as const),
});
