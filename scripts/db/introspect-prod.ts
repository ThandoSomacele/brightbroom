// scripts/db/introspect-prod.ts
//
// Read-only audit of a database against this repo's schema and migrations.
// Run it against production before writing or applying any new migration:
//
//   DATABASE_URL_PRODUCTION=postgres://... pnpm db:introspect
//
// (falls back to DATABASE_URL, i.e. the dev database, when the production
// URL is not set — useful for checking the dev DB the same way).
//
// It answers three questions, and changes nothing:
//   1. Which journal migrations does the ledger (drizzle.__drizzle_migrations)
//      say have run here — and are there ledger rows matching no known file?
//   2. Which tables/columns does the live schema have vs schema.ts — both
//      directions, so drift from the db:push era (orphan columns, missing
//      columns) is visible before drizzle-kit migrate runs.
//   3. Do the Postgres enums match schema.ts?
//
// Interpreting the ledger section (see the pivot plan, Phase 0):
//   - ledger current through the last journal entry -> new migrations apply
//     cleanly on the next deploy.
//   - schema present but ledger short -> rebaseline first:
//       pnpm db:migrate:rebaseline --apply --through <last-applied-tag>
//   - schema genuinely missing the newer migrations -> let deploy apply them
//     in order (test against a restored backup first).

import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import postgres from "postgres";
import { is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../../src/lib/server/db/schema";

dotenv.config();

const MIGRATIONS_FOLDER = "drizzle/migrations";

const dbUrl = process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
if (!dbUrl) throw new Error("Set DATABASE_URL_PRODUCTION (or DATABASE_URL)");

const usingProdVar = Boolean(process.env.DATABASE_URL_PRODUCTION);

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
      tag: entry.tag as string,
      // Must match drizzle-orm's readMigrationFiles: sha256 of the raw file
      hash: crypto.createHash("sha256").update(query).digest("hex"),
    };
  });
}

function schemaTables() {
  return Object.values(schema)
    .filter((v): v is PgTable => is(v, PgTable))
    .map((t) => getTableConfig(t));
}

// pgEnum() returns a callable (it builds columns), so it is a function with
// enumName/enumValues attached — not a plain object.
function schemaEnums() {
  return Object.values(schema).filter(
    (v: any) =>
      v &&
      (typeof v === "function" || typeof v === "object") &&
      "enumName" in v &&
      "enumValues" in v,
  ) as { enumName: string; enumValues: string[] }[];
}

