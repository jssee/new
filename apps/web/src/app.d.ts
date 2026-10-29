import type { AuditableLogger } from "evlog";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  // biome-ignore lint/style/noNamespace: SvelteKit declares app types by augmenting this global namespace.
  namespace App {
    // interface Error {}
    interface Locals {
      /**
       * This request's wide event, created by evlog's `handle` hook. Its
       * logger has `audit`, which the API's `EvlogOrpcContext` requires.
       */
      log: AuditableLogger;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}
