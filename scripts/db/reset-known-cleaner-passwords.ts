// scripts/db/reset-known-cleaner-passwords.ts
//
// Find cleaner accounts that still have the fixed password the old
// "approve" shortcut on /admin/applications gave them ("temporaryPassword123"),
// and make that password stop working.
//
//   DATABASE_URL=postgres://… tsx scripts/db/reset-known-cleaner-passwords.ts          # dry run
//   DATABASE_URL=postgres://… tsx scripts/db/reset-known-cleaner-passwords.ts --apply
//
// --apply replaces each matching hash with one nobody can log in with and ends
// those cleaners' sessions. Then open each listed cleaner in
// /admin/cleaners/<id> and use "Email a set-password link".
//
// No dotenv on purpose: a local .env points at the development database, so
// the target must be given explicitly.
import crypto from "crypto";
import { Argon2id } from "oslo/password";
import postgres from "postgres";

const KNOWN_PASSWORD = "temporaryPassword123";

const apply = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("Set DATABASE_URL to the database to check.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  const hasher = new Argon2id();
  const cleaners = await sql<{ id: string; first_name: string; last_name: string; password_hash: string }[]>`
    SELECT id, first_name, last_name, password_hash FROM "user" WHERE role = 'CLEANER'`;

  const matches = [];
  for (const c of cleaners) {
    try {
      if (await hasher.verify(c.password_hash, KNOWN_PASSWORD)) matches.push(c);
    } catch {
      // Not an argon2 hash: cannot be the known password
    }
  }

  console.log(`Checked ${cleaners.length} cleaner account(s); ${matches.length} still use the known password.`);
  for (const c of matches) {
    console.log(`  /admin/cleaners/${c.id}  ${c.first_name} ${c.last_name.slice(0, 1)}.`);
  }
  if (matches.length === 0) return;

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to disable those passwords.");
    return;
  }

  for (const c of matches) {
    const unusable = await hasher.hash(crypto.randomBytes(32).toString("base64url"));
    await sql.begin(async (tx) => {
      await tx`UPDATE "user" SET password_hash = ${unusable}, updated_at = now() WHERE id = ${c.id}`;
      await tx`DELETE FROM user_session WHERE user_id = ${c.id}`;
    });
  }
  console.log(`Disabled ${matches.length} password(s). Send each cleaner a set-password link from their admin page.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
