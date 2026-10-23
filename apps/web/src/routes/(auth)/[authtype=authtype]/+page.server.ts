import { redirect } from "@sveltejs/kit";
import { sanitizeRedirect } from "#lib/auth/redirect.ts";
import type { PageServerLoad } from "./$types";

// Signed-in visitors have nothing to do here; send them where they were going.
export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.session) {
    const redirectTo = url.searchParams.get("redirectTo") ?? undefined;
    redirect(303, sanitizeRedirect(redirectTo, url.origin) ?? "/");
  }
};
