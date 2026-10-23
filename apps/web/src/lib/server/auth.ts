import { createAuth } from "@app/auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { ENV } from "varlock/env";
import { getRequestEvent } from "$app/server";

export const auth = createAuth({
  allowedHosts: ENV.BETTER_AUTH_ALLOWED_HOSTS.split(","),
  databaseUrl: ENV.DATABASE_URL,
  // Lets auth.api calls in remote functions set the session cookie.
  plugins: [sveltekitCookies(getRequestEvent)],
  secret: ENV.BETTER_AUTH_SECRET,
});
