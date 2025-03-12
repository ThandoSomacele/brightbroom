// src/lib/server/auth.ts
import { dev } from "$app/environment";
import { Lucia } from "lucia";
import { adapter } from "./lucia-adapter";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: (userData) => {
    return {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
    };
  }
});

// Helper function
export function generateUserId(): string {
  return crypto.randomUUID();
}

// Declare types for Lucia
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      firstName: string;
      lastName: string;
      role: "CUSTOMER" | "CLEANER" | "ADMIN";
    };
  }
}
