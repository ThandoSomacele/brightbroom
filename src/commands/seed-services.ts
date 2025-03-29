// src/commands/seed-services.ts
import { db } from "$lib/server/db";
import { service } from "$lib/server/db/schema";
import { parseServiceDetailsFromCSV } from "$lib/utils/service-details";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedServices() {
  console.log("🔵 Starting services seeding...");

  // Define the service data
  const services = [
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

  try {
    // Check if services already exist
    const existingServices = await db.select().from(service);
    
    if (existingServices.length > 0) {
      console.log("⚠️ Services already exist in the database");
      const overwrite = process.argv.includes("--overwrite");
      
      if (!overwrite) {
        console.log("🔶 Use --overwrite flag to replace existing services");
        console.log("🔶 Existing services:", existingServices.map(s => s.name).join(", "));
        return;
      }
      
      // Delete existing services if overwrite flag is provided
      console.log("🚮 Deleting existing services...");
      await db.delete(service);
    }

    // Load service details from CSV files
    for (const serviceData of services) {
      const details = await loadServiceDetails(serviceData.name);
      
      if (details) {
        serviceData.details = JSON.stringify(details);
      }
    }

    // Insert the services
    console.log("🌱 Inserting services...");
    await db.insert(service).values(services);

    console.log("✅ Services seeded successfully!");
    console.log("📋 Services:");
    services.forEach(s => {
      console.log(`   - ${s.name}: R${s.basePrice} (${s.durationHours} hours)`);
    });
  } catch (error) {
    console.error("❌ Error seeding services:", error);
    process.exit(1);
  }
}

/**
 * Load service details from CSV
 */
function loadServiceDetails(serviceName: string) {
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
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Service details file not found: ${filename}`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const items = parseServiceDetailsFromCSV(fileContent);
    
    return {
      name: serviceName,
      items
    };
  } catch (error) {
    console.error(`❌ Error loading service details for ${serviceName}:`, error);
    return null;
  }
}

// Run the seeding
seedServices();
