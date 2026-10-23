import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import { array } from "valibot";

import { createNoteSchema, noteSchema } from "./schema.ts";

export const contract = {
  notes: {
    create: oc
      .meta(openapi({ method: "POST", path: "/notes", tags: ["notes"] }))
      .input(createNoteSchema)
      .output(noteSchema),
    list: oc
      .meta(openapi({ method: "GET", path: "/notes", tags: ["notes"] }))
      .output(array(noteSchema)),
  },
};
