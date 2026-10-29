import { api } from "#lib/server/api.ts";
import { query } from "$app/server";

export const health = query(() => api.health());
