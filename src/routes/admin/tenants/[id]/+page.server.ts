// src/routes/admin/tenants/[id]/+page.server.ts
import { tenantService } from "$lib/server/services/tenant.service";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  if (locals.user?.role !== "ADMIN") {
    throw error(403, "Only platform administrators can manage tenants");
  }

  const tenant = await tenantService.getById(params.id);
  if (!tenant) {
    throw error(404, "Tenant not found");
  }

  const members = await tenantService.getMembers(params.id);
  const cleanerCount = await tenantService.getCleanerCount(params.id);

  return { tenant, members, cleanerCount };
};

export const actions: Actions = {
  update: async ({ request, params, locals }) => {
    if (locals.user?.role !== "ADMIN") {
      throw error(403, "Only platform administrators can manage tenants");
    }

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const contactEmail = (formData.get("contactEmail") as string)?.trim();
    const contactPhone = (formData.get("contactPhone") as string)?.trim();
    const province = (formData.get("province") as string)?.trim();
    const commissionRate =
      (formData.get("commissionRate") as string)?.trim() || "15.00";

    if (!name) {
      return { errors: { name: "Company name is required" } };
    }

    await tenantService.update(params.id, {
      name,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      province: province || null,
      commissionRate,
    });

    return { success: true, message: "Tenant updated successfully" };
  },

  removeMember: async ({ request, params, locals }) => {
    if (locals.user?.role !== "ADMIN") {
      throw error(403, "Only platform administrators can manage tenants");
    }

    const formData = await request.formData();
    const userId = formData.get("userId") as string;

    await tenantService.removeMember(params.id, userId);

    return { success: true, message: "Member removed" };
  },
};
