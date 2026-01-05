// scripts/deploy/validate-env.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Required environment variables
const REQUIRED_VARS = [
  "DATABASE_URL",
  "PUBLIC_URL",
  "GOOGLE_MAPS_API_KEY",
  "RESEND_API_KEY",
];

// Production-specific required variables
const PRODUCTION_REQUIRED_VARS = [
  "DATABASE_URL_PRODUCTION",
  "PAYFAST_MERCHANT_ID",
  "PAYFAST_MERCHANT_KEY",
  "PAYFAST_PASSPHRASE",
];

// Function to validate environment variables
async function validateEnvironment() {
  console.log("🔍 Validating environment variables...");

  // Check NODE_ENV
  const environment = process.env.NODE_ENV || "development";
  console.log(`Environment: ${environment}`);

  // Check required variables
  const missingVars = [];

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Check production variables if in production
  if (environment === "production") {
    for (const varName of PRODUCTION_REQUIRED_VARS) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
  }

  // Report missing variables
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });

    console.log(
      "\nPlease add these variables to your .env file or deployment environment.",
    );
    process.exit(1);
  } else {
    console.log("✅ All required environment variables are present.");
  }

  // Check database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (
    dbUrl &&
    !dbUrl.startsWith("postgres://") &&
    !dbUrl.startsWith("postgresql://")
  ) {
    console.error(
      "❌ DATABASE_URL must start with postgres:// or postgresql://",
    );
    process.exit(1);
  }

  // If we made it here, everything is valid
  console.log("✅ Environment validation passed.");
}

// Run validation
validateEnvironment();
