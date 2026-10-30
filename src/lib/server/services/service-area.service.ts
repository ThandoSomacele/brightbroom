// src/lib/server/services/service-area.service.ts
//
// The service_area table: where this deployment takes bookings and recruits
// cleaners. Read on every page that checks an address (one small query, no
// cache: a cache would go stale across Netlify's separate functions), and
// edited by the company in /admin/service-areas.
import { asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "$lib/server/db";
import { serviceArea, type ServiceAreaRow } from "$lib/server/db/schema";
import { DEFAULT_SERVICE_AREA_RADIUS_KM, type ServiceArea } from "$lib/utils/service-areas";

/**
 * What an admin may save. The coordinate ranges are South Africa's, which also
 * catches latitude and longitude typed the wrong way round.
 */
export const serviceAreaInputSchema = z.object({
  name: z.string().trim().min(1, "Give the area a name").max(80, "Keep the name under 80 characters"),
  lat: z.coerce
    .number({ invalid_type_error: "Pick the area's centre from the address search" })
    .min(-35, "That point is outside South Africa")
    .max(-22, "That point is outside South Africa"),
  lng: z.coerce
    .number({ invalid_type_error: "Pick the area's centre from the address search" })
    .min(16, "That point is outside South Africa")
    .max(33, "That point is outside South Africa"),
  radiusKm: z.coerce
    .number({ invalid_type_error: "Enter a radius in km" })
    .min(0.5, "The radius must be at least 0.5 km")
    .max(100, "The radius can be at most 100 km")
    .default(DEFAULT_SERVICE_AREA_RADIUS_KM),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type ServiceAreaInput = z.infer<typeof serviceAreaInputSchema>;

/** A row as the rest of the app uses it: numbers, not decimal strings */
function toServiceArea(row: ServiceAreaRow): ServiceArea {
  return { id: row.id, name: row.name, lat: Number(row.lat), lng: Number(row.lng), radiusKm: Number(row.radiusKm) };
}

const byDisplayOrder = [asc(serviceArea.sortOrder), asc(serviceArea.name)];

export const serviceAreaService = {
  /** The areas in use, for address checks and the public service-areas page */
  async listActive(): Promise<ServiceArea[]> {
    const rows = await db
      .select()
      .from(serviceArea)
      .where(eq(serviceArea.isActive, true))
      .orderBy(...byDisplayOrder);
    return rows.map(toServiceArea);
  },

  /** Every area, switched off ones too, for the admin page */
  async listAll(): Promise<(ServiceArea & { isActive: boolean; sortOrder: number })[]> {
    const rows = await db.select().from(serviceArea).orderBy(...byDisplayOrder);
    return rows.map((row) => ({ ...toServiceArea(row), isActive: row.isActive, sortOrder: row.sortOrder }));
  },

  async countActive(): Promise<number> {
    const [row] = await db.select({ n: count() }).from(serviceArea).where(eq(serviceArea.isActive, true));
    return row?.n ?? 0;
  },

  async create(input: ServiceAreaInput): Promise<void> {
    await db.insert(serviceArea).values({
      id: crypto.randomUUID(),
      name: input.name,
      lat: input.lat.toFixed(6),
      lng: input.lng.toFixed(6),
      radiusKm: input.radiusKm.toFixed(2),
      sortOrder: input.sortOrder,
    });
  },

  async update(id: string, input: ServiceAreaInput): Promise<boolean> {
    const updated = await db
      .update(serviceArea)
      .set({
        name: input.name,
        lat: input.lat.toFixed(6),
        lng: input.lng.toFixed(6),
        radiusKm: input.radiusKm.toFixed(2),
        sortOrder: input.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(serviceArea.id, id))
      .returning({ id: serviceArea.id });
    return updated.length > 0;
  },

  async setActive(id: string, isActive: boolean): Promise<boolean> {
    const updated = await db
      .update(serviceArea)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(serviceArea.id, id))
      .returning({ id: serviceArea.id });
    return updated.length > 0;
  },

  async remove(id: string): Promise<boolean> {
    const deleted = await db.delete(serviceArea).where(eq(serviceArea.id, id)).returning({ id: serviceArea.id });
    return deleted.length > 0;
  },
};
