// src/lib/server/services/service-area.service.test.ts
import { describe, expect, it, vi } from "vitest";

// Only the input rules are tested here; no database is needed
vi.mock("$lib/server/db", () => ({ db: {} }));
const { serviceAreaInputSchema } = await import("./service-area.service");

describe("serviceAreaInputSchema", () => {
  it("accepts a South African area and fills in the defaults", () => {
    const parsed = serviceAreaInputSchema.parse({ name: "  Sea Point ", lat: "-33.9155", lng: "18.3876" });
    expect(parsed).toEqual({ name: "Sea Point", lat: -33.9155, lng: 18.3876, radiusKm: 15, sortOrder: 0 });
  });

  it("catches latitude and longitude typed the wrong way round", () => {
    expect(serviceAreaInputSchema.safeParse({ name: "Sea Point", lat: 18.3876, lng: -33.9155 }).success).toBe(false);
  });

  it("refuses a blank name, a missing centre and a radius out of range", () => {
    expect(serviceAreaInputSchema.safeParse({ name: " ", lat: -33.9, lng: 18.4 }).success).toBe(false);
    expect(serviceAreaInputSchema.safeParse({ name: "X" }).success).toBe(false);
    expect(serviceAreaInputSchema.safeParse({ name: "X", lat: -33.9, lng: 18.4, radiusKm: 0.1 }).success).toBe(false);
    expect(serviceAreaInputSchema.safeParse({ name: "X", lat: -33.9, lng: 18.4, radiusKm: 500 }).success).toBe(false);
  });
});
