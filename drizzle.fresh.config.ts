// drizzle.fresh.config.ts
//
// Migrations for a BRAND-NEW database only: a self-hosted client deployment
// (see docs/SELF_HOSTING.md). ./drizzle/fresh holds a single baseline generated
// from the current schema plus hand-written seed migrations.
//
// Do NOT point this at the demo's database (brightbroom.com). That one is
// managed by drizzle.config.ts and ./drizzle/migrations, whose history cannot
// build a fresh database (missing 0007, duplicate 0009s, snapshots frozen at
// 0016) and must not be rewritten.
//
// When the schema changes later, ship the change in BOTH places: the usual
// hand-written idempotent migration in ./drizzle/migrations for the demo, and
// `pnpm db:fresh:generate` here for client databases.
import { defineConfig } from "drizzle-kit";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle/fresh",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  dialect: "postgresql",
});
