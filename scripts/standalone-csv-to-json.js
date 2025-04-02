// scripts/standalone-csv-to-json.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse CSV content into service detail items
 * @param csvContent CSV content as string
 */
function parseServiceDetailsFromCSV(csvContent) {
  const items = [];
  
  // Split by lines
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  // Skip header
  let i = 1;
  
  while (i < lines.length) {
    // The area name is a line in all caps
    const area = lines[i].trim();
    i++;
    
    const details = [];
    
    // Collect all details until we hit the next area (all caps) or end of file
    while (i < lines.length && !lines[i].trim().match(/^[A-Z\s]+$/)) {
      details.push(lines[i].trim().replace(/"/g, ''));
      i++;
    }
    
    // Add this area with its details
    if (details.length > 0) {
      items.push({ area, details });
    }
  }
  
  return items;
}

// Define paths
const csvDir = path.join(process.cwd(), 'static', 'data');
const jsonDir = path.join(process.cwd(), 'static', 'data', 'json');

// Ensure json directory exists
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}

// Get all CSV files
const csvFiles = fs.readdirSync(csvDir).filter(file => file.endsWith('.csv'));

// Process each CSV file
csvFiles.forEach(csvFile => {
  console.log(`Processing ${csvFile}...`);
  
  // Read CSV content
  const csvContent = fs.readFileSync(path.join(csvDir, csvFile), 'utf8');
  
  // Parse CSV to service details
  const items = parseServiceDetailsFromCSV(csvContent);
  
  // Create service details object
  const serviceName = csvFile.replace('BrightBroom Service Description - ', '').replace('.csv', '');
  const serviceDetails = {
    name: serviceName,
    items
  };
  
  // Convert to JSON
  const jsonContent = JSON.stringify(serviceDetails, null, 2);
  
  // Create JSON filename
  const jsonFile = `${serviceName.toLowerCase().replace(/\s+/g, '-')}.json`;
  
  // Write JSON file
  fs.writeFileSync(path.join(jsonDir, jsonFile), jsonContent);
  
  console.log(`Created ${jsonFile}`);
});

console.log('Conversion complete!');
