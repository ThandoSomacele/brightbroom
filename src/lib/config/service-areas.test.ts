// src/lib/config/service-areas.test.ts
import { describe, expect, it } from "vitest";
import { parseServiceAreas, SERVICE_AREA_RADIUS_KM } from "./service-areas";

describe("parseServiceAreas", () => {
  it("returns nothing, and no problems, when unset", () => {
    expect(parseServiceAreas(undefined)).toEqual({ areas: [], problems: [] });
    expect(parseServiceAreas("  ")).toEqual({ areas: [], problems: [] });
  });

  it("reads areas and defaults the radius", () => {
    const { areas, problems } = parseServiceAreas(
      '[{"name":" Sea Point ","lat":-33.9155,"lng":18.3876},{"name":"Claremont","lat":-33.9804,"lng":18.4655,"radius":10}]',
    );
    expect(problems).toEqual([]);
    expect(areas).toEqual([
      { name: "Sea Point", lat: -33.9155, lng: 18.3876, radius: SERVICE_AREA_RADIUS_KM },
      { name: "Claremont", lat: -33.9804, lng: 18.4655, radius: 10 },
    ]);
  });

  it("keeps the good entries and names the bad ones", () => {
    const { areas, problems } = parseServiceAreas(
      JSON.stringify([
        { name: "Good", lat: -26, lng: 28 },
        { lat: -26, lng: 28 },
        { name: "Stringy", lat: "-26", lng: 28 },
        { name: "Off the map", lat: -126, lng: 28 },
        { name: "Province", lat: -26, lng: 28, radius: 500 },
        null,
      ]),
    );
    expect(areas.map((a) => a.name)).toEqual(["Good"]);
    expect(problems).toEqual([
      "entry 2 has no name",
      '"Stringy" needs numeric lat and lng',
      '"Off the map" needs numeric lat and lng',
      '"Province" needs a radius between 0.1 and 100 km',
      "entry 6 has no name",
    ]);
  });

  it("refuses JSON that isn't an array of areas", () => {
    expect(parseServiceAreas("{not json").problems).toEqual(["PUBLIC_SERVICE_AREAS is not valid JSON"]);
    expect(parseServiceAreas('{"name":"Sea Point"}').problems).toEqual([
      "PUBLIC_SERVICE_AREAS must be a JSON array of areas",
    ]);
  });
});
