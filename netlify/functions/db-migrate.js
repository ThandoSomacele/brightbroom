// netlify/functions/db-migrate.js
import { exec } from 'child_process';

// Use ES Module export syntax instead of CommonJS
export const handler = async function(event, context) {
  try {
    console.log('Starting database migration...');
    
    // Run Drizzle migration
    const output = await new Promise((resolve, reject) => {
      exec('npx drizzle-kit push', (error, stdout, stderr) => {
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
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Database migration completed successfully',
        output 
      })
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Database migration failed',
        error: error.toString() 
      })
    };
  }
};
