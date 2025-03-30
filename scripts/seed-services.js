// scripts/seed-services.js
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import { fileURLToPath } from "url";
import crypto from "crypto";
import readline from "readline";

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine which database to use
const TARGET_ENV = process.env.TARGET_ENV || 'development';
let dbUrl;

if (TARGET_ENV === 'production') {
  dbUrl = process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
} else {
  dbUrl = process.env.DATABASE_URL_DEVELOPMENT || process.env.DATABASE_URL;
}

if (!dbUrl) {
  console.error("ERROR: No database URL found for " + TARGET_ENV);
  process.exit(1);
}

// Safety check for production
const isProductionDb = TARGET_ENV === 'production' || 
                       dbUrl === process.env.DATABASE_URL_PRODUCTION ||
                       dbUrl.includes('production');

// Mask the database URL for logging (hide credentials)
const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log(`Using ${TARGET_ENV} database: ${maskedUrl}`);

// Function to parse CSV data
function parseServiceDetailsFromCSV(csvContent) {
  const items = [];

  // Split by lines
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

  // Skip header
  let i = 1;

  while (i < lines.length) {
    // The area name is a line in all caps
    const area = lines[i].trim();
    i++;

    const details = [];

    // Collect all details until we hit the next area (all caps) or end of file
    while (i < lines.length && !lines[i].trim().match(/^[A-Z\s]+$/)) {
      details.push(lines[i].trim().replace(/"/g, ""));
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

    if (serviceName.toLowerCase().includes("regular")) {
      filename = "BrightBroom Service Description - Regular Cleaning.csv";
    } else if (
      serviceName.toLowerCase().includes("extended") ||
      serviceName.toLowerCase().includes("deep")
    ) {
      filename = "BrightBroom Service Description - Extended Cleaning.csv";
    } else {
      // Default to regular cleaning for office cleaning
      filename = "BrightBroom Service Description - Regular Cleaning.csv";
    }

    const filePath = path.join(process.cwd(), "static", "data", filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Service details file not found: ${filename}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const items = parseServiceDetailsFromCSV(fileContent);

    return {
      name: serviceName,
      items,
    };
  } catch (error) {
    console.error(`❌ Error loading service details for ${serviceName}:`, error);
    return null;
  }
}

// Function to confirm production operations
async function confirmProductionOperation() {
  if (!isProductionDb) return true;
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️ WARNING: You are about to modify the PRODUCTION database. Are you sure? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  // Database connection - only create after confirmation for production
  let sql;
  
  try {
    // For production, ask for confirmation
    if (isProductionDb) {
      console.log("🔴 PRODUCTION DATABASE OPERATION");
      const confirmed = await confirmProductionOperation();
      if (!confirmed) {
        console.log("Operation cancelled.");
        process.exit(0);
      }
      console.log("Proceeding with production database update...");
    }
    
    // Create DB connection after confirmation
    sql = postgres(dbUrl);
    
    console.log(`🔵 Starting service update process on ${TARGET_ENV} database...`);
    console.log("Fetching existing services...");
    const services = await sql`SELECT * FROM service`;

    if (services.length === 0) {
      console.log("⚠️ No services found in the database. Creating new services...");

      // Define services to create
      const newServices = [
        {
          id: crypto.randomUUID(),
          name: "Regular Cleaning",
          description: "Perfect for maintaining a clean and tidy home on a regular basis.",
          basePrice: 350,
          durationHours: 6,
          isActive: true,
        },
        {
          id: crypto.randomUUID(),
          name: "Extended Cleaning",
          description: "A thorough cleaning service that reaches every corner and detail.",
          basePrice: 550,
          durationHours: 8,
          isActive: true,
        },
        {
          id: crypto.randomUUID(),
          name: "Office Cleaning",
          description: "Professional cleaning for your office space or commercial property.",
          basePrice: 450,
          durationHours: 6,
          isActive: true,
        },
      ];

      // Load service details and add to each service
      for (const service of newServices) {
        const details = loadServiceDetails(service.name);
        if (details) {
          service.details = JSON.stringify(details);
        }
      }

      // Insert services into database
      for (const service of newServices) {
        await sql`
          INSERT INTO service (id, name, description, base_price, duration_hours, details, is_active, created_at, updated_at)
          VALUES (${service.id}, ${service.name}, ${service.description}, ${service.basePrice}, ${service.durationHours}, 
                  ${service.details}, ${service.isActive}, NOW(), NOW())
        `;
        console.log(`✅ Created service: ${service.name}`);
      }

      console.log("🎉 New services created successfully!");
      return;
    }

    console.log(`Found ${services.length} services to update.`);

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

        console.log(`✅ Updated ${service.name} with details`);
      } else {
        console.log(`⚠️ No details found for ${service.name}`);
      }
    }

    console.log(`🎉 All services updated successfully on ${TARGET_ENV} database!`);
  } catch (error) {
    console.error("❌ Error updating services:", error);
    process.exit(1);
  } finally {
    if (sql) await sql.end();
  }
}

main();
