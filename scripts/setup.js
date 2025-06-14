// scripts/setup.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to ensure exist
const directories = [
  // Data directories
  path.join(process.cwd(), "static/data"),
  path.join(process.cwd(), "static/data/json"),
  path.join(process.cwd(), "static/data/csv"),
  path.join(process.cwd(), "static/images"),
  path.join(process.cwd(), "backups"),

  // Source code directories
  path.join(process.cwd(), "src/lib/types"),
  path.join(process.cwd(), "src/lib/utils"),
  path.join(process.cwd(), "src/lib/stores"),
  path.join(process.cwd(), "src/lib/components/admin"),
  path.join(process.cwd(), "src/lib/components/booking"),
  path.join(process.cwd(), "src/lib/components/profile"),
  path.join(process.cwd(), "src/lib/components/services"),

  // Script organisation
  path.join(process.cwd(), "scripts/db"),
  path.join(process.cwd(), "scripts/services"),
  path.join(process.cwd(), "scripts/deploy"),
];

// Create directories if they don't exist
directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log("Setup complete. Project directories created.");
