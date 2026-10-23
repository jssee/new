import { date, maxLength, nonEmpty, object, pipe, string, trim } from "valibot";

export const noteSchema = object({
  body: string(),
  createdAt: date(),
  id: string(),
});

// Also validates the web app's note form, so its messages are user-facing.
export const createNoteSchema = object({
  body: pipe(
    string(),
    trim(),
    nonEmpty("Write something first."),
    maxLength(1000, "Keep it under 1,000 characters.")
  ),
});
