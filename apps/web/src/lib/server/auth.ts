import { createAuth } from "@app/api/auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { ENV } from "varlock/env";
import { getRequestEvent } from "$app/server";
import { db } from "./db.ts";

export const auth = createAuth({
  allowedHosts: ENV.BETTER_AUTH_ALLOWED_HOSTS.split(",").filter(Boolean),
  db,
  // Lets auth.api calls in remote functions set the session cookie.
  plugins: [sveltekitCookies(getRequestEvent)],
  secret: ENV.BETTER_AUTH_SECRET,
});
