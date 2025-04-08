// scripts/services/convert.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectoryExists } from '../db/utils';

// Get current directory for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line args
const args = process.argv.slice(2);
const mode = args[0] || 'both';
const verbose = args.includes('--verbose') || args.includes('-v');

// Define directory paths
const DATA_DIR = path.join(process.cwd(), 'static', 'data');
const JSON_DIR = path.join(DATA_DIR, 'json');
const CSV_DIR = path.join(DATA_DIR, 'csv');

/**
 * Parse CSV content into service detail items
 * @param csvContent CSV content as string
 */
function parseServiceDetailsFromCSV(csvContent: string): { items: Array<{ area: string, details: string[] }> } {
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
  
  return { items };
}

/**
 * Convert CSV file to JSON
 * @param csvFilePath Path to the CSV file
 * @param outputDir Output directory for JSON
 * @returns Path to the created JSON file or null if failed
 */
function csvToJson(csvFilePath: string, outputDir: string): string | null {
  try {
    // Read CSV content
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // Extract service name from filename
    const fileName = path.basename(csvFilePath);
    const serviceNameMatch = fileName.match(/BrightBroom Service Description - (.+)\.csv/);
    const serviceName = serviceNameMatch ? serviceNameMatch[1] : 'Unknown Service';
    
    // Parse CSV to service details
    const serviceDetails = parseServiceDetailsFromCSV(csvContent);
    serviceDetails.name = serviceName;
    
    // Create JSON filename
    const jsonFile = `${serviceName.toLowerCase().replace(/\s+/g, '-')}.json`;
    const outputPath = path.join(outputDir, jsonFile);
    
    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(serviceDetails, null, 2));
    if (verbose) console.log(`Converted CSV to JSON: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`Error converting CSV to JSON: ${csvFilePath}`, error);
    return null;
  }
}

/**
 * Convert JSON file to CSV
 * @param jsonFilePath Path to the JSON file
 * @param outputDir Output directory for CSV
 * @returns Path to the created CSV file or null if failed
 */
function jsonToCsv(jsonFilePath: string, outputDir: string): string | null {
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
    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Define output path
    const outputFileName = `BrightBroom Service Description - ${serviceName}.csv`;
    const outputPath = path.join(outputDir, outputFileName);
    
    // Write to file
    fs.writeFileSync(outputPath, csv);
    if (verbose) console.log(`Converted JSON to CSV: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`Error converting JSON to CSV: ${jsonFilePath}`, error);
    return null;
  }
}

/**
 * Convert all JSON files to CSV
 */
function convertAllJsonToCsv(): void {
  ensureDirectoryExists(CSV_DIR);
  
  // Get all JSON files
  const jsonFiles = fs.readdirSync(JSON_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(JSON_DIR, file));
  
  console.log(`Found ${jsonFiles.length} JSON files to convert to CSV`);
  
  // Convert each file
  const converted = jsonFiles.map(jsonFile => jsonToCsv(jsonFile, CSV_DIR))
    .filter(Boolean).length;
  
  console.log(`Successfully converted ${converted} JSON files to CSV`);
}

/**
 * Convert all CSV files to JSON
 */
function convertAllCsvToJson(): void {
  ensureDirectoryExists(JSON_DIR);
  
  // First check in the main data directory
  let csvFiles = fs.readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.csv') && file.includes('BrightBroom Service Description'))
    .map(file => path.join(DATA_DIR, file));
  
  // Then check in the CSV directory if it exists
  if (fs.existsSync(CSV_DIR)) {
    const csvDirFiles = fs.readdirSync(CSV_DIR)
      .filter(file => file.endsWith('.csv') && file.includes('BrightBroom Service Description'))
      .map(file => path.join(CSV_DIR, file));
    
    csvFiles = [...csvFiles, ...csvDirFiles];
  }
  
  console.log(`Found ${csvFiles.length} CSV files to convert to JSON`);
  
  // Convert each file
  const converted = csvFiles.map(csvFile => csvToJson(csvFile, JSON_DIR))
    .filter(Boolean).length;
  
  console.log(`Successfully converted ${converted} CSV files to JSON`);
}

/**
 * Main function
 */
function main(): void {
  console.log('Service Format Conversion Tool');
  console.log('==============================');
  
  // Create directories if they don't exist
  ensureDirectoryExists(DATA_DIR);
  ensureDirectoryExists(JSON_DIR);
  ensureDirectoryExists(CSV_DIR);
  
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
      convertAllCsvToJson();
      convertAllJsonToCsv();
      break;
    
    default:
      console.log('Usage:');
      console.log('  npm run services:convert json-to-csv    # Convert JSON to CSV');
      console.log('  npm run services:convert csv-to-json    # Convert CSV to JSON');
      console.log('  npm run services:convert both           # Convert in both directions');
      console.log('  npm run services:convert --verbose      # Show detailed conversion logs');
  }
  
  console.log('Conversion process complete.');
}

// Run the script
main();
