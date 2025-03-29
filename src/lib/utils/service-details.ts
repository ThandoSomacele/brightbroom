/**
 * Utility functions for handling service details from CSV files
 */

import fs from 'fs';
import path from 'path';

/**
 * Interface for service details
 */
export interface ServiceDetailItem {
  area: string;
  details: string[];
}

/**
 * Interface for the complete service detail structure
 */
export interface ServiceDetails {
  name: string;
  items: ServiceDetailItem[];
}

/**
 * Parse a CSV file containing service details
 * 
 * @param filename The name of the CSV file to parse
 * @returns An array of service details items
 */
export function parseServiceDetailsFromCSV(csvContent: string): ServiceDetailItem[] {
  const items: ServiceDetailItem[] = [];
  
  // Split by lines
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  // Skip header
  let i = 1;
  
  while (i < lines.length) {
    // The area name is a line in all caps
    const area = lines[i].trim();
    i++;
    
    const details: string[] = [];
    
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

/**
 * Load service details based on service name
 * 
 * @param serviceName The name of the service
 * @returns Structured service details or null if not found
 */
export async function loadServiceDetails(serviceName: string): Promise<ServiceDetails | null> {
  try {
    let filename: string;
    
    if (serviceName.toLowerCase().includes('regular')) {
      filename = 'BrightBroom Service Description - Regular Cleaning.csv';
    } else if (serviceName.toLowerCase().includes('extended') || serviceName.toLowerCase().includes('deep')) {
      filename = 'BrightBroom Service Description - Extended Cleaning.csv';
    } else {
      // Default to regular cleaning for now
      filename = 'BrightBroom Service Description - Regular Cleaning.csv';
    }
    
    const filePath = path.join(process.cwd(), 'static', 'data', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const items = parseServiceDetailsFromCSV(fileContent);
    
    return {
      name: serviceName,
      items
    };
  } catch (error) {
    console.error(`Error loading service details for ${serviceName}:`, error);
    return null;
  }
}

/**
 * Stringify service details for storage in the database
 */
export function stringifyServiceDetails(details: ServiceDetails): string {
  return JSON.stringify(details);
}

/**
 * Parse service details from a database string
 */
export function parseServiceDetails(detailsString: string | null): ServiceDetails | null {
  if (!detailsString) return null;
  
  try {
    return JSON.parse(detailsString) as ServiceDetails;
  } catch (error) {
    console.error('Error parsing service details:', error);
    return null;
  }
}