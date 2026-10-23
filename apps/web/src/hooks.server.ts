import { type Handle, sequence } from "@sveltejs/kit/hooks";
import { initLogger, toLoggerConfig, toMiddlewareOptions } from "evlog";
import { identifyUser } from "evlog/better-auth";
import { createEvlogHooks } from "evlog/sveltekit";
import { auth } from "#lib/server/auth.ts";
import config from "../evlog.config.ts";

initLogger(toLoggerConfig(config));

// One wide event per request: evlog creates locals.log and emits it when the
// response completes. handleError records only unexpected errors on it.
const evlog = createEvlogHooks(toMiddlewareOptions(config));

// Resolve the session once per request; everything downstream reads
// locals.session instead of asking Better Auth again.
const session: Handle = async ({ event, resolve }) => {
  event.locals.session = await auth.api.getSession({
    headers: event.request.headers,
  });
  if (event.locals.session) {
    identifyUser(event.locals.log, event.locals.session, {
      maskEmail: true,
      session: false,
    });
  }
  return resolve(event);
};

export const handle = sequence(evlog.handle, session);
export const { handleError } = evlog;
