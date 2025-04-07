// scripts/add-isactive-field.ts
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { user } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables from .env files
config();

async function main() {
  // Check if DATABASE_URL is defined
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not defined');
    process.exit(1);
  }

  console.log('Connecting to database...');
  
  // Create database connection
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    console.log('Adding isActive field to user table...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'is_active';
    `;
    
    const columnExists = await client.unsafe(checkColumnQuery);
    
    if (columnExists.length === 0) {
      // Add the column if it doesn't exist
      console.log('Column does not exist, adding it...');
      await client.unsafe(`
        ALTER TABLE "user" 
        ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true NOT NULL;
      `);
      console.log('Column added successfully!');
    } else {
      console.log('Column already exists, updating default values...');
      // Update any NULL values to TRUE
      await db.update(user)
        .set({ isActive: true })
        .where(eq(user.isActive, undefined as any));
      console.log('Default values updated!');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

main();
