// scripts/update-service-order.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Establish database connection
const client = postgres(DATABASE_URL);

// Import the schema directly to avoid SvelteKit-specific imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a simplified version of the service schema
const service = {
  id: { name: "id" },
  name: { name: "name" },
  sortOrder: { name: "sort_order" }
};

// Create Drizzle instance
const db = drizzle(client);

async function updateServiceOrders() {
  try {
    console.log("🔵 Updating service display order...");

    // Define the service order mapping
    const serviceOrders = [
      { name: "Regular Cleaning", order: 1 },
      { name: "Regular Cleaning with Laundry & Ironing", order: 2 },
      { name: "Extended Cleaning", order: 3 },
      { name: "Office Cleaning", order: 4 }
    ];

    // Update each service
    for (const svc of serviceOrders) {
      console.log(`Setting order ${svc.order} for "${svc.name}"`);
      
      // Use SQL query directly since we don't have the schema
      const result = await client.query(
        `UPDATE service SET sort_order = $1 WHERE name = $2 RETURNING id, name`,
        [svc.order, svc.name]
      );
      
      if (result.length === 0) {
        console.warn(`⚠️ Service "${svc.name}" not found`);
      } else {
        console.log(`✅ Updated ${result.length} service(s)`);
      }
    }

    // Set default high value for any services not explicitly ordered
    const otherResult = await client.query(
      `UPDATE service SET sort_order = 999 WHERE name NOT IN (${serviceOrders.map((_, i) => `$${i+1}`).join(", ")}) RETURNING id, name`,
      serviceOrders.map(s => s.name)
    );
    
    console.log(`✅ Set default sort order for ${otherResult.length} other services`);
    console.log("✅ Service order update completed");
  } catch (error) {
    console.error("❌ Error updating service orders:", error);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Execute the function
updateServiceOrders()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  });
