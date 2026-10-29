import { type Context, router } from "@myapp/api";
import { expectedError } from "@myapp/api/errors";
import { createRouterClient } from "@orpc/server";
import { error } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";
import { db } from "./db.ts";

/** The context for the current request, shared by `api` and the HTTP API. */
export const context = (): Context => ({
  db,
  log: getRequestEvent().locals.log,
});

/** Calls procedures in-process. Use it only from remote functions. */
export const api = createRouterClient(router, {
  context,
  interceptors: [
    async ({ next }) => {
      try {
        return await next();
      } catch (cause) {
        // SvelteKit treats anything but its own HttpError as a 500, so pass
        // expected errors on with their real status.
        const expected = expectedError(cause);
        if (expected) {
          error(expected.status, expected.message);
        }
        throw cause;
      }
    },
  ],
});
