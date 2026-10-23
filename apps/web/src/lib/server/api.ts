import { router } from "@app/api";
import { createRouterClient } from "@orpc/server";
import { getRequestEvent } from "$app/server";
import { db } from "./db.ts";

// The API's initial context for the current request. The OpenAPI endpoint
// passes it too, so both ways in share the session and the request's log event.
export const context = () => {
  const { locals } = getRequestEvent();
  return { db, log: locals.log, session: locals.session };
};

// Calls procedures in-process. Use it only from remote functions (*.remote.ts).
export const api = createRouterClient(router, { context });
