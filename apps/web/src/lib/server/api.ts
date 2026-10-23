import { router } from "@app/api";
import { createRouterClient } from "@orpc/server";
import { getRequestEvent } from "$app/server";
import { db } from "./db.ts";

// The API's initial context for the current request. The OpenAPI endpoint
// passes it too, so both ways in see the same session.
export const context = () => ({
  db,
  session: getRequestEvent().locals.session,
});

// Calls procedures in-process. Use it only from remote functions (*.remote.ts).
export const api = createRouterClient(router, { context });
