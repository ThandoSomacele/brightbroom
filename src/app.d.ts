// src/app.d.ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, User } from "lucia";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    interface PageData {
      user: User | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
