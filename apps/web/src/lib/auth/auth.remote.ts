import { invalid, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import {
  email as isEmail,
  minLength,
  nonEmpty,
  object,
  pipe,
  string,
  trim,
} from "valibot";
import { auth } from "#lib/server/auth.ts";
import { form, getRequestEvent, query } from "$app/server";

const emailField = pipe(
  string(),
  trim(),
  isEmail("Enter a valid email address.")
);

// SvelteKit never sends fields starting with _ back to the browser.
const signInSchema = object({
  _password: pipe(string(), nonEmpty("Enter your password.")),
  email: emailField,
});

const signUpSchema = object({
  // 8 is Better Auth's default minimum password length.
  _password: pipe(string(), minLength(8, "Use at least 8 characters.")),
  email: emailField,
  name: pipe(string(), trim(), nonEmpty("Enter your name.")),
});

export const getUser = query(() => {
  const user = getRequestEvent().locals.session?.user;
  return user ? { email: user.email, name: user.name } : null;
});

export const signIn = form(signInSchema, async ({ _password, email }) => {
  await callAuth((headers) =>
    auth.api.signInEmail({ body: { email, password: _password }, headers })
  );
  redirect(303, "/");
});

export const signUp = form(signUpSchema, async ({ _password, email, name }) => {
  await callAuth((headers) =>
    auth.api.signUpEmail({
      body: { email, name, password: _password },
      headers,
    })
  );
  redirect(303, "/");
});

export const signOut = form(async () => {
  await auth.api.signOut({ headers: getRequestEvent().request.headers });
  redirect(303, "/");
});

// Passes the request headers, which Better Auth needs to resolve the base URL
// from the host. It reports expected failures, such as a wrong password or a
// taken email, as APIErrors; show those on the form and let anything else throw.
async function callAuth(call: (headers: Headers) => Promise<unknown>) {
  try {
    await call(getRequestEvent().request.headers);
  } catch (error) {
    if (error instanceof APIError) {
      invalid(error.message);
    }
    throw error;
  }
}
