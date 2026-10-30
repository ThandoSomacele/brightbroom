// src/lib/utils/service-areas.test.ts
import { describe, expect, it } from "vitest";
import {
  formatServiceAreaList,
  getClosestServiceArea,
  getOutOfServiceAreaMessage,
  isWithinServiceArea,
  serviceAreaBounds,
  type ServiceArea,
} from "./service-areas";

const seaPoint: ServiceArea = { id: "a", name: "Sea Point", lat: -33.9155, lng: 18.3876, radiusKm: 5 };
const claremont: ServiceArea = { id: "b", name: "Claremont, Cape Town", lat: -33.9804, lng: 18.4655, radiusKm: 10 };
const areas = [seaPoint, claremont];

describe("isWithinServiceArea", () => {
  it("accepts a point inside an area and refuses one outside every area", () => {
    expect(isWithinServiceArea(areas, -33.92, 18.39)).toBe(true); // Sea Point
    expect(isWithinServiceArea(areas, -26.0274, 28.0106)).toBe(false); // Fourways, Johannesburg
  });

  it("covers nothing when no areas are set", () => {
    expect(isWithinServiceArea([], -33.92, 18.39)).toBe(false);
  });

  it("uses each area's own radius", () => {
    // About 8 km from Sea Point: outside its 5 km circle
    expect(isWithinServiceArea([seaPoint], -33.9155, 18.474)).toBe(false);
    expect(isWithinServiceArea([{ ...seaPoint, radiusKm: 10 }], -33.9155, 18.474)).toBe(true);
  });
});

describe("customer messages", () => {
  it("lists the areas by suburb", () => {
    expect(formatServiceAreaList(areas)).toBe("Sea Point and Claremont");
    expect(formatServiceAreaList([seaPoint])).toBe("Sea Point");
    expect(formatServiceAreaList([])).toBe("");
  });

  it("names the nearest area for an address just outside", () => {
    const message = getOutOfServiceAreaMessage(areas, -33.86, 18.53);
    expect(message).toMatch(/isn't in your area yet/);
    expect(message).toMatch(/closest we get is/);
  });

  it("asks people to get in touch when no areas are set", () => {
    expect(getOutOfServiceAreaMessage([], -33.92, 18.39)).toMatch(/can't take bookings for this address online/);
  });

  it("finds no closest area in an empty list", () => {
    expect(getClosestServiceArea([], 0, 0)).toBeNull();
  });
});

describe("serviceAreaBounds", () => {
  it("boxes each circle: about 0.135° of latitude for 15 km", () => {
    const box = serviceAreaBounds([{ ...seaPoint, radiusKm: 15 }])!;
    expect(box.north - seaPoint.lat).toBeCloseTo(0.1357, 3);
    expect(seaPoint.lat - box.south).toBeCloseTo(0.1357, 3);
    expect(box.east).toBeGreaterThan(seaPoint.lng);
  });

  it("covers every area, and is null without areas", () => {
    const box = serviceAreaBounds(areas)!;
    expect(box.south).toBeLessThan(claremont.lat);
    expect(box.north).toBeGreaterThan(seaPoint.lat);
    expect(serviceAreaBounds([])).toBeNull();
  });
});
