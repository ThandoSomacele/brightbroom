// scripts/standalone-update-db.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

// Get current directory for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Parse CSV content into service detail items
 */
function parseServiceDetailsFromCSV(csvContent) {
  const items = [];
  
  // Split by lines
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  // Skip header
  let i = 1;
  
  while (i < lines.length) {
    // The area name is a line in all caps
    const area = lines[i].trim();
    i++;
    
    const details = [];
    
    // Collect all details until we hit the next area (all caps) or end of file
    while (i < lines.length && !lines[i].trim().match(/^[A-Z\s]+$/)) {
      details.push(lines[i].trim().replace(/"/g, ''));
      i++;
    }
    
    // Add this area with its details
    if (details.length > 0) {
      items.push({ area, details });
    }
  }
  
  return items;
}

// Database setup
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// SAFETY CHECK: Confirm before updating production database
const isProductionDatabase = 
  process.env.DATABASE_URL.includes('production') || 
  process.env.DATABASE_URL === process.env.DATABASE_URL_PRODUCTION;

if (isProductionDatabase && !process.argv.includes('--production')) {
  console.error('\x1b[31m%s\x1b[0m', 'WARNING: You are about to update a production database.');
  console.error('\x1b[31m%s\x1b[0m', 'To confirm, run again with --production flag.');
  process.exit(1);
}

// Connect to database manually since we don't have dynamic imports in the script
const client = postgres(process.env.DATABASE_URL);

// Define the mapping between service names and CSV files
const serviceFileMap = {
  'Regular Cleaning': 'BrightBroom Service Description - Regular Cleaning.csv',
  'Regular Cleaning with Laundry & Ironing': 'BrightBroom Service Description - Regular Cleaning with Laundry & Ironing.csv',
  'Extended Cleaning': 'BrightBroom Service Description - Extended Cleaning.csv',
  'Office Cleaning': 'BrightBroom Service Description - Office Cleaning.csv'
};

async function updateServiceDetails() {
  try {
    console.log('Fetching services from database...');
    
    // Get all services - using SQL directly since we don't have the schema
    const services = await client`SELECT * FROM service`;
    
    console.log(`Found ${services.length} services. Updating details...`);
    
    // Process each service
    for (const service of services) {
      // Find the matching CSV file
      let csvFile = null;
      
      // Try exact match first
      if (serviceFileMap[service.name]) {
        csvFile = serviceFileMap[service.name];
      } else {
        // Try to find a partial match
        const keys = Object.keys(serviceFileMap);
        const matchingKey = keys.find(key => service.name.includes(key));
        
        if (matchingKey) {
          csvFile = serviceFileMap[matchingKey];
        } else {
          console.warn(`No matching CSV file found for service: ${service.name}`);
          continue;
        }
      }
      
      console.log(`Updating service "${service.name}" with details from ${csvFile}...`);
      
      try {
        // Read the CSV file
        const csvContent = fs.readFileSync(path.join(process.cwd(), 'static', 'data', csvFile), 'utf8');
        
        // Parse the CSV content
        const items = parseServiceDetailsFromCSV(csvContent);
        
        // Create service details object
        const serviceDetails = {
          name: service.name,
          items
        };
        
        // Update the service in the database
        await client`
          UPDATE service 
          SET details = ${JSON.stringify(serviceDetails)}, 
              updated_at = ${new Date()} 
          WHERE id = ${service.id}
        `;
        
        console.log(`Updated service "${service.name}" details.`);
      } catch (err) {
        console.error(`Error processing ${csvFile}:`, err);
      }
    }
    
    console.log('Service details update complete!');
  } catch (error) {
    console.error('Error updating service details:', error);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run the update function
updateServiceDetails();
