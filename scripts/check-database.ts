// scripts/check-database.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import chalk from "chalk"; // Optional: for colored output
import { sql } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create database client
const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function checkDatabase() {
  try {
    console.log("🔍 Running database diagnostic checks...\n");

    // 1. Check connection and basic info
    console.log("📊 Database connection info:");
    const connectionInfo = await client.unsafe(`
      SELECT current_database() as db_name, 
             current_user as username,
             version() as pg_version
    `);
    console.log(`  Database: ${connectionInfo[0].db_name}`);
    console.log(`  User: ${connectionInfo[0].username}`);
    console.log(`  PostgreSQL version: ${connectionInfo[0].pg_version.split(" ")[1]}\n`);

    // 2. Check migration journal table
    console.log("📋 Migration journal status:");
    const journalExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = '_drizzle_migrations'
      ) as exists
    `);

    if (journalExists[0].exists) {
      const migrations = await client.unsafe(`
        SELECT id, hash, created_at 
        FROM _drizzle_migrations 
        ORDER BY created_at DESC
      `);
      
      console.log(`  Migration table exists with ${migrations.length} migrations`);
      console.log("  Last 3 migrations:");
      migrations.slice(0, 3).forEach((migration) => {
        console.log(`  - ${migration.id} (${new Date(migration.created_at).toLocaleString()})`);
      });
    } else {
      console.log("  ⚠️ Migration table does not exist!");
    }
    console.log("");

    // 3. Check schema tables
    console.log("🗄️ Schema tables:");
    const tables = await client.unsafe(`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log(`  Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });
    console.log("");

    // 4. Verify specific problem tables and columns
    console.log("🔍 Problem column check:");
    
    // Check cleaner_application
    const cleanerAppColumns = await client.unsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cleaner_application'
      AND column_name IN ('profile_image_url', 'experience_types')
    `);

    console.log("  cleaner_application table:");
    if (cleanerAppColumns.length === 0) {
      console.log("  - ❌ No profile_image_url or experience_types columns found");
    } else {
      cleanerAppColumns.forEach(col => {
        console.log(`  - ✅ ${col.column_name} (${col.data_type}) exists`);
      });
    }

    // Check cleaner_profile
    const cleanerProfileColumns = await client.unsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cleaner_profile'
      AND column_name IN ('profile_image_url', 'experience_types')
    `);

    console.log("  cleaner_profile table:");
    if (cleanerProfileColumns.length === 0) {
      console.log("  - ❌ No profile_image_url or experience_types columns found");
    } else {
      cleanerProfileColumns.forEach(col => {
        console.log(`  - ✅ ${col.column_name} (${col.data_type}) exists`);
      });
    }

    // Check user table
    const userColumns = await client.unsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user'
      AND column_name = 'is_active'
    `);

    console.log("  user table:");
    if (userColumns.length === 0) {
      console.log("  - ❌ No is_active column found");
    } else {
      userColumns.forEach(col => {
        console.log(`  - ✅ ${col.column_name} (${col.data_type}) exists`);
      });
    }
    console.log("");

    // 5. Check for database inconsistencies
    console.log("🧪 Integrity check:");
    
    // Check foreign keys (sample)
    const orphanedBookings = await client.unsafe(`
      SELECT COUNT(*) as count FROM booking b
      LEFT JOIN "user" u ON b.user_id = u.id
      WHERE u.id IS NULL
    `);
    
    if (orphanedBookings[0].count > 0) {
      console.log(`  ⚠️ Found ${orphanedBookings[0].count} bookings with missing users`);
    } else {
      console.log("  ✅ No orphaned bookings found");
    }

    console.log("\n✅ Database check completed");

  } catch (error) {
    console.error("❌ Error during database check:", error);
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run the check
checkDatabase().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
