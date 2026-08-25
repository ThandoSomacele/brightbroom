import { defineConfig } from "drizzle-kit";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",

  // Must match the --out that db:generate passes. Without this drizzle-kit
  // defaults to ./drizzle, where an abandoned introspection dump lives (one
  // empty migration and one that is entirely commented out). `drizzle-kit
  // migrate` read that folder for over a year, reported success, and applied
  // nothing — while every real migration sat unread in ./drizzle/migrations.
  out: "./drizzle/migrations",

  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  verbose: true,
  strict: true,
  dialect: "postgresql",
});
