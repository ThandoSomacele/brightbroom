// scripts/db/rebaseline-migrations.ts
//
// Repairs the drizzle migration ledger.
//
// Background: this database's schema has been maintained with `db:push` since
// April 2025. The ledger (drizzle.__drizzle_migrations) still holds only six
// rows, and none of them match any migration file currently on disk — the
// migration set was rewritten at some point. `drizzle-kit migrate` therefore
// tries to replay every migration from 0000 against a fully populated
// database, fails on the first CREATE TABLE, and netlify/scripts/deploy-db.sh
// swallows the error because it does not use `set -e`.
//
// This script records every migration in the journal as already applied, so
// migrate becomes a no-op now and applies only genuinely new migrations later.
//
// SAFETY: it refuses to run unless the schema it is about to mark as "applied"
// is actually present. On a fresh or partial database the migrations must
// really run, and silently marking them done would leave it broken forever.

import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

const MIGRATIONS_FOLDER = "drizzle/migrations";
const args = process.argv.slice(2);
const apply = args.includes("--apply");

// Schema that must exist before we may declare the migrations applied.
const REQUIRED_TABLES = [
  "user", "booking", "address", "service", "cleaner_profile",
  "cleaner_application", "payment", "coupon", "coupon_usage",
  "tenant", "tenant_member",
];
const REQUIRED_COLUMNS: [string, string][] = [
  ["booking", "tenant_id"],
  ["cleaner_profile", "tenant_id"],
  ["cleaner_application", "tenant_id"],
  ["service", "tenant_id"],
  ["pricing_config", "tenant_id"],
  ["booking", "coupon_id"],
];

function readJournalMigrations() {
  const journal = JSON.parse(
    fs.readFileSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`).toString(),
  );
  return journal.entries.map((entry: any) => {
    const file = `${MIGRATIONS_FOLDER}/${entry.tag}.sql`;
    if (!fs.existsSync(file)) {
      throw new Error(`Journal references ${entry.tag} but ${file} is missing`);
    }
    const query = fs.readFileSync(file).toString();
    return {
      tag: entry.tag,
      when: entry.when,
      // Must match drizzle-orm's readMigrationFiles: sha256 of the raw file
      hash: crypto.createHash("sha256").update(query).digest("hex"),
    };
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: "require" });
  console.log(`Database: ${new URL(process.env.DATABASE_URL).host}\n`);

  try {
    // --- Safety check: is the schema actually there? ---
    const tables: any[] = await sql`
      select table_name from information_schema.tables where table_schema = 'public'`;
    const present = new Set(tables.map((t) => t.table_name));
    const missingTables = REQUIRED_TABLES.filter((t) => !present.has(t));

    const cols: any[] = await sql`
      select table_name, column_name from information_schema.columns where table_schema = 'public'`;
    const colSet = new Set(cols.map((c) => `${c.table_name}.${c.column_name}`));
    const missingCols = REQUIRED_COLUMNS
      .filter(([t, c]) => !colSet.has(`${t}.${c}`))
      .map(([t, c]) => `${t}.${c}`);

    if (missingTables.length || missingCols.length) {
      console.error("REFUSING to rebaseline — this database is not fully migrated.");
      if (missingTables.length) console.error("  missing tables:  " + missingTables.join(", "));
      if (missingCols.length) console.error("  missing columns: " + missingCols.join(", "));
      console.error("\nRun the migrations properly against this database instead.");
      process.exit(1);
    }
    console.log("Schema check passed — every table and column this would mark as applied exists.\n");

    await sql`create schema if not exists drizzle`;
    await sql`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )`;

    const migrations = readJournalMigrations();
    const applied: any[] = await sql`select hash from drizzle.__drizzle_migrations`;
    const appliedHashes = new Set(applied.map((r) => r.hash));
    const toRecord = migrations.filter((m: any) => !appliedHashes.has(m.hash));

    console.log(`journal migrations : ${migrations.length}`);
    console.log(`already recorded   : ${migrations.length - toRecord.length}`);
    console.log(`to record          : ${toRecord.length}\n`);

    if (toRecord.length === 0) {
      console.log("Ledger already in sync. Nothing to do.");
      await sql.end();
      return;
    }
    toRecord.forEach((m: any) => console.log(`  + ${m.tag}`));

    if (!apply) {
      console.log("\nDry run. Re-run with --apply to write these rows.");
      await sql.end();
      return;
    }

    for (const m of toRecord) {
      await sql`
        insert into drizzle.__drizzle_migrations (hash, created_at)
        values (${m.hash}, ${m.when})`;
    }
    console.log(`\nRecorded ${toRecord.length} migrations. \`drizzle-kit migrate\` is now a no-op here.`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
