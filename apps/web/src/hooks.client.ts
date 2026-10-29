import type { ClientInit, HandleClientError } from "@sveltejs/kit/hooks";
import { initLog, log } from "evlog/client";
import { dev } from "$app/env";

export const init: ClientInit = () => {
  initLog({
    minLevel: "warn",
    pretty: dev,
    service: "myapp-web-client",
    transport: { enabled: true, endpoint: "/api/logs" },
  });
};

// Sees only errors SvelteKit catches (load, render, navigation). Errors thrown
// in event handlers and unhandled rejections never reach this hook.
export const handleError: HandleClientError = ({ error, event, kind }) => {
  if (kind === "unknown") {
    log.error({
      // /api/logs accepts only an error object; a thrown string would get the
      // whole event rejected.
      error: error instanceof Error ? error : new Error(String(error)),
      path: event.url.pathname,
    });
  }
};
