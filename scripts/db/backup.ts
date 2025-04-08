// scripts/db/backup.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk'; // Optional, for colored console output
import { exec } from 'child_process';
import dotenv from 'dotenv';
import {
  getDbUrl,
  isProduction,
  confirmAction,
  logDbInfo,
  ensureBackupDir,
  createDataBackup,
  closeConnection,
  createDbConnection
} from './utils';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  full: args.includes('--full') || args.includes('-f'),
  tables: args.filter(arg => !arg.startsWith('-')),
  skipConfirmation: args.includes('--yes') || args.includes('-y'),
  dumpFormat: args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'sql',
  compress: args.includes('--compress') || args.includes('-z'),
  help: args.includes('--help') || args.includes('-h'),
};

// Show help text
if (options.help) {
  console.log(`
BrightBroom Database Backup Script
==================================

Usage: npm run db:backup [tables] [options]

Parameters:
  [tables]           Specific tables to backup (e.g., service user booking)
                     Default: all tables

Options:
  --full, -f         Create a full database dump (includes schema)
  --format=<format>  Output format: sql (default), csv, json
  --compress, -z     Compress the backup file
  --yes, -y          Skip confirmation prompts
  --help, -h         Show this help text

Examples:
  npm run db:backup                   # Backup all tables (data only)
  npm run db:backup service user -f   # Full backup of specific tables
  npm run db:backup --format=json     # Backup all tables in JSON format
  npm run db:backup --compress        # Create a compressed backup
  `);
  process.exit(0);
}

/**
 * Main backup function
 */
async function backupDatabase() {
  // Log current database info
  const { isProduction } = logDbInfo();

  // Confirm if backing up production
  if (isProduction && !options.skipConfirmation) {
    console.log(chalk?.yellow('⚠️  You are about to backup a PRODUCTION database.') || 
      '⚠️  You are about to backup a PRODUCTION database.');
    
    const proceed = await confirmAction('Are you sure you want to continue?');
    
    if (!proceed) {
      console.log('Backup cancelled');
      process.exit(0);
    }
  }

  // Ensure backup directory exists
  const backupDir = ensureBackupDir();
  
  // Create timestamp for backup files
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    if (options.full || options.dumpFormat === 'sql') {
      // Full SQL backup using pg_dump
      await createSqlBackup(timestamp, backupDir);
    }
    
    // JSON backup of specific tables (or all if none specified)
    if (options.dumpFormat === 'json' || !options.full) {
      await createJsonBackup(timestamp, backupDir);
    }
    
    console.log(chalk?.green('✓ Backup completed successfully') || 
      '✓ Backup completed successfully');
  } catch (error) {
    console.error(chalk?.red('Error during backup:') || 'Error during backup:', error);
    process.exit(1);
  }
}

/**
 * Create SQL backup using pg_dump
 */
async function createSqlBackup(timestamp: string, backupDir: string): Promise<string> {
  const backupFileName = `brightbroom-db-${timestamp}.sql`;
  const backupFilePath = path.join(backupDir, backupFileName);
  const compressedFilePath = `${backupFilePath}.gz`;
  
  return new Promise((resolve, reject) => {
    try {
      // Extract database connection parts
      const dbUrl = new URL(getDbUrl());
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const database = dbUrl.pathname.substring(1); // Remove leading slash
      const username = dbUrl.username;
      const password = dbUrl.password;
      
      // Set password environment
      process.env.PGPASSWORD = password;
      
      console.log(`Creating SQL backup: ${backupFileName}`);
      
      // Build pg_dump command
      let pgDumpCmd = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database}`;
      
      // Add table filters if specific tables requested
      if (options.tables.length > 0) {
        const tableClauses = options.tables.map(table => `-t "${table}"`).join(' ');
        pgDumpCmd += ` ${tableClauses}`;
      }
      
      // Add output file
      if (options.compress) {
        // For compression, pipe to gzip
        pgDumpCmd += ` | gzip > "${compressedFilePath}"`;
      } else {
        pgDumpCmd += ` -f "${backupFilePath}"`;
      }
      
      // Execute the command
      exec(pgDumpCmd, (error, stdout, stderr) => {
        // Clear password from environment
        delete process.env.PGPASSWORD;
        
        if (error) {
          console.error(`Backup failed: ${error.message}`);
          if (stderr) console.error(stderr);
          reject(error);
          return;
        }
        
        const finalPath = options.compress ? compressedFilePath : backupFilePath;
        console.log(`SQL backup saved to: ${finalPath}`);
        resolve(finalPath);
      });
    } catch (error) {
      console.error('Failed to create SQL backup:', error);
      reject(error);
    }
  });
}

/**
 * Create JSON backup by querying the database
 */
async function createJsonBackup(timestamp: string, backupDir: string): Promise<void> {
  console.log('Creating JSON backups of tables...');
  
  // Create database connection
  const { client, db } = createDbConnection();
  
  try {
    // Determine which tables to backup
    let tables = options.tables;
    
    // If no tables specified, get all tables
    if (tables.length === 0) {
      // Query for all table names in the schema
      const tableQuery = await client.unsafe(`
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      tables = tableQuery.map((row: any) => row.tablename);
    }
    
    // Back up each table
    for (const tableName of tables) {
      try {
        console.log(`Backing up table: ${tableName}`);
        
        // Query all data from the table
        const data = await client.unsafe(`SELECT * FROM "${tableName}"`);
        
        if (data.length === 0) {
          console.log(`Table ${tableName} is empty`);
          continue;
        }
        
        // Save as JSON file
        const backupFileName = `${tableName}-${timestamp}.json`;
        const backupPath = path.join(backupDir, backupFileName);
        
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
        console.log(`✓ Saved ${data.length} rows from ${tableName}`);
        
        // Compress if requested
        if (options.compress) {
          const { gzip } = await import('zlib');
          const { promisify } = await import('util');
          const gzipPromise = promisify(gzip);
          
          const fileContent = fs.readFileSync(backupPath);
          const compressedContent = await gzipPromise(fileContent);
          
          fs.writeFileSync(`${backupPath}.gz`, compressedContent);
          fs.unlinkSync(backupPath); // Remove uncompressed file
          
          console.log(`✓ Compressed ${backupFileName}`);
        }
      } catch (error) {
        console.error(`Error backing up table ${tableName}:`, error);
      }
    }
  } finally {
    // Close database connection
    await closeConnection(client);
  }
}

// Run the backup function
backupDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
