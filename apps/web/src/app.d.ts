import type { Session } from "@app/api/auth";
import type { AuditableLogger } from "evlog";

declare global {
  // biome-ignore lint/style/noNamespace: SvelteKit declares app types in the global App namespace.
  namespace App {
    interface Locals {
      log: AuditableLogger;
      session: Session | null;
    }
  }
}
