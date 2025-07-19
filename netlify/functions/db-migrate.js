// netlify/functions/db-migrate.js
import { exec } from 'child_process';

// Use ES Module export syntax instead of CommonJS
export const handler = async function(event, context) {
  try {
    // Security check - only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
    }

    // Add basic authentication for production
    const authHeader = event.headers.authorization;
    const expectedAuth = process.env.MIGRATION_AUTH_TOKEN;
    
    if (expectedAuth && (!authHeader || authHeader !== `Bearer ${expectedAuth}`)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    console.log('Starting database migration...');
    console.log('Environment:', process.env.NODE_ENV);
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Use migrate instead of push for production (safer)
    const command = process.env.NODE_ENV === 'production' 
      ? 'npx drizzle-kit migrate'
      : 'npx drizzle-kit push';
    
    console.log(`Running command: ${command}`);
    
    // Run Drizzle migration
    const output = await new Promise((resolve, reject) => {
      exec(command, { 
        timeout: 60000, // 60 second timeout
        env: { ...process.env }
      }, (error, stdout, stderr) => {
        if (error) {
          reject(`Migration error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`Migration stderr: ${stderr}`);
        }
        resolve(stdout);
      });
    });
    
    console.log('Migration completed successfully');
    console.log('Migration output:', output);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Database migration completed successfully',
        output: output.toString(),
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Database migration failed',
        error: error.toString(),
        timestamp: new Date().toISOString()
      })
    };
  }
};
