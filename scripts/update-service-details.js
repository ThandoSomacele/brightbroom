// scripts/update-service-details.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { parseServiceDetailsFromCSV } from '../src/lib/services/utils.js';

// Load environment variables
dotenv.config();

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

// Import schema - dynamic import since we're using ESM
const schema = await import('../src/lib/server/db/schema.js');
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

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
    
    // Get all services
    const services = await db.select().from(schema.service);
    
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
      await db.update(schema.service)
        .set({ 
          details: JSON.stringify(serviceDetails),
          updatedAt: new Date()
        })
        .where(schema.eq(schema.service.id, service.id));
      
      console.log(`Updated service "${service.name}" details.`);
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
