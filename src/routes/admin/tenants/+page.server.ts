// src/routes/admin/tenants/+page.server.ts
import { tenantService } from "$lib/server/services/tenant.service";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role !== "ADMIN") {
    throw error(403, "Only platform administrators can manage tenants");
  }

  const tenants = await tenantService.getAll();

  // Get member counts for each tenant
  const tenantsWithCounts = await Promise.all(
    tenants.map(async (t) => ({
      ...t,
      memberCount: (await tenantService.getMembers(t.id)).length,
      cleanerCount: await tenantService.getCleanerCount(t.id),
    }))
  );

  return { tenants: tenantsWithCounts };
};

export const actions: Actions = {
  toggleActive: async ({ request, locals }) => {
    if (locals.user?.role !== "ADMIN") {
      throw error(403, "Only platform administrators can manage tenants");
    }

    const formData = await request.formData();
    const tenantId = formData.get("tenantId") as string;
    const isActive = formData.get("isActive") === "true";

    const tenant = await tenantService.getById(tenantId);
    if (!tenant) {
      throw error(404, "Tenant not found");
    }

    if (tenant.isPlatformOwner) {
      throw error(400, "Cannot deactivate the platform tenant");
    }

    await tenantService.update(tenantId, { isActive: !isActive });

    return { success: true };
  },
};
