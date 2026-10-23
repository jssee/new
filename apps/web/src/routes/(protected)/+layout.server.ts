import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

// Sends signed-out visitors to sign in. This only guards page navigation:
// remote functions are separate endpoints and must check the session themselves.
export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.session) {
    redirect(303, "/sign-in");
  }
};
