// scripts/db/rebaseline-migrations.ts
//
// Repairs the drizzle migration ledger.
//
// Background: drizzle.config.ts had no `out`, so drizzle-kit defaulted to
// ./drizzle while db:generate wrote to ./drizzle/migrations. For over a year
// `drizzle-kit migrate` read ./drizzle — an abandoned introspection dump of one
// empty migration and one commented-out file — reported success, and applied
// nothing, while every real migration sat unread. The schema was kept current
// with db:push instead, so it drifted away from the migrations describing it.
//
// The config now sets `out` explicitly. This script fixes the other half: the
// ledger has no record of the real migrations, so without it migrate would try
// to replay all of them against an already-populated database.
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

// Record only up to and including this migration. Without it every journal
// entry is recorded.
//
// Needed because a database can be part-way along: production's schema is
// current through 0017 but genuinely has not run the tenancy migrations, so
// those must execute rather than be marked done.
const throughIndex = args.indexOf("--through");
const throughTag = throughIndex >= 0 ? args[throughIndex + 1] : null;

/**
 * What each migration introduces, so the safety check can be scoped to the
 * range actually being recorded.
 *
 * Only the migrations that add something worth asserting on appear here. A
 * migration absent from this map is recorded without a schema assertion — the
 * checkpoints around it are what make the range safe.
 */
const CHECKPOINTS: Record<string, { tables?: string[]; columns?: [string, string][] }> = {
  // The original schema, whichever migration laid it down
  "0000_fancy_lilith": {
    tables: ["user", "booking", "address", "service", "cleaner_profile", "payment"],
  },
  "0012_striped_thor": { tables: ["cleaner_application"] },
  "0017_add_coupons": {
    tables: ["coupon", "coupon_usage"],
    columns: [["booking", "coupon_id"]],
  },
  "0018_add_tenancy": {
    tables: ["tenant", "tenant_member"],
    columns: [
      ["booking", "tenant_id"],
      ["cleaner_profile", "tenant_id"],
      ["cleaner_application", "tenant_id"],
      ["service", "tenant_id"],
      ["pricing_config", "tenant_id"],
    ],
  },
  "0019_add_tenant_payouts": {
    columns: [["payment", "tenant_payout_amount"], ["tenant", "bank_account_number"]],
  },
  "0020_add_tenant_verification": {
    tables: ["tenant_document"],
    columns: [["tenant", "verification_status"]],
  },
};

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
    const allMigrations = readJournalMigrations();

    // Narrow to the range being recorded, if --through was given
    let migrations = allMigrations;
    if (throughTag) {
      const cut = allMigrations.findIndex((m: any) => m.tag === throughTag);
      if (cut === -1) {
        console.error(`REFUSING — no migration named "${throughTag}" in the journal.`);
        process.exit(1);
      }
      migrations = allMigrations.slice(0, cut + 1);
      console.log(`Recording through ${throughTag} (${migrations.length} of ${allMigrations.length} migrations).`);
      console.log(`The remaining ${allMigrations.length - migrations.length} will be left for drizzle-kit migrate to apply.\n`);
    }

    // --- Safety check, scoped to what is actually being recorded ---
    const tables: any[] = await sql`
      select table_name from information_schema.tables where table_schema = 'public'`;
    const present = new Set(tables.map((t) => t.table_name));
    const cols: any[] = await sql`
      select table_name, column_name from information_schema.columns where table_schema = 'public'`;
    const colSet = new Set(cols.map((c) => `${c.table_name}.${c.column_name}`));

    const missingTables: string[] = [];
    const missingCols: string[] = [];
    for (const migration of migrations) {
      const checkpoint = CHECKPOINTS[migration.tag];
      if (!checkpoint) continue;
      for (const t of checkpoint.tables ?? []) {
        if (!present.has(t)) missingTables.push(`${t} (from ${migration.tag})`);
      }
      for (const [t, c] of checkpoint.columns ?? []) {
        if (!colSet.has(`${t}.${c}`)) missingCols.push(`${t}.${c} (from ${migration.tag})`);
      }
    }

    if (missingTables.length || missingCols.length) {
      console.error("REFUSING to rebaseline — this database has not actually run everything you are asking to record.");
      if (missingTables.length) console.error("  missing tables:  " + missingTables.join(", "));
      if (missingCols.length) console.error("  missing columns: " + missingCols.join(", "));
      console.error("\nEither run those migrations properly, or use --through <tag> to record only");
      console.error("the range this database has genuinely applied.");
      process.exit(1);
    }
    console.log("Schema check passed — everything this would mark as applied exists.\n");

    await sql`create schema if not exists drizzle`;
    await sql`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )`;

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
