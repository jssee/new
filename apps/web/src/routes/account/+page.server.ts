import { requireSession } from "#lib/auth/session.server.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
  const { user } = requireSession(event);
  return { user: { email: user.email, name: user.name } };
};
