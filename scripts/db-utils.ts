// scripts/db-utils.ts
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a database backup using pg_dump
 * @param databaseUrl The database URL to backup
 * @returns The path to the backup file
 */
export async function createDatabaseBackup(databaseUrl: string): Promise<string> {
  // Ensure backups directory exists
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `db-backup-${timestamp}.sql`;
  const backupPath = path.join(backupDir, backupFileName);
  
  console.log(`Creating database backup: ${backupFileName}`);
  
  return new Promise((resolve, reject) => {
    // Extract database connection parts for pg_dump
    const dbUrl = new URL(databaseUrl);
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
  });
}

/**
 * Create a backup of specific data as JSON
 * @param data The data to backup
 * @param name Identifier for the backup
 * @returns The path to the backup file
 */
export function createDataBackup(data: any, name: string): string {
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${name}-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFileName);
  
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  console.log(`Data backup saved to: ${backupPath}`);
  
  return backupPath;
}
