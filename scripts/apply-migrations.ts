// scripts/apply-migrations.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Log a masked version of the URL for debugging (hiding password)
const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$$1:****@');
console.log(`Connecting to database: ${maskedUrl}`);

// Don't use pooled client for migrations
const migrationClient = postgres(dbUrl, { max: 1 });

async function main() {
  try {
    console.log('Starting database migrations...');
    await migrate(drizzle(migrationClient), { 
      migrationsFolder: './drizzle/migrations' 
    });
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

main();
