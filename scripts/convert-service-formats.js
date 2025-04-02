// scripts/convert-service-formats.js
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const JSON_DIR = path.join(process.cwd(), 'static', 'data', 'json');
const CSV_DIR = path.join(process.cwd(), 'static', 'data', 'csv');
const OUTPUT_DIR = path.join(process.cwd(), 'static', 'data');

// Create directories if they don't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Convert a JSON service file to CSV
function jsonToCsv(jsonFilePath, outputDir) {
  try {
    // Read and parse JSON file
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const serviceData = JSON.parse(jsonContent);
    const serviceName = serviceData.name;
    
    let csvRows = [];
    
    // Add header row
    csvRows.push(['AREA', 'DETAILS']);
    
    // Add data rows
    serviceData.items.forEach(item => {
      // Push area as a row
      csvRows.push([item.area, '']);
      
      // Push each detail as a row
      item.details.forEach(detail => {
        csvRows.push(['', detail]);
      });
      
      // Add empty row between areas for readability
      csvRows.push(['', '']);
    });
    
    // Remove the last empty row
    csvRows.pop();
    
    // Convert to CSV format
    const csv = Papa.unparse(csvRows);
    
    // Define output path
    const outputFileName = `BrightBroom Service Description - ${serviceName}.csv`;
    const outputPath = path.join(outputDir, outputFileName);
    
    // Write to file
    fs.writeFileSync(outputPath, csv);
    console.log(`Converted JSON to CSV: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`Error converting JSON to CSV: ${error.message}`);
    return null;
  }
}

// Convert a CSV service file to JSON
function csvToJson(csvFilePath, outputDir) {
  try {
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse CSV content
    const parsedCsv = Papa.parse(csvContent, { header: false, skipEmptyLines: true });
    const rows = parsedCsv.data;
    
    // Extract service name from filename
    const fileName = path.basename(csvFilePath);
    const serviceNameMatch = fileName.match(/BrightBroom Service Description - (.+)\.csv/);
    const serviceName = serviceNameMatch ? serviceNameMatch[1] : 'Unknown Service';
    
    // Process rows into areas and details
    const items = [];
    let currentArea = null;
    let currentDetails = [];
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const [area, detail] = rows[i];
      
      if (area && area.trim()) {
        // If there was a previous area, save it
        if (currentArea && currentDetails.length > 0) {
          items.push({
            area: currentArea,
            details: [...currentDetails]
          });
          currentDetails = [];
        }
        
        // Start a new area
        currentArea = area.trim();
      } else if (detail && detail.trim() && currentArea) {
        // Add detail to current area
        currentDetails.push(detail.trim());
      }
    }
    
    // Add the last area if there is one
    if (currentArea && currentDetails.length > 0) {
      items.push({
        area: currentArea,
        details: [...currentDetails]
      });
    }
    
    // Create JSON structure
    const jsonData = {
      name: serviceName,
      items
    };
    
    // Define output path
    const outputFileName = serviceName.toLowerCase().replace(/\s+/g, '-') + '.json';
    const outputPath = path.join(outputDir, outputFileName);
    
    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`Converted CSV to JSON: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`Error converting CSV to JSON: ${error.message}`);
    return null;
  }
}

// Convert all JSON files to CSV
function convertAllJsonToCsv() {
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Get all JSON files
  const jsonFiles = fs.readdirSync(JSON_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(JSON_DIR, file));
  
  console.log(`Found ${jsonFiles.length} JSON files to convert`);
  
  // Convert each file
  jsonFiles.forEach(jsonFile => {
    jsonToCsv(jsonFile, OUTPUT_DIR);
  });
}

// Convert all CSV files to JSON
function convertAllCsvToJson() {
  ensureDirectoryExists(JSON_DIR);
  
  // Get all CSV files
  const csvFiles = fs.readdirSync(OUTPUT_DIR)
    .filter(file => file.endsWith('.csv') && file.includes('BrightBroom Service Description'))
    .map(file => path.join(OUTPUT_DIR, file));
  
  console.log(`Found ${csvFiles.length} CSV files to convert`);
  
  // Convert each file
  csvFiles.forEach(csvFile => {
    csvToJson(csvFile, JSON_DIR);
  });
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  
  console.log('Service Format Conversion Tool');
  console.log('==============================');
  
  switch (mode) {
    case 'json-to-csv':
      console.log('Converting JSON to CSV...');
      convertAllJsonToCsv();
      break;
    
    case 'csv-to-json':
      console.log('Converting CSV to JSON...');
      convertAllCsvToJson();
      break;
    
    case 'both':
      console.log('Converting in both directions...');
      convertAllJsonToCsv();
      convertAllCsvToJson();
      break;
    
    default:
      console.log('Usage:');
      console.log('  node convert-service-formats.js json-to-csv    # Convert JSON to CSV');
      console.log('  node convert-service-formats.js csv-to-json    # Convert CSV to JSON');
      console.log('  node convert-service-formats.js both           # Convert in both directions');
  }
}

// Run the script
main();
