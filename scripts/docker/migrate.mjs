// scripts/docker/migrate.mjs
//
// Applies ./drizzle/fresh to DATABASE_URL at container start (scripts/docker/start.sh).
// Same migrations, same ledger (drizzle.__drizzle_migrations) as
// `pnpm db:fresh:migrate`, but through drizzle-orm's migrator so the runtime
// image needs no TypeScript config loading. Already-applied migrations are
// skipped, so every restart after the first is a no-op.
//
// Self-hosted client databases only; never the demo's (see drizzle.fresh.config.ts).
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
  const started = Date.now();
  await migrate(drizzle(client), { migrationsFolder: "./drizzle/fresh" });
  console.log(`[migrate] database is up to date (${Date.now() - started}ms)`);
} catch (error) {
  console.error("[migrate] failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
