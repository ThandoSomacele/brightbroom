// scripts/db/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import path from 'path';
import { 
  getDbUrl, 
  isProduction, 
  confirmAction, 
  logDbInfo,
  createDatabaseBackup
} from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const args = process.argv.slice(2);
  const forceEnv = args.find(arg => arg.startsWith('--env='))?.split('=')[1];
  const skipConfirmation = args.includes('--yes') || args.includes('-y');
  const generateMigrations = args.includes('--generate');

  // Allow overriding environment
  const dbUrl = getDbUrl({ env: forceEnv, forceEnv: !!forceEnv });
  
  if (!dbUrl) {
    console.error('\x1b[31mDatabase URL environment variable is not set\x1b[0m');
    process.exit(1);
  }

  // Log current database info
  const { isProduction } = logDbInfo();

  // SAFETY CHECK: For production databases, add explicit confirmation
  if (isProduction && !skipConfirmation) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  WARNING: You are about to run migrations on a PRODUCTION database! ⚠️');
    console.log('\x1b[33m%s\x1b[0m', 'This operation can potentially cause data loss if not properly tested.');
    
    const proceed = await confirmAction('Are you sure you want to continue?');
    
    if (!proceed) {
      console.log('\x1b[32mMigration cancelled.\x1b[0m');
      process.exit(0);
    }
    
    console.log('\x1b[32mProceeding with production migration...\x1b[0m');
    
    // Create a backup before proceeding with production migrations
    try {
      console.log('Creating database backup before migration...');
      await createDatabaseBackup();
    } catch (error) {
      console.error('Error creating backup:', error);
      const proceedAnyway = await confirmAction('Backup failed. Continue anyway?');
      if (!proceedAnyway) {
        console.log('Migration cancelled');
        process.exit(0);
      }
    }
  }

  // Generate migrations if requested
  if (generateMigrations) {
    console.log('Generating migrations from schema changes...');
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec('npx drizzle-kit generate --schema=./src/lib/server/db/schema.ts --out=./drizzle/migrations --dialect=postgresql', 
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Migration generation error: ${error}`);
            reject(error);
            return;
          }
          
          console.log(stdout);
          if (stderr) console.error(stderr);
          
          console.log('Migration generation completed successfully');
          resolve(null);
        });
    });
  }

  // Don't use pooled client for migrations
  const migrationClient = postgres(dbUrl, { max: 1 });

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
    await runMigrations();
  } catch (error) {
    console.error('\x1b[31mUnhandled error:\x1b[0m', error);
    process.exit(1);
  }
})();
