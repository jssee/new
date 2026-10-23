// Seeds a local database with a user that people and agents can sign in as.
// db:migrate runs it after migrating a local database, so it must stay safe to
// run again.
import { hashPassword } from "better-auth/crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { account, user } from "../src/schema/index.ts";

export const DEV_USER = {
  email: "dev@example.com",
  id: "dev-user",
  name: "Dev User",
  password: "password",
};

export async function seed(db: NodePgDatabase) {
  const { email, id, name, password } = DEV_USER;
  await db
    .insert(user)
    .values({ email, emailVerified: true, id, name })
    .onConflictDoNothing();
  // Better Auth stores email/password logins as a "credential" account.
  await db
    .insert(account)
    .values({
      accountId: id,
      id,
      password: await hashPassword(password),
      providerId: "credential",
      userId: id,
    })
    .onConflictDoNothing();
}
