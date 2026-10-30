// src/routes/admin/service-areas/+page.server.ts
//
// The company manages where it takes bookings and recruits cleaners. Every
// address check on the site (booking, cleaner sign-up, saved addresses) uses
// the active areas listed here.
import { fail } from "@sveltejs/kit";
import type { z } from "zod";
import { requireAdmin } from "$lib/server/route-guards";
import { serviceAreaInputSchema, serviceAreaService } from "$lib/server/services/service-area.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals, { platformOnly: true });
  return { areas: await serviceAreaService.listAll() };
};

function parseArea(formData: FormData) {
  const optional = (key: string) => formData.get(key)?.toString().trim() || undefined;
  return serviceAreaInputSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    lat: optional("lat"),
    lng: optional("lng"),
    radiusKm: optional("radiusKm"),
    sortOrder: optional("sortOrder"),
  });
}

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Check the details and try again";

/** Postgres unique violation, however the driver wrapped it */
function isDuplicateName(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    requireAdmin(locals, { platformOnly: true });
    const parsed = parseArea(await request.formData());
    if (!parsed.success) return fail(400, { error: firstIssue(parsed.error) });

    try {
      await serviceAreaService.create(parsed.data);
    } catch (err) {
      if (isDuplicateName(err)) return fail(400, { error: `There is already an area called "${parsed.data.name}"` });
      throw err;
    }
    return { success: true, message: `Added ${parsed.data.name}` };
  },

  update: async ({ request, locals }) => {
    requireAdmin(locals, { platformOnly: true });
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const parsed = parseArea(formData);
    if (!id) return fail(400, { error: "Choose an area to change" });
    if (!parsed.success) return fail(400, { error: firstIssue(parsed.error) });

    try {
      if (!(await serviceAreaService.update(id, parsed.data))) return fail(404, { error: "That area no longer exists" });
    } catch (err) {
      if (isDuplicateName(err)) return fail(400, { error: `There is already an area called "${parsed.data.name}"` });
      throw err;
    }
    return { success: true, message: `Saved ${parsed.data.name}` };
  },

  toggleActive: async ({ request, locals }) => {
    requireAdmin(locals, { platformOnly: true });
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const isActive = formData.get("isActive") === "true";
    if (!id) return fail(400, { error: "Choose an area to change" });

    if (!(await serviceAreaService.setActive(id, isActive))) return fail(404, { error: "That area no longer exists" });
    return { success: true, message: isActive ? "Area switched on" : "Area switched off" };
  },

  delete: async ({ request, locals }) => {
    requireAdmin(locals, { platformOnly: true });
    const id = (await request.formData()).get("id")?.toString();
    if (!id) return fail(400, { error: "Choose an area to delete" });

    if (!(await serviceAreaService.remove(id))) return fail(404, { error: "That area no longer exists" });
    return { success: true, message: "Area deleted" };
  },
};
