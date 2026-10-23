import { createNoteSchema } from "@app/api/schema";
import { api } from "#lib/server/api.ts";
import { form, query } from "$app/server";

export const getNotes = query(() => api.notes.list());

// The contract's input schema validates the form too, so the API's rules and
// messages show up as field issues before the procedure runs.
export const createNote = form(createNoteSchema, async (input) => {
  await api.notes.create(input);
  await getNotes().refresh();
});