async function main() {
  const host = new URL(dbUrl!).host;
  // A restored backup in local Docker has no TLS; Neon requires it.
  const ssl = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? false : ("require" as const);
  const sql = postgres(dbUrl!, { max: 1, ssl });
  console.log(`Database: ${host}`);
  console.log(`Source:   ${usingProdVar ? "DATABASE_URL_PRODUCTION" : "DATABASE_URL (dev fallback)"}\n`);

  try {
    // ---------------------------------------------------------------- ledger
    console.log("=== 1. Migration ledger vs drizzle/migrations journal ===\n");
    const journal = readJournalMigrations();

    let ledger: { hash: string; created_at: string }[] = [];
    let ledgerExists = true;
    try {
      ledger = await sql`
        select hash, created_at from drizzle.__drizzle_migrations order by created_at`;
    } catch {
      ledgerExists = false;
    }

    if (!ledgerExists) {
      console.log("No drizzle.__drizzle_migrations table — this database has NO ledger.");
      console.log("drizzle-kit migrate would try to replay every migration from scratch.\n");
    } else {
      const recorded = new Set(ledger.map((r) => r.hash));
      let lastApplied: string | null = null;
      for (const m of journal) {
        const done = recorded.has(m.hash);
        if (done) lastApplied = m.tag;
        console.log(`  ${done ? "✓ recorded " : "✗ NOT here "} ${m.tag}`);
      }
      const journalHashes = new Set(journal.map((m: any) => m.hash));
      const unknown = ledger.filter((r) => !journalHashes.has(r.hash));
      console.log(`\n  ledger rows: ${ledger.length}  |  journal entries: ${journal.length}`);
      console.log(`  last journal migration recorded here: ${lastApplied ?? "none"}`);
      if (unknown.length) {
        console.log(`  ⚠ ${unknown.length} ledger row(s) match no journal file (likely the abandoned ./drizzle era):`);
        unknown.forEach((r) =>
          console.log(`      ${r.hash.slice(0, 12)}… created_at=${r.created_at}`),
        );
      }
      console.log();
    }

    // ------------------------------------------------------- tables + columns
    console.log("=== 2. Live schema vs schema.ts ===\n");
    const expected = schemaTables();
    const expectedNames = new Set(expected.map((t) => t.name));

    const liveTables: any[] = await sql`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'`;
    const liveNames = new Set(liveTables.map((t) => t.table_name));

    const missingTables = [...expectedNames].filter((n) => !liveNames.has(n));
    const extraTables = [...liveNames].filter((n) => !expectedNames.has(n));
    console.log(`  tables in schema.ts: ${expectedNames.size}  |  live: ${liveNames.size}`);
    if (missingTables.length)
      console.log(`  ✗ missing in DB:      ${missingTables.join(", ")}`);
    if (extraTables.length)
      console.log(`  ⚠ extra in DB only:   ${extraTables.join(", ")}`);
    if (!missingTables.length && !extraTables.length)
      console.log("  ✓ table sets match");

    const liveCols: any[] = await sql`
      select table_name, column_name from information_schema.columns
      where table_schema = 'public'`;
    const liveColSet = new Set(liveCols.map((c) => `${c.table_name}.${c.column_name}`));

    console.log("\n  Column drift (only tables present on both sides):");
    let drift = false;
    for (const table of expected) {
      if (!liveNames.has(table.name)) continue;
      const expectedCols = new Set(table.columns.map((c) => c.name));
      const missing = [...expectedCols].filter((c) => !liveColSet.has(`${table.name}.${c}`));
      const extra = liveCols
        .filter((c) => c.table_name === table.name && !expectedCols.has(c.column_name))
        .map((c) => c.column_name);
      if (missing.length || extra.length) {
        drift = true;
        console.log(`    ${table.name}:`);
        if (missing.length) console.log(`      ✗ missing in DB: ${missing.join(", ")}`);
        if (extra.length) console.log(`      ⚠ orphan in DB:  ${extra.join(", ")}`);
      }
    }
    if (!drift) console.log("    ✓ no column drift");

    // ------------------------------------------------------------------ enums
    console.log("\n=== 3. Postgres enums vs schema.ts ===\n");
    const liveEnums: any[] = await sql`
      select t.typname as name, e.enumlabel as value
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      order by t.typname, e.enumsortorder`;
    const liveEnumMap = new Map<string, string[]>();
    for (const row of liveEnums) {
      if (!liveEnumMap.has(row.name)) liveEnumMap.set(row.name, []);
      liveEnumMap.get(row.name)!.push(row.value);
    }

    let enumDrift = false;
    for (const e of schemaEnums()) {
      const live = liveEnumMap.get(e.enumName);
      if (!live) {
        enumDrift = true;
        console.log(`  ✗ ${e.enumName}: missing in DB`);
      } else {
        const missing = e.enumValues.filter((v) => !live.includes(v));
        const extra = live.filter((v) => !e.enumValues.includes(v));
        if (missing.length || extra.length) {
          enumDrift = true;
          console.log(`  ⚠ ${e.enumName}: missing [${missing.join(", ")}] extra [${extra.join(", ")}]`);
        }
      }
      liveEnumMap.delete(e.enumName);
    }
    for (const [name, values] of liveEnumMap) {
      enumDrift = true;
      console.log(`  ⚠ ${name}: exists only in DB (${values.join(", ")})`);
    }
    if (!enumDrift) console.log("  ✓ enums match");

    // ------------------------------------------------------------- row counts
    console.log("\n=== 4. Row counts (sanity snapshot) ===\n");
    for (const name of ["user", "booking", "payment", "subscription", "address", "cleaner_profile"]) {
      if (!liveNames.has(name)) continue;
      const [{ count }] = await sql`select count(*)::int as count from ${sql(name)}`;
      console.log(`  ${name.padEnd(16)} ${count}`);
    }

    console.log("\nDone. This script made no changes.");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("FATAL", e.message);
  process.exit(1);
});
