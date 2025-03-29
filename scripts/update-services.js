// scripts/update-services.js
import dotenv from "dotenv";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const sql = postgres(process.env.DATABASE_URL);

// Function to parse CSV data
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
    console.log("Fetching existing services...");
    const services = await sql`SELECT * FROM service`;
    
    // Update each service with details
    for (const service of services) {
      console.log(`Updating service: ${service.name}`);
      
      // Load service details
      const details = loadServiceDetails(service.name);
      
      if (details) {
        const detailsJson = JSON.stringify(details);
        
        // Update service with details
        await sql`
          UPDATE service 
          SET details = ${detailsJson}, 
              is_active = TRUE 
          WHERE id = ${service.id}
        `;
        
        console.log(`Updated ${service.name} with details`);
      } else {
        console.log(`No details found for ${service.name}`);
      }
    }
    
    console.log("All services updated successfully!");
  } catch (error) {
    console.error("Error updating services:", error);
  } finally {
    await sql.end();
  }
}

main();