import { type RequestEvent, redirect } from "@sveltejs/kit";

// Call it first in the load of each +page.server.ts that needs a signed-in
// user. It sends signed-out visitors to sign in, then back to this page.
// It guards page loads only: remote functions are separate endpoints, so
// private data must come from a procedure that checks the session itself.
export function requireSession({
  locals,
  url,
}: Pick<RequestEvent, "locals" | "url">) {
  if (!locals.session) {
    const redirectTo = `${url.pathname}${url.search}`;
    redirect(303, `/sign-in?${new URLSearchParams({ redirectTo })}`);
  }
  return locals.session;
}
