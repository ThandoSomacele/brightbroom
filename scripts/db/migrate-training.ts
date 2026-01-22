// scripts/db/migrate-training.ts
// Migration script to add trainingCompleted to cleanerProfile
// and remove cleanerSpecialisation table

import { sql } from "drizzle-orm";
import { createDbConnection, closeConnection, logDbInfo, confirmAction } from "./utils";

async function runMigration() {
  console.log("\n=== Training Status Migration ===\n");

  const { isProduction } = logDbInfo();

  if (isProduction) {
    const proceed = await confirmAction(
      "⚠️ You are about to run a migration on PRODUCTION database. Continue?"
    );
    if (!proceed) {
      console.log("Migration cancelled");
      process.exit(0);
    }
  }

  const { client, db } = createDbConnection();

  try {
    console.log("Starting migration...\n");

    // Step 1: Add trainingCompleted column to cleaner_profile if it doesn't exist
    console.log("1. Adding trainingCompleted column to cleaner_profile...");
    await db.execute(sql`
      ALTER TABLE cleaner_profile
      ADD COLUMN IF NOT EXISTS training_completed TEXT[] DEFAULT '{}'
    `);
    console.log("   ✓ trainingCompleted column added");

    // Step 2: Drop cleaner_specialisation table if it exists
    console.log("\n2. Dropping cleaner_specialisation table if exists...");
    await db.execute(sql`DROP TABLE IF EXISTS cleaner_specialisation CASCADE`);
    console.log("   ✓ cleaner_specialisation table dropped (or did not exist)");

    // Step 3: Update existing cleaner profiles to have empty training array
    console.log("\n3. Ensuring all cleaner profiles have valid trainingCompleted...");
    await db.execute(sql`
      UPDATE cleaner_profile
      SET training_completed = '{}'
      WHERE training_completed IS NULL
    `);
    console.log("   ✓ Updated null values to empty array");

    console.log("\n=== Migration completed successfully! ===\n");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await closeConnection(client);
  }
}

runMigration();
