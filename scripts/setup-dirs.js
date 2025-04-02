// scripts/setup-dirs.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to ensure exist
const directories = [
  path.join(__dirname, '../static/data/json'),
  path.join(__dirname, '../static/data/csv'),
  path.join(__dirname, '../static/images'),
  path.join(__dirname, '../src/lib/types'),
  path.join(__dirname, '../src/lib/utils'),
  path.join(__dirname, '../src/lib/stores'),
  path.join(__dirname, '../src/lib/components/admin'),
  path.join(__dirname, '../src/lib/components/booking'),
  path.join(__dirname, '../src/lib/components/profile'),
  path.join(__dirname, '../src/lib/components/services'),
];

// Create directories if they don't exist
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log('Setup complete. Project directories created.');
