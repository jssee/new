import { literal } from "valibot";

// Public input and output shapes. They are the API's contract with callers, so
// they never reuse Drizzle row types: a schema change must not change the API.

export const HealthOutput = literal("OK");
