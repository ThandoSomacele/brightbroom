// scripts/apply-unique-constraint.ts
import { db } from "../src/lib/server/db/index.js";
import { sql } from "drizzle-orm";

async function applyUniqueConstraint() {
  console.log("Applying unique constraint to address table...");

  try {
    await db.execute(
      sql`ALTER TABLE "address" ADD CONSTRAINT "unique_user_address" UNIQUE("user_id","street","apt_unit","city","state","zip_code")`
    );
    console.log("✅ Unique constraint applied successfully!");
  } catch (error: any) {
    if (error.code === "42P07") {
      // Constraint already exists
      console.log("✅ Unique constraint already exists!");
    } else {
      console.error("❌ Error applying constraint:", error);
      throw error;
    }
  }
}

applyUniqueConstraint().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
