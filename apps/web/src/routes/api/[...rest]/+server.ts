import { router } from "@app/api";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { ValibotToJsonSchemaConverter } from "@orpc/valibot";
import { context } from "#lib/server/api.ts";
import type { RequestHandler } from "./$types";

// Serves the API over HTTP for external clients, with the reference UI at
// /api and the spec at /api/spec.json. The web app itself calls procedures
// in-process from remote functions instead.
const prefix = "/api";

const generator = new OpenAPIGenerator({
  converters: [new ValibotToJsonSchemaConverter()],
});

const handler = new OpenAPIHandler(router, {
  plugins: [
    new OpenAPIReferenceHandlerPlugin({
      spec: () =>
        generator.generate(router, {
          base: {
            info: { title: "API", version: "1.0.0" },
            servers: [{ url: prefix }],
          },
        }),
    }),
  ],
});

const handle: RequestHandler = async ({ request }) => {
  const { response } = await handler.handle(request, { context, prefix });
  return response ?? new Response("Not found", { status: 404 });
};

export const DELETE = handle;
export const GET = handle;
export const PATCH = handle;
export const POST = handle;
export const PUT = handle;
