import type { ClientInit, HandleClientError } from "@sveltejs/kit/hooks";
import { initLog, log } from "evlog/client";
import { dev } from "$app/env";

// Sends browser warnings and errors to /api/logs, which adds them to the
// server's request log. evlog's Vite plugin would inject this through
// index.html, which SvelteKit never renders, so it lives here.
export const init: ClientInit = () => {
  initLog({
    minLevel: "warn",
    pretty: dev,
    service: "web-client",
    transport: { enabled: true, endpoint: "/api/logs" },
  });
};

// Errors thrown while rendering or navigating in the browser. Expected ones,
// such as error(...) and 404s, already show up as the page's status.
export const handleError: HandleClientError = ({ error, event, kind }) => {
  if (kind === "unknown") {
    log.error({ error, path: event.url.pathname });
  }
};
