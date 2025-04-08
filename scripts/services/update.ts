// scripts/services/update.ts
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  closeConnection,
  confirmAction,
  createDbConnection,
  ensureDirectoryExists,
  createDataBackup,
  logDbInfo,
  isProduction
} from "../db/utils";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const options = {
  sortOrder: args.includes("--sort-order"),
  updateDetails: args.includes("--details") || !args.includes("--sort-order"),
  forceProduction: args.includes("--production"),
  confirm: args.includes("--confirm") || args.includes("-y"),
  verbose: args.includes("--verbose") || args.includes("-v"),
};

async function updateServices() {
  // Log database info
  const { isProduction } = logDbInfo();

  // Safety check for production
  if (isProduction && !options.forceProduction) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "⚠️ DANGER: Production database detected!"
    );
    console.error(
      "\x1b[31m%s\x1b[0m",
      "Use --production flag to update production services."
    );
    process.exit(1);
  }

  if (isProduction && options.forceProduction && !options.confirm) {
    const proceed = await confirmAction(
      "⚠️ You are about to UPDATE SERVICES in a PRODUCTION database. Are you sure?"
    );
    
    if (!proceed) {
      console.log("Operation cancelled");
      process.exit(0);
    }
  }

  // Create database connection
  const { client, db } = createDbConnection();

  try {
    // Fetch services from database
    console.log("Fetching services from database...");
    const services = await db.select().from(db.schema.service);
    
    if (services.length === 0) {
      console.log("No services found in database. Please run the seeder first.");
      return;
    }
    
    console.log(`Found ${services.length} services in database.`);
    
    // Create a backup of the current services
    createDataBackup(services, "services-before-update");
    
    // Update sort order if requested
    if (options.sortOrder) {
      await updateServiceSortOrder(db, services);
    }
    
    // Update service details if requested
    if (options.updateDetails) {
      await updateServiceDetails(db, services);
    }
    
    console.log("Service update completed successfully!");
  } catch (error) {
    console.error("Error updating services:", error);
  } finally {
    await closeConnection(client);
  }
}

// Update service sort order
async function updateServiceSortOrder(db: any, services: any[]) {
  console.log("Updating service display order...");
  
  // Define the service order mapping
  const serviceOrders = [
    { name: "Regular Cleaning", order: 1 },
    { name: "Regular Cleaning with Laundry & Ironing", order: 2 },
    { name: "Extended Cleaning", order: 3 },
    { name: "Office Cleaning", order: 4 }
  ];

  let updatedCount = 0;
  
  // Update each service
  for (const orderConfig of serviceOrders) {
    // Find services that match this name (exact or partial)
    const matchingServices = services.filter(svc => 
      svc.name === orderConfig.name || 
      (svc.name.includes(orderConfig.name) && orderConfig.name !== "Office Cleaning")
    );
    
    if (matchingServices.length === 0) {
      console.warn(`⚠️ No service matching "${orderConfig.name}" found`);
      continue;
    }
    
    for (const service of matchingServices) {
      console.log(`Setting order ${orderConfig.order} for "${service.name}"`);
      
      // Update the service
      await db.update(db.schema.service)
        .set({ 
          sortOrder: orderConfig.order,
          updatedAt: new Date()
        })
        .where(eq(db.schema.service.id, service.id));
      
      updatedCount++;
    }
  }
  
  // Set default high value for any services not explicitly ordered
  const serviceNames = serviceOrders.map(so => so.name);
  const otherServices = services.filter(svc => 
    !serviceNames.some(name => svc.name === name || svc.name.includes(name))
  );
  
  if (otherServices.length > 0) {
    console.log(`Setting default sort order (999) for ${otherServices.length} other services`);
    
    for (const service of otherServices) {
      await db.update(db.schema.service)
        .set({ 
          sortOrder: 999,
          updatedAt: new Date()
        })
        .where(eq(db.schema.service.id, service.id));
      
      updatedCount++;
    }
  }
  
  console.log(`✅ Updated sort order for ${updatedCount} services`);
}

