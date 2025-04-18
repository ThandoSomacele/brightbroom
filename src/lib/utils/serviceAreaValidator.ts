// src/lib/utils/serviceAreaValidator.ts

// Define service areas with coordinates and radius in km
export const SERVICE_AREAS = [
    { name: "Fourways", center: {lat: -26.0274, lng: 28.0106}, radius: 15 },
    { name: "Bryanston", center: lat: -26.0525, lng: 28.0074}, radius: 15 },
    { name: "Randburg", center: {lat: -26.1063, lng: 27.9947}, radius: 15 },
    { name: "Midrand", center: {lat: -25.9992, lng: 28.1182}, radius: 15 },
    { name: "North Riding", center: {lat: -26.0469, lng: 27.951}, radius: 15 },
    { name: "Cosmo City,Roodepoort", center: {lat: -26.0287393, lng: 27.8876044}, radius: 50 },
    { name: "Diepsloot", center: {lat:-25.9412555, lng: 27.96671}, radius: 100 },
    { name: "Honeydew", cneter: {lat: -26.0225, lng: 27.9475}, radius: 30 },
  ];

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
  // Debug log to see input values
  console.log("Distance calculation inputs:", { lat1, lng1, lat2, lng2 });
  
  // Safe conversion to numbers with validation
  const latitude1 = safeParseFloat(lat1);
  const longitude1 = safeParseFloat(lng1);
  const latitude2 = safeParseFloat(lat2);
  const longitude2 = safeParseFloat(lng2);
  
  // Debug log parsed values
  console.log("Parsed coordinates:", { 
    latitude1, longitude1, latitude2, longitude2,
    isValid1: isValidCoordinate(latitude1, longitude1),
    isValid2: isValidCoordinate(latitude2, longitude2)
  });
  
  // Check for values that are explicitly zero (which is different from missing/invalid)
  const isExplicitZero = (val: any) => val === 0 || val === "0" || val === "0.0";
  
  // Modified validation: Only consider coordinate invalid if:
  // - Both lat AND lng are zero/empty/null (could be missing data)
  // - OR either is outside valid range
  const isInvalid1 = 
    ((latitude1 === 0 && longitude1 === 0) && (!isExplicitZero(lat1) || !isExplicitZero(lng1))) ||
    !isInValidRange(latitude1, longitude1);
    
  const isInvalid2 = 
    ((latitude2 === 0 && longitude2 === 0) && (!isExplicitZero(lat2) || !isExplicitZero(lng2))) ||
    !isInValidRange(latitude2, longitude2);
  
  if (isInvalid1 || isInvalid2) {
    console.warn(
      "Warning: Invalid coordinates in distance calculation",
      { 
        raw: { lat1, lng1, lat2, lng2 },
        parsed: { latitude1, longitude1, latitude2, longitude2 },
        isInvalid1, isInvalid2
      }
    );
    return 9999; // Return large distance for invalid coordinates
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
 * Check if a location is within any of the defined service areas
 * 
 * @param lat Latitude of the location to check
 * @param lng Longitude of the location to check
 * @returns Boolean indicating if the location is within a service area
 */
export function isWithinServiceArea(
  lat: number | string | null | undefined, 
  lng: number | string | null | undefined
): boolean {
  const latitude = safeParseFloat(lat);
  const longitude = safeParseFloat(lng);
  
  if (!isValidCoordinate(latitude, longitude)) {
    return false;
  }
  
  // Check each service area
  for (const area of SERVICE_AREAS) {
    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      area.center.lat,
      area.center.lng
    );
    
    if (distance <= area.radius) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find the closest service area to a given location
 * 
 * @param lat Latitude of the location
 * @param lng Longitude of the location 
 * @returns The closest service area with distance information or null if invalid
 */
export function getClosestServiceArea(
  lat: number | string | null | undefined,
  lng: number | string | null | undefined
): { 
  area: typeof SERVICE_AREAS[0], 
  distance: number,
  isWithin: boolean 
} | null {
  const latitude = safeParseFloat(lat);
  const longitude = safeParseFloat(lng);
  
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }
  
  let closestArea = null;
  let minDistance = Infinity;
  
  // Find the closest service area
  for (const area of SERVICE_AREAS) {
    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude, 
      area.center.lat,
      area.center.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestArea = area;
    }
  }
  
  if (!closestArea) return null;
  
  return {
    area: closestArea,
    distance: minDistance,
    isWithin: minDistance <= closestArea.radius
  };
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
 * Check if coordinates are valid (not missing data)
 * This allows explicit zeros as valid coordinates
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  // We'll now only consider both being 0 as invalid (likely missing data)
  // But explicit zeros could be valid coordinates near the equator/prime meridian
  
  // Check for zero coordinates (likely default values)
  if (lat === 0 && lng === 0) {
    // Both are zero, likely missing data
    return false;
  }
  
  // Check if coordinates are in valid range
  return isInValidRange(lat, lng);
}

/**
 * Check if coordinates are within valid ranges
 */
function isInValidRange(lat: number, lng: number): boolean {
  // Check latitude range (-90 to 90)
  if (Math.abs(lat) > 90) return false;
  
  // Check longitude range (-180 to 180)
  if (Math.abs(lng) > 180) return false;
  
  return true;
}