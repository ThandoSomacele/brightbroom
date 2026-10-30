// src/lib/utils/service-areas.ts
//
// Service-area maths. The areas themselves are data: each company manages its
// own in /admin/service-areas (table service_area), loaded on the server by
// serviceAreaService and handed to pages in their load data. Everything here
// is pure and takes the areas as an argument, so the same checks run in the
// browser (instant feedback) and on the server (the real gate).
import { brand } from "$lib/config/brand";

/** One area: a circle around a centre point */
export interface ServiceArea {
  id: string;
  /** Shown to customers; "Suburb, Town" is trimmed to the suburb in lists */
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

/** Radius of a new area when the admin doesn't choose one, in km */
export const DEFAULT_SERVICE_AREA_RADIUS_KM = 15;

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

const deg2rad = (deg: number) => deg * (Math.PI / 180);

/** Straight-line (Haversine) distance between two points, in km */
export function getDistanceFromLatLonInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Whether a point lies inside any of the areas. No areas: nothing is covered */
export function isWithinServiceArea(areas: ServiceArea[], lat: number, lng: number): boolean {
  return areas.some((area) => getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng) <= area.radiusKm);
}

/** The area whose centre is nearest a point, or null when there are no areas */
export function getClosestServiceArea(
  areas: ServiceArea[],
  lat: number,
  lng: number,
): { name: string; distance: number; isWithinService: boolean } | null {
  let closest: { name: string; distance: number; isWithinService: boolean } | null = null;
  for (const area of areas) {
    const distance = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
    if (!closest || distance < closest.distance) {
      closest = { name: area.name, distance, isWithinService: distance <= area.radiusKm };
    }
  }
  return closest;
}

/** The suburbs covered, phrased for a customer ("Cosmo City, Roodepoort" → "Cosmo City") */
export function getServiceAreaNames(areas: ServiceArea[]): string[] {
  return areas.map((area) => area.name.split(",")[0].trim());
}

/** The areas as a readable list: "A, B and C" */
export function formatServiceAreaList(areas: ServiceArea[]): string {
  const names = getServiceAreaNames(areas);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * The one message shown to a customer whose address can't be served, so every
 * surface says the same thing. Pass coordinates to also name the nearest
 * covered suburb, which helps someone just outside.
 */
export function getOutOfServiceAreaMessage(areas: ServiceArea[], lat?: number, lng?: number): string {
  const list = formatServiceAreaList(areas);
  // A site that hasn't set any areas yet can't take an address online
  if (!list) return `${brand.name} can't take bookings for this address online. Please contact us.`;

  const base = `${brand.name} isn't in your area yet. We currently clean in ${list}.`;
  if (typeof lat === "number" && typeof lng === "number") {
    const closest = getClosestServiceArea(areas, lat, lng);
    if (closest && !closest.isWithinService) {
      const closestName = closest.name.split(",")[0].trim();
      return `${base} The closest we get is ${closestName}, about ${Math.round(closest.distance)}km away. We're expanding, so do check back.`;
    }
  }
  return `${base} We're expanding, so do check back.`;
}

/**
 * A box around every area (each circle's centre ± its radius), for biasing
 * address suggestions towards where the company works. Null when there are
 * no areas. 1° of latitude ≈ 110.574 km; 1° of longitude ≈ 111.320 km × cos(lat).
 */
export function serviceAreaBounds(
  areas: ServiceArea[],
): { north: number; south: number; east: number; west: number } | null {
  if (areas.length === 0) return null;
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  for (const area of areas) {
    const dLat = area.radiusKm / 110.574;
    const dLng = area.radiusKm / (111.32 * Math.cos(deg2rad(area.lat)));
    north = Math.max(north, area.lat + dLat);
    south = Math.min(south, area.lat - dLat);
    east = Math.max(east, area.lng + dLng);
    west = Math.min(west, area.lng - dLng);
  }
  return { north, south, east, west };
}
