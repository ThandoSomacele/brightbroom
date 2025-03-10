// src/lib/server/auth.ts
import { Lucia } from "lucia";
import { dev } from "$app/environment";
import { prisma } from "./prisma";
import { createPrismaAdapter } from "./prismaAdapter";

// Setup custom Prisma adapter that works with Prisma 6
const adapter = createPrismaAdapter(prisma);

// Create the auth object
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // Set secure to true in production
      secure: !dev
    }
  },
  getUserAttributes: (userData) => {
    return {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role
    };
  }
});

// Declare global namespace for Lucia types
declare global {
  namespace Lucia {
    type Auth = typeof lucia;
    type DatabaseUserAttributes = {
      email: string;
      firstName: string;
      lastName: string;
      role: "CUSTOMER" | "CLEANER" | "ADMIN";
    };
    type DatabaseSessionAttributes = {};
  }
}
