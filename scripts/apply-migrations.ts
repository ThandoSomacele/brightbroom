// scripts/apply-migrations.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Determine environment
const environment = process.env.NODE_ENV || 'development';
console.log(`Running migrations in ${environment} environment`);

// Select the appropriate DB URL based on environment
const getDbUrl = () => {
  // Check for environment-specific database URLs first
  if (environment === 'production' && process.env.DATABASE_URL_PRODUCTION) {
    return process.env.DATABASE_URL_PRODUCTION;
  }
  
  if (environment === 'development' && process.env.DATABASE_URL_DEVELOPMENT) {
    return process.env.DATABASE_URL_DEVELOPMENT;
  }
  
  // Fall back to the default DATABASE_URL
  return process.env.DATABASE_URL;
};

const dbUrl = getDbUrl();
if (!dbUrl) {
  console.error('Database URL environment variable is not set');
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
