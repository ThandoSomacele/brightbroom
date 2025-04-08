// drizzle/migrations/0003_experience_types.ts
import { pgTable, json, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export async function up(db) {
  // 1. Add the new experienceTypes column to the cleaner_application table
  // Use "IF NOT EXISTS" to avoid errors if column already exists
  await db.execute(
    sql`ALTER TABLE "cleaner_application" ADD COLUMN IF NOT EXISTS "experience_types" JSONB DEFAULT '[]'::jsonb`
  );

  // 2. Convert existing experience data to the new format if needed
  await db.execute(
    sql`
    UPDATE "cleaner_application"
    SET "experience_types" = 
      CASE 
        WHEN "experience" = '0-6' THEN '["GUEST_HOUSE"]'::jsonb
        WHEN "experience" = '6-12' THEN '["GUEST_HOUSE", "OFFICE"]'::jsonb
        WHEN "experience" = '1-2' THEN '["GUEST_HOUSE", "OFFICE"]'::jsonb
        WHEN "experience" = '3-5' THEN '["GUEST_HOUSE", "OFFICE", "CARE_GIVING"]'::jsonb
        WHEN "experience" = '5+' THEN '["GUEST_HOUSE", "OFFICE", "CARE_GIVING"]'::jsonb
        ELSE '[]'::jsonb
      END
    WHERE "experience_types" IS NULL OR "experience_types" = '[]'::jsonb
    `
  );

  // 3. Add the new experienceTypes column to the cleaner_profile table
  await db.execute(
    sql`ALTER TABLE "cleaner_profile" ADD COLUMN IF NOT EXISTS "experience_types" JSONB DEFAULT '[]'::jsonb`
  );
}

export async function down(db) {
  // This migration is not easily reversible since we're converting data formats
  
  // Remove the new columns if needed
  await db.execute(
    sql`ALTER TABLE "cleaner_application" DROP COLUMN IF EXISTS "experience_types"`
  );
  
  await db.execute(
    sql`ALTER TABLE "cleaner_profile" DROP COLUMN IF EXISTS "experience_types"`
  );
}
