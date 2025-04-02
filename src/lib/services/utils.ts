// src/lib/services/utils.ts
import type { Service, ServiceDetailItem, ServiceDetails, ServicePricing } from './types';

/**
 * Format price as currency (ZAR)
 * @param amount Amount to format
 * @returns Formatted price string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format duration in hours and minutes
 * @param hours Duration in hours (can be decimal)
 * @returns Formatted duration string
 */
export function formatDuration(hours: number): string {
  if (hours === 0) return "0 min";

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) return `${minutes} min`;
  if (minutes === 0) return `${wholeHours} ${wholeHours === 1 ? "hour" : "hours"}`;

  return `${wholeHours} ${wholeHours === 1 ? "hour" : "hours"} ${minutes} min`;
}

/**
 * Calculate VAT and total price
 * @param basePrice Base price excluding VAT
 * @param vatRate VAT rate (default 15%)
 * @returns Pricing information
 */
export function calculatePricing(basePrice: number, vatRate: number = 15): ServicePricing {
  const vatAmount = (basePrice * vatRate) / 100;
  const totalPrice = basePrice + vatAmount;
  
  return {
    basePrice,
    vatRate,
    vatAmount,
    totalPrice
  };
}

/**
 * Parse CSV content into service detail items
 * @param csvContent CSV content as string
 * @returns Array of service detail items
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
 * Parse stringified JSON service details
 * @param detailsString Service details as JSON string
 * @returns Parsed service details or null
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

/**
 * Stringify service details for storage
 * @param details Service details object
 * @returns JSON string
 */
export function stringifyServiceDetails(details: ServiceDetails): string {
  return JSON.stringify(details);
}

/**
 * Get display-friendly service type
 * @param type Service type
 * @returns Display-friendly type name
 */
export function getServiceTypeDisplay(type: string): string {
  switch (type.toLowerCase()) {
    case 'regular':
      return 'Regular Cleaning';
    case 'extended':
      return 'Extended Cleaning';
    default:
      return type;
  }
}

/**
 * Find a service by ID
 * @param id Service ID
 * @param services Array of services to search
 * @returns Found service or undefined
 */
export function findServiceById(id: string, services: Service[]): Service | undefined {
  return services.find(service => service.id === id);
}

/**
 * Group services by category
 * @param services Services to group
 * @returns Record of category to services
 */
export function groupServicesByCategory(services: Service[]): Record<string, Service[]> {
  return services.reduce((grouped, service) => {
    const category = service.category || 'uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(service);
    return grouped;
  }, {} as Record<string, Service[]>);
}

/**
 * Generate default details structure for a service
 * @param serviceName Name of the service 
 * @param type Service type
 * @returns Service details object
 */
export function generateDefaultServiceDetails(serviceName: string, type: string): ServiceDetails {
  const detailsObject: ServiceDetails = {
    name: serviceName,
    items: []
  };
  
  // Define different detail templates based on service type
  if (type === 'regular') {
    detailsObject.items = [
      {
        area: "LIVING AREAS",
        details: [
          "Dusting of all surfaces and furniture",
          "Vacuuming of carpets and rugs",
          "Mopping of hard floors",
          "Cleaning of mirrors and glass surfaces",
          "Wiping down of door handles and light switches"
        ]
      },
      {
        area: "KITCHEN",
        details: [
          "Cleaning of counter tops and backsplash",
          "Wiping down of cabinets and appliance exteriors",
          "Cleaning inside microwave",
          "Scrubbing sink and fixtures",
          "Sweeping and mopping floors"
        ]
      },
      {
        area: "BEDROOMS",
        details: [
          "Making beds",
          "Vacuuming or mopping floors",
          "Dusting furniture and surfaces",
          "Wiping down light switches",
          "Emptying trash bins"
        ]
      },
      {
        area: "BATHROOMS",
        details: [
          "Cleaning and sanitizing toilet, shower, tub and sink",
          "Wiping down all surfaces",
          "Cleaning mirrors",
          "Sweeping and mopping floors",
          "Emptying trash bins"
        ]
      }
    ];
  } else if (type === 'extended') {
    detailsObject.items = [
      {
        area: "LIVING AREAS",
        details: [
          "Deep dusting of all surfaces, including hard-to-reach areas",
          "Vacuuming of carpets, rugs, and upholstery",
          "Detailed cleaning of baseboards and trim",
          "Thorough cleaning of window sills and blinds",
          "Dusting of ceiling fans and light fixtures",
          "Removal of cobwebs from corners and ceilings",
          "Spot cleaning of walls and doors"
        ]
      },
      {
        area: "KITCHEN",
        details: [
          "Deep cleaning of all appliance exteriors",
          "Interior cleaning of refrigerator and oven",
          "Detailed cleaning inside cabinets",
          "Scrubbing of backsplash and behind appliances",
          "Deep cleaning of sink and faucets",
          "Detailed floor cleaning, including edges and corners"
        ]
      },
      {
        area: "BEDROOMS",
        details: [
          "Detailed dusting of all furniture and fixtures",
          "Cleaning under beds and furniture",
          "Wiping down of all surfaces and detail work",
          "Cleaning of picture frames and decor",
          "Thorough vacuuming including furniture"
        ]
      },
      {
        area: "BATHROOMS",
        details: [
          "Deep cleaning of shower doors and tile grout",
          "Scrubbing and sanitizing of all bathroom surfaces",
          "Detailed cleaning of fixtures and hardware",
          "Thorough cleaning of vanity and medicine cabinet",
          "Deep cleaning of toilet areas including base and behind",
          "Treatment of mold or mildew areas"
        ]
      }
    ];
  }
  
  return detailsObject;
}
