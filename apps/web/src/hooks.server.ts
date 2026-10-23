import type { Handle } from "@sveltejs/kit/hooks";
import { auth } from "#lib/server/auth.ts";

// Resolve the session once per request; everything downstream reads
// locals.session instead of asking Better Auth again.
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.session = await auth.api.getSession({
    headers: event.request.headers,
  });
  return resolve(event);
};
