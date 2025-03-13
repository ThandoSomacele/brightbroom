import { postgres as postgresAdapter } from "@lucia-auth/adapter-postgresql";
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import postgres from "postgres";

// Direct connection to PostgreSQL
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://root:mysecretpassword@localhost:5432/local";
const sql = postgres(connectionString);

export const auth = lucia({
  adapter: postgresAdapter(sql, {
    user: "user",
    session: "user_session",
  }),
  env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
  middleware: sveltekit(),
  getUserAttributes: (data) => {
    return {
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
    };
  },
});

export type Auth = typeof auth;

// For Typescript
declare global {
  namespace App {
    interface Locals {
      auth: Auth;
    }
  }
}

declare module "lucia" {
  interface Register {
    Lucia: typeof auth;
    DatabaseUserAttributes: {
      email: string;
      first_name: string;
      last_name: string;
      role: "CUSTOMER" | "CLEANER" | "ADMIN";
    };
  }
}
