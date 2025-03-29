// scripts/apply-migrations.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';
import readline from 'readline';

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
  console.error('\x1b[31mDatabase URL environment variable is not set\x1b[0m');
  process.exit(1);
}

// SAFETY CHECK: For production databases, add explicit confirmation
const isProductionDb = 
  environment === 'production' || 
  dbUrl.includes('production') || 
  dbUrl === process.env.DATABASE_URL_PRODUCTION;

if (isProductionDb) {
  // Additional safeguard for production migrations
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Only trigger the confirmation prompt when run directly, not in CI/CD
  if (!process.env.CI && process.env.NODE_ENV !== 'ci') {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  WARNING: You are about to run migrations on a PRODUCTION database! ⚠️');
    console.log('\x1b[33m%s\x1b[0m', 'This operation can potentially cause data loss if not properly tested.');
    
    // We wrap this in a promise to make it async/await compatible
    await new Promise<void>((resolve) => {
      rl.question('\x1b[33mAre you sure you want to continue? (type "yes" to confirm): \x1b[0m', (answer) => {
        if (answer.toLowerCase() !== 'yes') {
          console.log('\x1b[32mMigration cancelled.\x1b[0m');
          rl.close();
          process.exit(0);
        }
        rl.close();
        resolve();
      });
    });
    
    console.log('\x1b[32mProceeding with production migration...\x1b[0m');
  } else {
    console.log('\x1b[33m%s\x1b[0m', 'Running in CI/CD environment, skipping confirmation prompt');
  }
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
    console.log('\x1b[32mMigrations completed successfully\x1b[0m');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31mMigration failed:\x1b[0m', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

// Execute the async main function
(async () => {
  try {
    await main();
  } catch (error) {
    console.error('\x1b[31mUnhandled error:\x1b[0m', error);
    process.exit(1);
  }
})();
