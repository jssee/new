import type { Session } from "@app/auth";
import type { Db } from "@app/db";
import { note } from "@app/db/schema";
import { implement, ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";

import { contract } from "./contract.ts";

// The app resolves the session once per request and passes it in with the db.
const os = implement(contract).$context<{
  db: Db;
  session: Session | null;
}>();

const requireAuth = os.middleware(({ context, next }) => {
  if (!context.session) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({ context: { user: context.session.user } });
});

const authed = os.use(requireAuth);

export const router = os.router({
  notes: {
    create: authed.notes.create.handler(async ({ context, input }) => {
      const [created] = await context.db
        .insert(note)
        .values({ body: input.body, userId: context.user.id })
        .returning();
      if (!created) {
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }
      return created;
    }),
    list: authed.notes.list.handler(({ context }) =>
      context.db
        .select()
        .from(note)
        .where(eq(note.userId, context.user.id))
        .orderBy(desc(note.createdAt))
    ),
  },
});
