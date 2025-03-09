// src/lib/server/auth.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

// Expected by Lucia
declare global {
  namespace Lucia {
    type Auth = typeof auth;
    type DatabaseUserAttributes = {
      email: string;
      firstName: string;
      lastName: string;
      role: "CUSTOMER" | "CLEANER" | "ADMIN";
    };
    type DatabaseSessionAttributes = {};
  }
}

export const auth = lucia({
  env: import.meta.env.DEV ? "DEV" : "PROD",
  middleware: sveltekit(),
  adapter: prisma(client),
  
  getUserAttributes: (data) => {
    return {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role
    };
  }
});

export type Auth = typeof auth;
