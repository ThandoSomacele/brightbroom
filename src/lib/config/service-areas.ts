// src/lib/config/service-areas.ts
//
// Where this deployment takes bookings and recruits cleaners. Each cleaning
// company's site sets its own areas in PUBLIC_SERVICE_AREAS; BrightBroom's own
// deploys default to the Johannesburg suburbs below. Read at runtime, so a
// change takes effect on restart, without a rebuild.
//
// PUBLIC_SERVICE_AREAS is a JSON array with one object per area. `radius` is
// in kilometres and optional:
//   [{"name":"Sea Point","lat":-33.9155,"lng":18.3876},
//    {"name":"Claremont","lat":-33.9804,"lng":18.4655,"radius":10}]
import { env } from "$env/dynamic/public";
import { isSingleCompany } from "$lib/config/brand";

export interface ServiceArea {
  /** Shown to customers; "Suburb, Town" is trimmed to the suburb in lists */
  name: string;
  lat: number;
  lng: number;
  /** How far the area reaches from its centre, in km */
  radius: number;
}

/**
 * How far a service area reaches from its centre, in kilometres, when an area
 * doesn't set its own radius.
 *
 * Uniform across BrightBroom's areas so coverage is predictable. Previously
 * these varied wildly — Diepsloot was set to 100km and Cosmo City to 50km,
 * which quietly admitted Rustenburg, Vereeniging, Pretoria and Brits, and
 * meant the out-of-area message almost never fired for anyone in the province.
 */
export const SERVICE_AREA_RADIUS_KM = 15;

/** Beyond this an "area" is a province, which defeats the point of the check */
const MAX_RADIUS_KM = 100;

/** BrightBroom's own areas: the defaults ONLY for BrightBroom's deployments */
const BRIGHTBROOM_AREAS: ServiceArea[] = [
  { name: "Fourways", lat: -26.0274, lng: 28.0106, radius: SERVICE_AREA_RADIUS_KM },
  { name: "Bryanston", lat: -26.0525, lng: 28.0074, radius: SERVICE_AREA_RADIUS_KM },
  { name: "Randburg", lat: -26.1063, lng: 27.9947, radius: SERVICE_AREA_RADIUS_KM },
  { name: "Midrand", lat: -25.9992, lng: 28.1182, radius: SERVICE_AREA_RADIUS_KM },
  { name: "North Riding", lat: -26.0469, lng: 27.951, radius: SERVICE_AREA_RADIUS_KM },
  { name: "Sandton", lat: -26.1076, lng: 28.0567, radius: SERVICE_AREA_RADIUS_KM },
  // Alexandra is primarily a cleaner-supply area: 4.3km from Sandton and
  // 11.8km from Midrand, both well inside the standard matching radius.
  { name: "Alexandra", lat: -26.1044, lng: 28.1, radius: SERVICE_AREA_RADIUS_KM },
  {
    name: "Cosmo City, Roodepoort",
    lat: -26.0212639,
    lng: 27.9289995,
    radius: SERVICE_AREA_RADIUS_KM,
  },
  { name: "Diepsloot", lat: -25.9412555, lng: 27.96671, radius: SERVICE_AREA_RADIUS_KM },
  { name: "Honeydew", lat: -26.0225, lng: 27.9475, radius: SERVICE_AREA_RADIUS_KM },
  { name: "Monaghan Farm, Centurion", lat: -25.904442, lng: 27.454882, radius: SERVICE_AREA_RADIUS_KM },
];

const isNumberIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

/**
 * Parse PUBLIC_SERVICE_AREAS. Entries that are malformed are dropped and
 * described in `problems`, so one typo doesn't take every area down with it.
 */
export function parseServiceAreas(raw: string | undefined): {
  areas: ServiceArea[];
  problems: string[];
} {
  if (!raw || !raw.trim()) return { areas: [], problems: [] };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { areas: [], problems: ["PUBLIC_SERVICE_AREAS is not valid JSON"] };
  }
  if (!Array.isArray(data)) {
    return { areas: [], problems: ["PUBLIC_SERVICE_AREAS must be a JSON array of areas"] };
  }

  const areas: ServiceArea[] = [];
  const problems: string[] = [];
  data.forEach((entry, i) => {
    const e = (entry ?? {}) as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim() : "";
    const radius = e.radius === undefined ? SERVICE_AREA_RADIUS_KM : e.radius;
    const label = name ? `"${name}"` : `entry ${i + 1}`;

    if (!name) problems.push(`${label} has no name`);
    else if (!isNumberIn(e.lat, -90, 90) || !isNumberIn(e.lng, -180, 180))
      problems.push(`${label} needs numeric lat and lng`);
    else if (!isNumberIn(radius, 0.1, MAX_RADIUS_KM))
      problems.push(`${label} needs a radius between 0.1 and ${MAX_RADIUS_KM} km`);
    else areas.push({ name, lat: e.lat as number, lng: e.lng as number, radius: radius as number });
  });

  return { areas, problems };
}

const configured = parseServiceAreas(env.PUBLIC_SERVICE_AREAS);

/**
 * The areas this site serves. A company's deployment never falls back to
 * BrightBroom's suburbs: with no valid areas set it refuses every address,
 * and the server logs why at startup (see serviceAreaProblems).
 */
export const SERVICE_AREAS: ServiceArea[] =
  configured.areas.length > 0 ? configured.areas : isSingleCompany ? [] : BRIGHTBROOM_AREAS;

/** What is wrong with the service-area settings, for the startup log */
export function serviceAreaProblems(): string[] {
  const problems = [...configured.problems];
  if (isSingleCompany && SERVICE_AREAS.length === 0) {
    problems.push("no service areas are set (PUBLIC_SERVICE_AREAS), so every address is refused");
  }
  return problems;
}
