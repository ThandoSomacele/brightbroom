// src/lib/utils/serviceAreaValidator.ts

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * 
 * @param lat1 Latitude of the first point (booking address)
 * @param lng1 Longitude of the first point (booking address)
 * @param lat2 Latitude of the second point (cleaner location)
 * @param lng2 Longitude of the second point (cleaner location)
 * @returns Distance in kilometers (rounded to 1 decimal place)
 */
export function getDistanceFromLatLonInKm(
  lat1: number | string | null | undefined,
  lng1: number | string | null | undefined,
  lat2: number | string | null | undefined,
  lng2: number | string | null | undefined
): number {
  // Safe conversion to numbers with validation
  const latitude1 = safeParseFloat(lat1);
  const longitude1 = safeParseFloat(lng1);
  const latitude2 = safeParseFloat(lat2);
  const longitude2 = safeParseFloat(lng2);
  
  // Check for invalid coordinates (zeroes may indicate missing data)
  if (!isValidCoordinate(latitude1, longitude1) || !isValidCoordinate(latitude2, longitude2)) {
    console.warn(
      "Warning: Invalid coordinates in distance calculation",
      { lat1: latitude1, lng1: longitude1, lat2: latitude2, lng2: longitude2 }
    );
    return 0; // Return 0 as fallback for invalid coordinates
  }
  
  // Haversine formula
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(latitude2 - latitude1);
  const dLng = deg2rad(longitude2 - longitude1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(latitude1)) * Math.cos(deg2rad(latitude2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in kilometers
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Safely parse a coordinate value to a floating point number
 * Returns 0 if the value is invalid
 */
function safeParseFloat(value: any): number {
  // Handle various input formats
  if (value === null || value === undefined) return 0;
  
  if (typeof value === "string") {
    // Replace comma with dot for regions that use comma as decimal separator
    value = value.replace(/,/g, ".");
  }
  
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Check if coordinates are valid (non-zero and within range)
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  // Check for zero coordinates (likely default values)
  if (lat === 0 && lng === 0) return false;
  
  // Check latitude range (-90 to 90)
  if (Math.abs(lat) > 90) return false;
  
  // Check longitude range (-180 to 180)
  if (Math.abs(lng) > 180) return false;
  
  return true;
}