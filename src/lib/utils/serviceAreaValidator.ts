// src/lib/utils/serviceAreaValidator.ts
import { brand } from "$lib/config/brand";
import { SERVICE_AREAS } from "$lib/config/service-areas";

// The areas themselves are per deployment: see $lib/config/service-areas
export { SERVICE_AREAS, SERVICE_AREA_RADIUS_KM, type ServiceArea } from "$lib/config/service-areas";

/**
 * How far a cleaner is expected to travel from their work address to a
 * customer, in kilometres.
 *
 * This is the single standard applied to every cleaner — individual
 * cleanerProfile.workRadius values are not used for matching, so the reach of
 * the platform stays predictable.
 *
 * Sized against how cleaners actually travel here, on foot or by taxi. Real
 * pairings sit well inside it: Cosmo City to North Riding is 3.6km, Cosmo City
 * to Olivedale 5.9km, Zandspruit (Msawawa) to Maroeladal 4.8km and to Fourways
 * 6.4km, Diepsloot to Fourways 10.5km.
 *
 * Note this is straight-line (Haversine) distance, not travel distance — an
 * actual taxi route runs longer than the number compared against this limit.
 */
export const STANDARD_SERVICE_RADIUS_KM = 20;

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

/**
 * The suburbs we cover, phrased for display to a customer.
 *
 * Derived from SERVICE_AREAS so the list a customer is shown cannot drift
 * away from the list actually used to accept or reject their address.
 */
export function getServiceAreaNames(): string[] {
  // Entries are stored as "Cosmo City, Roodepoort" — the suburb is enough here
  return SERVICE_AREAS.map((area) => area.name.split(",")[0].trim());
}

/**
 * Format the service areas as a readable list: "A, B and C".
 */
export function formatServiceAreaList(): string {
  const names = getServiceAreaNames();
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * The single message shown to a customer whose address we cannot service.
 *
 * Kept here rather than written out at each call site so every surface tells
 * the customer the same thing, and so the named suburbs stay in step with
 * SERVICE_AREAS.
 *
 * Pass coordinates to also name their nearest covered suburb, which is more
 * useful than a bare rejection when they are only just outside.
 */
export function getOutOfServiceAreaMessage(
  lat?: number,
  lng?: number,
): string {
  const areas = formatServiceAreaList();
  // A company's site with no areas configured refuses every address
  if (!areas) return `${brand.name} can't take bookings for this address online. Please contact us.`;
  const base = `${brand.name} isn't in your area yet. We currently clean in ${areas}.`;

  if (typeof lat === "number" && typeof lng === "number") {
    const closest = getClosestServiceArea(lat, lng);
    if (closest && !closest.isWithinService) {
      // Trim to the suburb, matching how the areas are named in the list above
      const closestName = closest.name.split(",")[0].trim();
      return `${base} The closest we get is ${closestName}, about ${Math.round(closest.distance)}km away. We're expanding, so do check back.`;
    }
  }

  return `${base} We're expanding, so do check back.`;
}
