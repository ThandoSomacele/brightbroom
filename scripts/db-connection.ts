// scripts/db-connection.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/server/db/schema";
import dotenv from 'dotenv';
import readline from 'readline';
import { createDatabaseBackup } from './db-utils';

// Load environment variables from .env file
dotenv.config();

// Determine which database connection to use
const getDbUrl = () => {
  const targetEnv = process.env.TARGET_ENV || 'development';
  
  if (targetEnv === 'production') {
    return process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
  } else {
    return process.env.DATABASE_URL_DEVELOPMENT || process.env.DATABASE_URL;
  }
};

const dbUrl = getDbUrl();

if (!dbUrl) {
  throw new Error("No database URL found in environment variables");
}

// Detect if this is production
export const isProduction = 
  process.env.TARGET_ENV === 'production' || 
  dbUrl === process.env.DATABASE_URL_PRODUCTION;

// Create readline interface for prompts
export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask for confirmation
export async function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Log connection info for debugging
console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'development'}`);
console.log(`Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown location'}`);

// Create database connection
const client = postgres(dbUrl);
export const db = drizzle(client, { schema });

// Function to safely close the database connection
export async function closeConnection() {
  await client.end();
  rl.close();
}

// Function to backup the database
export async function backupDatabase() {
  try {
    if (isProduction) {
      console.log('Creating full database backup before changes...');
      const backupPath = await createDatabaseBackup(dbUrl);
      return backupPath;
    }
    return null;
  } catch (error) {
    console.error('Failed to create database backup:', error);
    return null;
  }
}

// Export database URL and schema for utilities
export { dbUrl, schema };
