import type { Db } from "@app/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";

interface AuthOptions {
  // Hosts the app is served from. Better Auth builds its URLs from the
  // request's host when it matches one, so every worktree and portal works.
  allowedHosts: string[];
  db: Db;
  // Framework adapters, such as sveltekitCookies; keep it last.
  plugins?: BetterAuthOptions["plugins"];
  secret: string;
}

export const createAuth = ({
  allowedHosts,
  db,
  plugins = [],
  secret,
}: AuthOptions) =>
  betterAuth({
    baseURL: { allowedHosts },
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: { enabled: true },
    plugins,
    secret,
  });

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
