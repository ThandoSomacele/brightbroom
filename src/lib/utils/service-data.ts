// src/lib/utils/service-data.ts
import Papa from 'papaparse';

/**
 * Interface for a service line item
 */
export interface ServiceLineItem {
  area: string;
  duration: number;
  price: number;
}

/**
 * Processes CSV content and returns structured service line items
 */
export async function parseServiceCsv(csvContent: string): Promise<ServiceLineItem[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true, // Automatically convert numeric values
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Map the parsed results to our interface
          const lineItems: ServiceLineItem[] = results.data.map((row: any) => ({
            area: row['Area'] || '',
            duration: parseFloat(row['Duration (hrs)']) || 0,
            price: parseFloat(row['Price']) || 0
          }));
          
          resolve(lineItems);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Loads service data from a CSV file
 */
export async function loadServiceData(serviceType: 'regular' | 'extended'): Promise<ServiceLineItem[]> {
  try {
    const fileName = serviceType === 'regular' 
      ? 'BrightBroom Service Description Regular Cleaning.csv'
      : 'BrightBroom Service Description Extended Cleaning.csv';
    
    const response = await window.fs.readFile(fileName);
    const text = new TextDecoder().decode(response);
    
    return await parseServiceCsv(text);
  } catch (error) {
    console.error(`Error loading ${serviceType} service data:`, error);
    return [];
  }
}

/**
 * Groups service line items by area (for UI organization)
 */
export function groupServiceItemsByArea(items: ServiceLineItem[]): Record<string, ServiceLineItem[]> {
  return items.reduce((groups, item) => {
    // Create a new area category if it doesn't exist
    if (!groups[item.area]) {
      groups[item.area] = [];
    }
    
    // Add the item to its area group
    groups[item.area].push(item);
    
    return groups;
  }, {} as Record<string, ServiceLineItem[]>);
}

/**
 * Calculates service totals
 */
export function calculateServiceTotals(items: ServiceLineItem[]): { totalPrice: number; totalDuration: number } {
  return items.reduce((totals, item) => {
    return {
      totalPrice: totals.totalPrice + item.price,
      totalDuration: totals.totalDuration + item.duration
    };
  }, { totalPrice: 0, totalDuration: 0 });
}
