// scripts/update-service-schema.js
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

// Function to parse CSV data - same as in seed.js
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

// Function to load service details from CSV
function loadServiceDetails(serviceName) {
  try {
    let filename;
    
    if (serviceName.toLowerCase().includes('regular')) {
      filename = 'BrightBroom Service Description - Regular Cleaning.csv';
    } else if (serviceName.toLowerCase().includes('extended') || serviceName.toLowerCase().includes('deep')) {
      filename = 'BrightBroom Service Description - Extended Cleaning.csv';
    } else {
      // Default to regular cleaning for office cleaning
      filename = 'BrightBroom Service Description - Regular Cleaning.csv';
    }
    
    const filePath = path.join(process.cwd(), 'static', 'data', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const items = parseServiceDetailsFromCSV(fileContent);
    
    return {
      name: serviceName,
      items
    };
  } catch (error) {
    console.error(`Error loading service details for ${serviceName}:`, error);
    return null;
  }
}

async function main() {
  try {
    console.log("Updating database schema...");
    
    // Check if the column exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'service' AND column_name = 'details'
    `);
    
    // Add details column if it doesn't exist
    if (result.length === 0) {
      console.log("Adding details column to service table...");
      await db.execute(sql`ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "details" TEXT`);
      console.log("Adding isActive column to service table...");
      await db.execute(sql`ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE NOT NULL`);
    }
    
    // Get all services
    console.log("Fetching services...");
    const services = await db.execute(sql`SELECT * FROM "service"`);
    
    // Update each service with details
    for (const service of services) {
      console.log(`Updating ${service.name} with details...`);
      
      // Skip if already has details
      if (service.details) {
        console.log(`Service ${service.name} already has details, skipping...`);
        continue;
      }
      
      // Load and add service details
      const details = loadServiceDetails(service.name);
      if (details) {
        await db.execute(sql`
          UPDATE "service"
          SET "details" = ${JSON.stringify(details)}
          WHERE "id" = ${service.id}
        `);
        console.log(`Updated ${service.name} with details`);
      } else {
        console.log(`No details found for ${service.name}`);
      }
    }
    
    console.log("Service details update completed successfully!");
  } catch (error) {
    console.error("Error updating service details:", error);
  } finally {
    await client.end();
  }
}

main();