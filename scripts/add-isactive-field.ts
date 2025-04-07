// Create in a new file: scripts/add-isactive-field.ts

import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';


/**
 * Migration script to add isActive field to the user table
 * Run this with: npx tsx scripts/add-isactive-field.ts
 */
async function addIsActiveFieldMigration() {
  try {
    console.log('Starting migration to add isActive field to user table...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'is_active';
    `;
    
    const result = await db.execute(sql.raw(checkColumnQuery));
    
    if (result.rows.length === 0) {
      // Column doesn't exist, add it
      console.log('Adding is_active column to user table...');
      
      await db.execute(sql.raw(`
        ALTER TABLE "user" 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
      `));
      
      console.log('Column added successfully!');
      
      // Set all CLEANER users to have isActive = false initially
      console.log('Setting default values for CLEANER users...');
      
      await db.execute(sql.raw(`
        UPDATE "user"
        SET is_active = FALSE
        WHERE role = 'CLEANER';
      `));
      
      console.log('Default values set successfully!');
    } else {
      console.log('The is_active column already exists in the user table.');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migration
addIsActiveFieldMigration();
