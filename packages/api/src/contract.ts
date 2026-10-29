import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import { HealthOutput } from "./schema.ts";

export const contract = {
  health: oc
    .meta(openapi({ method: "GET", path: "/health" }))
    .output(HealthOutput),
};
