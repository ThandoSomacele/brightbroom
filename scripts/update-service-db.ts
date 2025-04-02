// scripts/update-service-db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import * as schema from "../src/lib/server/db/schema";

// Load environment variables
dotenv.config();

// Check for the environment argument
const isProd = process.argv.includes("--production");
const environment = isProd ? "production" : "development";

// Get database URL based on environment
const DB_URL = isProd 
  ? process.env.DATABASE_URL_PRODUCTION 
  : process.env.DATABASE_URL_DEVELOPMENT || process.env.DATABASE_URL;

// Validate database URL
if (!DB_URL) {
  console.error(`No database URL found for ${environment} environment.`);
  console.error("Please set DATABASE_URL_PRODUCTION or DATABASE_URL_DEVELOPMENT in your .env file");
  process.exit(1);
}

console.log(`Using ${environment} database: ${DB_URL.split("@")[1]}`);

// Create database connection
const client = postgres(DB_URL);
const db = drizzle(client, { schema });

// Utility to parse service details from a file
function parseServiceDetails(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    
    // Check file type
    if (filePath.endsWith(".json")) {
      // Parse JSON file
      return JSON.parse(fileContent);
    } else if (filePath.endsWith(".csv")) {
      // Parse CSV file
      return parseServiceDetailsFromCSV(fileContent);
    } else {
      throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
    }
  } catch (error) {
    throw new Error(`Error processing ${path.basename(filePath)}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Parse CSV content into service details
function parseServiceDetailsFromCSV(csvContent: string) {
  const items = [];
  
  // Split by lines
  const lines = csvContent.split("\n").filter(line => line.trim() !== "");
  
  // Skip header
  let i = 1;
  
  while (i < lines.length) {
    // The area name is a line in all caps
    const area = lines[i].trim();
    i++;
    
    const details = [];
    
    // Collect all details until we hit the next area (all caps) or end of file
    while (i < lines.length && !lines[i].trim().match(/^[A-Z\\s]+$/)) {
      details.push(lines[i].trim().replace(/"/g, ""));
      i++;
    }
    
    // Add this area with its details
    if (details.length > 0) {
      items.push({ area, details });
    }
  }
  
  return { items };
}

// Find service description file (JSON or CSV)
function findServiceFile(serviceName: string) {
  // Define possible file paths
  const possiblePaths = [
    // Try JSON file first
    path.join(process.cwd(), "static", "data", "json", `${serviceName.toLowerCase().replace(/\s+/g, '-')}.json`),
    // Try CSV file second
    path.join(process.cwd(), "static", "data", `BrightBroom Service Description - ${serviceName}.csv`),
    // Try CSV in csv subfolder
    path.join(process.cwd(), "static", "data", "csv", `BrightBroom Service Description - ${serviceName}.csv`),
  ];
  
  // Check each path
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
}

// Update a service's details
async function updateServiceDetails(serviceData: any) {
  try {
    const serviceName = serviceData.name;
    console.log(`Updating service "${serviceName}" with details...`);
    
    // Find the service file
    const serviceFilePath = findServiceFile(serviceName);
    
    if (!serviceFilePath) {
      console.warn(`No service file found for "${serviceName}". Skipping.`);
      return false;
    }
    
    console.log(`Found service file: ${serviceFilePath}`);
    
    // Parse the service details
    const serviceDetails = parseServiceDetails(serviceFilePath);
    
    // Update the service with the details
    const result = await db.update(schema.service)
      .set({
        details: JSON.stringify(serviceDetails),
        updatedAt: new Date()
      })
      .where(eq(schema.service.id, serviceData.id))
      .returning();
    
    console.log(`✓ Service "${serviceName}" updated successfully!`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Add a new service from file
async function addNewService(serviceName: string, filePath: string) {
  try {
    console.log(`Adding new service "${serviceName}" from file: ${filePath}`);
    
    // Parse the service details
    const serviceDetails = parseServiceDetails(filePath);
    
    // Try to guess some properties from the name
    const isExtended = serviceName.toLowerCase().includes("extended");
    const isOffice = serviceName.toLowerCase().includes("office");
    const isLaundry = serviceName.toLowerCase().includes("laundry");
    
    // Determine duration and price based on service type
    let basePrice = 350;
    let durationHours = 6;
    
    if (isExtended) {
      basePrice = 550;
      durationHours = 10;
    } else if (isOffice) {
      basePrice = 450;
      durationHours = 6;
    } else if (isLaundry) {
      basePrice = 450;
      durationHours = 8;
    }
    
    // Create service description
    let description = "Professional cleaning service.";
    if (isExtended) {
      description = "A thorough cleaning service that reaches every corner and detail.";
    } else if (isOffice) {
      description = "Professional cleaning for your office space or commercial property.";
    } else if (isLaundry) {
      description = "Standard cleaning service with laundry and ironing assistance.";
    } else {
      description = "Perfect for maintaining a clean and tidy home on a regular basis.";
    }
    
    // Insert the new service
    const [newService] = await db.insert(schema.service)
      .values({
        id: crypto.randomUUID(),
        name: serviceName,
        description,
        basePrice,
        durationHours,
        details: JSON.stringify(serviceDetails),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`✓ Service "${serviceName}" added successfully!`);
    return true;
  } catch (error) {
    console.error(`Error adding service "${serviceName}":`, error);
    return false;
  }
}

// Find and process new services
async function findNewServices(existingServices: any[]) {
  const jsonDir = path.join(process.cwd(), "static", "data", "json");
  
  if (!fs.existsSync(jsonDir)) {
    console.log("No JSON directory found at:", jsonDir);
    return;
  }
  
  // Get all JSON files
  const jsonFiles = fs.readdirSync(jsonDir)
    .filter(file => file.endsWith(".json"));
  
  console.log(`Found ${jsonFiles.length} JSON service files`);
  
  // Extract existing service names
  const existingNames = existingServices.map(s => s.name.toLowerCase());
  
  // Process each file
  for (const jsonFile of jsonFiles) {
    try {
      // Parse the JSON file
      const filePath = path.join(jsonDir, jsonFile);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const serviceData = JSON.parse(fileContent);
      
      const serviceName = serviceData.name;
      
      // Check if this service already exists
      if (!serviceName || existingNames.includes(serviceName.toLowerCase())) {
        continue;
      }
      
      console.log(`Found new service: "${serviceName}"`);
      
      // Prompt user to add this service
      // In a script we can't easily prompt, so we'll check command line arguments
      const shouldAdd = process.argv.includes("--add-new");
      
      if (shouldAdd) {
        await addNewService(serviceName, filePath);
      } else {
        console.log(`Skipping new service. Run with --add-new to add new services.`);
      }
    } catch (error) {
      console.error(`Error processing ${jsonFile}:`, error);
    }
  }
}

// Main function
async function main() {
  console.log("==================================");
  console.log(" BrightBroom Service DB Updater");
  console.log("==================================");
  
  try {
    // Fetch existing services
    console.log("Fetching services from database...");
    const services = await db.select().from(schema.service);
    
    console.log(`Found ${services.length} services. Updating details...`);
    
    // Update each service
    let updatedCount = 0;
    for (const service of services) {
      const success = await updateServiceDetails(service);
      if (success) updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} out of ${services.length} services.`);
    
    // Look for new services
    console.log("Checking for new services...");
    await findNewServices(services);
    
    console.log("Service update process completed.");
  } catch (error) {
    console.error("Error updating services:", error);
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run the script
main();
