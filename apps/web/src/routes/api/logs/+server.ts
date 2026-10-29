import {
  object,
  optional,
  picklist,
  pipe,
  safeParse,
  string,
  transform,
} from "valibot";
import type { RequestHandler } from "./$types";

/** A string cut to `max` characters, so one long field can't sink the event. */
const text = (max: number) =>
  pipe(
    string(),
    transform((value) => value.slice(0, max))
  );

// evlog's browser transport posts each event flat, as `initLog` in
// hooks.client.ts builds it. `object()` drops unknown keys, so a field missing
// here is silently missing from the log.
const ClientEvent = object({
  action: optional(text(200)),
  error: optional(
    object({
      message: optional(text(2000)),
      name: optional(text(200)),
      stack: optional(text(10_000)),
    })
  ),
  level: picklist(["warn", "error", "fatal"]),
  message: optional(text(2000)),
  path: optional(text(2000)),
  tag: optional(text(200)),
  timestamp: text(64),
});

/**
 * Browsers say where a request comes from; reject any that isn't this site.
 * Requests without either header come from non-browser clients, which could
 * forge them anyway.
 */
function isSameOrigin(request: Request, url: URL) {
  const site = request.headers.get("sec-fetch-site");
  if (site !== null) {
    return site === "same-origin";
  }
  const origin = request.headers.get("origin");
  if (origin !== null) {
    // Compare hosts, not origins: portless serves https but forwards http.
    return URL.parse(origin)?.host === url.host;
  }
  return true;
}

export const POST: RequestHandler = async ({ locals, request, url }) => {
  if (!isSameOrigin(request, url)) {
    return new Response(null, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => undefined);
  const result = safeParse(ClientEvent, body);
  if (!result.success) {
    locals.log.setLevel("warn");
    locals.log.set({
      client: { outcome: "rejected", reasonCode: "invalid_payload" },
    });
    return new Response(null, { status: 400 });
  }

  const { level, ...client } = result.output;
  locals.log.setLevel(level);
  locals.log.set({ client, source: "browser" });
  return new Response(null, { status: 204 });
};
