// src/lib/utils/serviceAreaValidator.ts

/**
 * Service area definition with center coordinates and radius
 */
export interface ServiceArea {
  name: string;
  lat: number;
  lng: number;
  radius: number; // radius in kilometers
}

/**
 * Defined service areas for BrightBroom's launch phase
 */
export const SERVICE_AREAS: ServiceArea[] = [
  { name: 'Fourways', lat: -26.0274, lng: 28.0106, radius: 5 }, // 5km radius
  // { name: 'Sandton', lat: -26.1070, lng: 28.0567, radius: 6 },
  { name: 'North Riding', lat: -26.0469, lng: 27.9510, radius: 4 },
  // { name: 'Roodepoort', lat: -26.1625, lng: 27.8727, radius: 7 }
];

/**
 * Check if coordinates are within any of our service areas
 * @param lat Latitude
 * @param lng Longitude
 * @returns Whether the coordinates are within a service area
 */
export function isWithinServiceArea(lat: number, lng: number): boolean {
  // Check each service area
  for (const area of SERVICE_AREAS) {
    const distance = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
    if (distance <= area.radius) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate the closest service area to given coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns The closest service area and distance to it (in km)
 */
export function getClosestServiceArea(lat: number, lng: number): { area: ServiceArea, distance: number } {
  let closestArea = SERVICE_AREAS[0];
  let minDistance = getDistanceFromLatLonInKm(lat, lng, closestArea.lat, closestArea.lng);
  
  for (let i = 1; i < SERVICE_AREAS.length; i++) {
    const area = SERVICE_AREAS[i];
    const distance = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestArea = area;
    }
  }
  
  return { area: closestArea, distance: minDistance };
}

/**
 * Calculate distance between coordinates using the Haversine formula
 * @param lat1 First point latitude
 * @param lon1 First point longitude
 * @param lat2 Second point latitude
 * @param lon2 Second point longitude
 * @returns Distance in kilometers
 */
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Get friendly, user-facing description of our service areas
 */
export function getServiceAreaDescription(): string {
  const areaNames = SERVICE_AREAS.map(area => area.name).join(', ');
  return `We currently serve ${areaNames} in Gauteng. More areas coming soon!`;
}
