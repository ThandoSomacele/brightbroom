// src/lib/utils/serviceAreaValidator.ts

/**
 * Service areas configuration with geographic coordinates and radii
 * Each service area has a name, center coordinates, and radius in km
 */
export const SERVICE_AREAS = [
  { name: "Fourways", lat: -26.0274, lng: 28.0106, radius: 15 },
  { name: "Bryanston", lat: -26.0525, lng: 28.0074, radius: 15 },
  { name: "Randburg", lat: -26.1063, lng: 27.9947, radius: 15 },
  { name: "Midrand", lat: -25.9992, lng: 28.1182, radius: 15 },
  { name: "North Riding", lat: -26.0469, lng: 27.951, radius: 15 },
  {
    name: "Cosmo City, Roodepoort",
    lat: -26.0212639,
    lng: 27.9289995,
    radius: 50,
  },
  { name: "Diepsloot", lat: -25.9412555, lng: 27.96671, radius: 100 },
  { name: "Honeydew", lat: -26.0225, lng: 27.9475, radius: 30 },
  { name: "Monaghan Farm, Centurion", lat: -25.904442, lng: 27.454882, radius: 15 },
];

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function getDistanceFromLatLonInKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a location is within any of our service areas
 * @param lat Latitude of the location to check
 * @param lng Longitude of the location to check
 * @returns Boolean indicating if the location is within service area
 */
export function isWithinServiceArea(lat: number, lng: number): boolean {
  return SERVICE_AREAS.some((area) => {
    const distance = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
    return distance <= area.radius;
  });
}

/**
 * Get the closest service area to a location
 * @param lat Latitude of the location
 * @param lng Longitude of the location
 * @returns The closest service area and distance, or null if no service area is close enough
 */
export function getClosestServiceArea(
  lat: number,
  lng: number,
): {
  name: string;
  distance: number;
  isWithinService: boolean;
} | null {
  let closestArea = null;
  let closestDistance = Infinity;

  for (const area of SERVICE_AREAS) {
    const distance = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestArea = {
        name: area.name,
        distance: distance,
        isWithinService: distance <= area.radius,
      };
    }
  }

  return closestArea;
}