// Update service details from files
async function updateServiceDetails(db: any, services: any[]) {
  console.log("Updating service details from files...");
  
  // Ensure directories exist
  const dataDir = path.join(process.cwd(), "static", "data");
  const jsonDir = path.join(dataDir, "json");
  ensureDirectoryExists(dataDir);
  ensureDirectoryExists(jsonDir);
  
  let updatedCount = 0;
  
  // Update each service
  for (const service of services) {
    const serviceName = service.name;
    console.log(`Processing service: ${serviceName}`);
    
    // Find the appropriate file
    const serviceFilePath = findServiceFile(serviceName);
    
    if (!serviceFilePath) {
      console.warn(`⚠️ No detail file found for "${serviceName}". Skipping.`);
      continue;
    }
    
    if (options.verbose) {
      console.log(`Found service file: ${serviceFilePath}`);
    }
    
    try {
      // Parse the service details
      const serviceDetails = parseServiceDetails(serviceFilePath);
      
      // Update just the 'details' field
      await db.update(db.schema.service)
        .set({
          details: JSON.stringify(serviceDetails),
          updatedAt: new Date()
        })
        .where(eq(db.schema.service.id, service.id));
      
      updatedCount++;
      console.log(`✓ Updated details for "${serviceName}"`);
    } catch (error) {
      console.error(`Error updating "${serviceName}":`, error);
    }
  }
  
  console.log(`✅ Updated details for ${updatedCount} out of ${services.length} services`);
}

// Find service description file (JSON or CSV)
function findServiceFile(serviceName: string): string | null {
  // Define possible file paths to check
  const possiblePaths = [
    // JSON file in json subdirectory (preferred)
    path.join(process.cwd(), "static", "data", "json", `${serviceName.toLowerCase().replace(/\s+/g, '-')}.json`),
    // CSV file in data directory
    path.join(process.cwd(), "static", "data", `BrightBroom Service Description - ${serviceName}.csv`),
    // CSV file in csv subdirectory
    path.join(process.cwd(), "static", "data", "csv", `BrightBroom Service Description - ${serviceName}.csv`),
  ];
  
  // Try each path
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  // Try partial matches for CSV files
  const dataDirFiles = fs.existsSync(path.join(process.cwd(), "static", "data")) 
    ? fs.readdirSync(path.join(process.cwd(), "static", "data"))
    : [];
    
  const csvDirFiles = fs.existsSync(path.join(process.cwd(), "static", "data", "csv")) 
    ? fs.readdirSync(path.join(process.cwd(), "static", "data", "csv"))
    : [];
    
  const allCsvFiles = [
    ...dataDirFiles.map(f => path.join(process.cwd(), "static", "data", f)),
    ...csvDirFiles.map(f => path.join(process.cwd(), "static", "data", "csv", f))
  ].filter(f => f.endsWith('.csv'));
  
  // Try to find a file that contains the service name
  for (const file of allCsvFiles) {
    const fileName = path.basename(file);
    if (fileName.includes(serviceName) || serviceName.includes(fileName.replace('BrightBroom Service Description - ', '').replace('.csv', ''))) {
      return file;
    }
  }
  
  return null;
}

// Parse service details from a file
function parseServiceDetails(filePath: string): any {
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
function parseServiceDetailsFromCSV(csvContent: string): any {
  const items = [];
  
  // Split by lines
  const lines = csvContent.split("\n").filter(line => line.trim() !== "");
  
  // Extract service name from header if possible
  const headerMatch = lines[0]?.match(/BrightBroom Service Description - (.+)/);
  const serviceName = headerMatch ? headerMatch[1] : "Unknown Service";
  
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
  
  return { name: serviceName, items };
}

// Run the script
updateServices().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
