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

// Receives the browser logger's events from hooks.client.ts. Anyone can post
// here, so treat the body as untrusted: accept only these fields, cap their
// length, and nest them under `client` instead of spreading them onto the
// server's event. This route takes precedence over the API's /api catch-all.

const text = (max: number) =>
  optional(
    pipe(
      string(),
      transform((value) => value.slice(0, max))
    )
  );

const clientLogSchema = object({
  action: text(100),
  error: optional(
    object({ message: text(500), name: text(100), stack: text(4000) })
  ),
  // The client logger only sends warn and above.
  level: picklist(["warn", "error", "fatal"]),
  message: text(500),
  path: text(500),
  tag: text(100),
  timestamp: text(40),
});

export const POST: RequestHandler = async ({ locals, request, url }) => {
  // Compare hosts, not origins: Portless serves https but forwards http, so
  // locally the request URL's protocol never matches the page's.
  const origin = request.headers.get("origin");
  if (origin && URL.parse(origin)?.host !== url.host) {
    return new Response("Forbidden", { status: 403 });
  }

  const result = safeParse(
    clientLogSchema,
    await request.json().catch(() => null)
  );
  if (!result.success) {
    locals.log.setLevel("warn");
    locals.log.set({ client: { outcome: "rejected" } });
    return new Response("Invalid log event", { status: 400 });
  }

  const { level, ...client } = result.output;
  locals.log.setLevel(level);
  locals.log.set({ client });
  return new Response(null, { status: 204 });
};
