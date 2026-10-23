import type { Session } from "@app/api/auth";

declare global {
  // biome-ignore lint/style/noNamespace: SvelteKit declares app types in the global App namespace.
  namespace App {
    interface Locals {
      session: Session | null;
    }
  }
}
