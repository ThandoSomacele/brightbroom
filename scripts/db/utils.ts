// scripts/db/utils.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/server/db/schema";
import dotenv from 'dotenv';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Create readline interface for prompts
export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask for confirmation
export async function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`\x1b[33m${message} (y/N): \x1b[0m`, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Determine which database connection to use
export function getDbUrl(options?: { env?: string; forceEnv?: boolean }) {
  // Priority: 
  // 1. Explicitly set env if forceEnv is true
  // 2. TARGET_ENV environment variable 
  // 3. NODE_ENV
  // 4. Default to 'development'
  const targetEnv = options?.forceEnv && options?.env 
    ? options.env 
    : process.env.TARGET_ENV || process.env.NODE_ENV || 'development';
  
  if (targetEnv === 'production') {
    return process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
  } else {
    return process.env.DATABASE_URL_DEVELOPMENT || process.env.DATABASE_URL;
  }
}

// Get database URL
export const dbUrl = getDbUrl();

if (!dbUrl) {
  throw new Error("No database URL found in environment variables");
}

// Detect if this is production
export const isProduction = 
  process.env.TARGET_ENV === 'production' || 
  process.env.NODE_ENV === 'production' ||
  dbUrl === process.env.DATABASE_URL_PRODUCTION;

// Database logging helper
export function logDbInfo() {
  const maskedUrl = dbUrl.includes('@') 
    ? dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$$1:****@')
    : 'masked-url';
  
  console.log(`Environment: ${isProduction ? '\x1b[31mPRODUCTION\x1b[0m' : '\x1b[32mdevelopment\x1b[0m'}`);
  console.log(`Database: ${maskedUrl.split('@')[1]?.split('/')[0] || 'unknown location'}`);
  return { isProduction, dbUrl: maskedUrl };
}

// Create database connection with schema
export function createDbConnection() {
  const client = postgres(dbUrl);
  const db = drizzle(client, { schema });
  return { client, db };
}

// Function to safely close the database connection
export async function closeConnection(client: any) {
  try {
    await client.end();
    rl.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing connection:', error);
  }
}

// Create backup directory if it doesn't exist
export function ensureBackupDir() {
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

// Create a database backup using pg_dump
export async function createDatabaseBackup(): Promise<string> {
  const backupDir = ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `db-backup-${timestamp}.sql`;
  const backupPath = path.join(backupDir, backupFileName);
  
  console.log(`Creating database backup: ${backupFileName}`);
  
  return new Promise((resolve, reject) => {
    try {
      // Extract database connection parts for pg_dump
      const dbUrl = new URL(getDbUrl());
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const database = dbUrl.pathname.substring(1); // Remove leading slash
      const username = dbUrl.username;
      const password = dbUrl.password;
      
      // Set environment variable for password
      process.env.PGPASSWORD = password;
      
      // Build pg_dump command
      const pgDumpCmd = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupPath}"`;
      
      exec(pgDumpCmd, (error, stdout, stderr) => {
        // Clear password from environment
        delete process.env.PGPASSWORD;
        
        if (error) {
          console.error(`Backup failed: ${error.message}`);
          if (stderr) console.error(stderr);
          reject(error);
          return;
        }
        
        console.log(`Database backup completed successfully: ${backupPath}`);
        resolve(backupPath);
      });
    } catch (error) {
      console.error('Failed to create database backup:', error);
      reject(error);
    }
  });
}

// Create a backup of specific data as JSON
export function createDataBackup(data: any, name: string): string {
  const backupDir = ensureBackupDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${name}-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFileName);
  
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  console.log(`Data backup saved to: ${backupPath}`);
  
  return backupPath;
}

// Ensure directory exists
export function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

// Export database schema
export { schema };
