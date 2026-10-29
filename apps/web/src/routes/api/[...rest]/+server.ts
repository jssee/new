import { router } from "@myapp/api";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { ValibotToJsonSchemaConverter } from "@orpc/valibot";
import { context } from "#lib/server/api.ts";
import type { RequestHandler } from "./$types";

const prefix = "/api";

const generator = new OpenAPIGenerator({
  converters: [new ValibotToJsonSchemaConverter()],
});

const handler = new OpenAPIHandler(router, {
  plugins: [
    // The reference UI at /api, the spec at /api/spec.json.
    new OpenAPIReferenceHandlerPlugin({
      spec: () =>
        generator.generate(router, {
          base: {
            info: { title: "myapp", version: "0.0.1" },
            servers: [{ url: prefix }],
          },
        }),
    }),
  ],
});

const handle: RequestHandler = async ({ request }) => {
  const { response } = await handler.handle(request, {
    context: context(),
    prefix,
  });
  return response ?? new Response("Not Found", { status: 404 });
};

// Every method, so a procedure is never answered 405 for its method.
export const DELETE = handle;
export const GET = handle;
export const PATCH = handle;
export const POST = handle;
export const PUT = handle;
