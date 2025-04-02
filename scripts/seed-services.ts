// scripts/seed-services.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import * as schema from "../src/lib/server/db/schema";

// Load environment variables
dotenv.config();

// Check for environment argument or use TARGET_ENV
const PROD_FLAGS = ["--production", "--prod", "-p"];
const isProd = PROD_FLAGS.some(flag => process.argv.includes(flag)) || process.env.TARGET_ENV === "production";
const environment = isProd ? "production" : "development";

// Check if we should overwrite existing services
const shouldOverwrite = process.argv.includes("--overwrite");

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

// SAFETY CHECK: Confirm before proceeding with production
if (isProd && !process.argv.includes("--confirm")) {
  console.log("\n⚠️  CAUTION: You are about to seed the PRODUCTION database!");
  console.log("This operation could potentially overwrite existing data.");
  console.log("\nTo proceed, rerun the command with the --confirm flag:");
  console.log(`npm run db:seed-services:prod -- --confirm${shouldOverwrite ? " --overwrite" : ""}\n`);
  process.exit(0);
}

// Create database connection
const client = postgres(DB_URL);
const db = drizzle(client, { schema });

// Load service details from JSON file
function loadServiceDetailsFromJSON(serviceName: string) {
  try {
    // Convert service name to filename format
    const filename = serviceName.toLowerCase().replace(/\s+/g, '-') + '.json';
    const filePath = path.join(process.cwd(), 'static', 'data', 'json', filename);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Service details file not found: ${filePath}`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading service details for ${serviceName}:`, error);
    return null;
  }
}

// Define the service data to seed
function getServicesToSeed() {
  return [
    {
      name: "Regular Cleaning",
      description: "Perfect for maintaining a clean and tidy home on a regular basis.",
      basePrice: 350,
      durationHours: 6,
      isActive: true
    },
    {
      name: "Regular Cleaning with Laundry & Ironing",
      description: "Standard cleaning service with laundry and ironing assistance.",
      basePrice: 450,
      durationHours: 8,
      isActive: true
    },
    {
      name: "Extended Cleaning",
      description: "A thorough cleaning service that reaches every corner and detail.",
      basePrice: 550,
      durationHours: 10,
      isActive: true
    },
    {
      name: "Office Cleaning",
      description: "Professional cleaning for your office space or commercial property.",
      basePrice: 450,
      durationHours: 6,
      isActive: true
    }
  ];
}

// Load additional services from JSON directory
function findAdditionalServices() {
  const jsonDir = path.join(process.cwd(), 'static', 'data', 'json');
  
  if (!fs.existsSync(jsonDir)) {
    console.log("No JSON directory found at:", jsonDir);
    return [];
  }
  
  const additionalServices = [];
  
  // Get all JSON files
  const jsonFiles = fs.readdirSync(jsonDir)
    .filter(file => file.endsWith('.json'));
  
  console.log(`Scanning ${jsonFiles.length} JSON files for additional services...`);
  
  // Extract service names from default services
  const defaultServiceNames = getServicesToSeed().map(s => s.name.toLowerCase());
  
  // Process each file
  for (const jsonFile of jsonFiles) {
    try {
      // Parse the JSON file
      const filePath = path.join(jsonDir, jsonFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const serviceData = JSON.parse(fileContent);
      
      // Skip if this is already a default service
      if (!serviceData.name || defaultServiceNames.includes(serviceData.name.toLowerCase())) {
        continue;
      }
      
      console.log(`Found additional service: "${serviceData.name}"`);
      
      // Try to guess some properties from the name
      const isExtended = serviceData.name.toLowerCase().includes("extended");
      const isOffice = serviceData.name.toLowerCase().includes("office");
      const isLaundry = serviceData.name.toLowerCase().includes("laundry");
      
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
      
      // Add to additional services
      additionalServices.push({
        name: serviceData.name,
        description,
        basePrice,
        durationHours,
        isActive: true
      });
    } catch (error) {
      console.error(`Error processing ${jsonFile}:`, error);
    }
  }
  
  return additionalServices;
}

// Seed services to the database
async function seedServices() {
  try {
    // Check if services already exist
    const existingServices = await db.select().from(schema.service);
    
    if (existingServices.length > 0 && !shouldOverwrite) {
      console.log("⚠️ Services already exist in the database");
      console.log(`Found ${existingServices.length} existing services.`);
      console.log('Run with --overwrite flag to replace existing services');
      console.log('Existing services:');
      existingServices.forEach(s => console.log(`- ${s.name}`));
      return;
    }
    
    // Get services to seed
    let servicesData = getServicesToSeed();
    
    // Find additional services from JSON files
    const additionalServices = findAdditionalServices();
    if (additionalServices.length > 0) {
      console.log(`Found ${additionalServices.length} additional services.`);
      servicesData = [...servicesData, ...additionalServices];
    }
    
    // Delete existing services if overwrite flag is provided
    if (existingServices.length > 0 && shouldOverwrite) {
      console.log(`Deleting ${existingServices.length} existing services...`);
      await db.delete(schema.service);
    }
    
    // Insert services
    console.log(`Seeding ${servicesData.length} services...`);
    
    let successCount = 0;
    
    for (const serviceData of servicesData) {
      try {
        // Load service details from JSON file
        const details = loadServiceDetailsFromJSON(serviceData.name);
        
        // Insert the service
        const [newService] = await db.insert(schema.service)
          .values({
            id: crypto.randomUUID(),
            ...serviceData,
            details: details ? JSON.stringify(details) : null,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        console.log(`✓ Service "${serviceData.name}" added successfully!`);
        successCount++;
      } catch (error) {
        console.error(`Error adding service "${serviceData.name}":`, error);
      }
    }
    
    console.log(`Successfully seeded ${successCount} out of ${servicesData.length} services.`);
  } catch (error) {
    console.error("Error seeding services:", error);
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run the script
seedServices();
