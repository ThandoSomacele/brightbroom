// scripts/fix-service-schema.js
import dotenv from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenv.config();

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    console.log("Adding columns to service table...");
    
    // Add details column if it doesn't exist
    await sql`
      ALTER TABLE "service" 
      ADD COLUMN IF NOT EXISTS "details" TEXT,
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE NOT NULL
    `;
    
    console.log("Columns added successfully!");
  } catch (error) {
    console.error("Error updating service schema:", error);
  } finally {
    await sql.end();
  }
}

main();