import { os } from "@orpc/server";
import type { EvlogOrpcContext } from "evlog/orpc";
import { expectedError } from "../errors.ts";

/**
 * Names the procedure on the request's wide event and records how it failed.
 * It replaces `evlog/orpc`'s `evlog()` so that expected errors land at `warn`
 * instead of `error`.
 */
export const logging = os
  .$context<EvlogOrpcContext>()
  .middleware(async ({ context, next, path }) => {
    context.log.set({ operation: path.join(".") });
    try {
      return await next();
    } catch (error) {
      const expected = expectedError(error);
      if (expected) {
        // Not under `error`: during SSR several procedures share one event,
        // and an expected error must not merge into an unexpected one.
        const { code, message, status } = expected;
        context.log.warn(message, { expectedError: { code, status } });
      } else {
        // Through a remote function, SvelteKit's `handleError` records this
        // same Error again. evlog merges both into the one `error` field.
        context.log.error(
          error instanceof Error ? error : new Error(String(error))
        );
      }
      throw error;
    }
  });
