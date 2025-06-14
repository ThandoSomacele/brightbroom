// src/app.d.ts
import type { Session, User } from "$lib/server/db/schema";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
      // Add Auth.js session support
      getSession(): Promise<Session | null>;
    }
  }
}

export {};
