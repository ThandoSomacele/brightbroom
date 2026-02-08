// src/routes/admin/tenants/new/+page.server.ts
import { tenantService } from "$lib/server/services/tenant.service";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role !== "ADMIN") {
    throw error(403, "Only platform administrators can create tenants");
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (locals.user?.role !== "ADMIN") {
      throw error(403, "Only platform administrators can create tenants");
    }

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const contactEmail = (formData.get("contactEmail") as string)?.trim();
    const contactPhone = (formData.get("contactPhone") as string)?.trim();
    const province = (formData.get("province") as string)?.trim();
    const commissionRate = (formData.get("commissionRate") as string)?.trim() || "15.00";

    // Validation
    const errors: Record<string, string> = {};

    if (!name) errors.name = "Company name is required";
    if (!slug) errors.slug = "Slug is required";
    if (!contactEmail) errors.contactEmail = "Contact email is required";

    // Check slug uniqueness
    if (slug) {
      const existing = await tenantService.getBySlug(slug);
      if (existing) {
        errors.slug = "This slug is already taken";
      }
    }

    // Validate slug format
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      errors.slug = "Slug must only contain lowercase letters, numbers, and hyphens";
    }

    if (Object.keys(errors).length > 0) {
      return { errors, values: { name, slug, contactEmail, contactPhone, province, commissionRate } };
    }

    const tenant = await tenantService.create({
      id: crypto.randomUUID(),
      name,
      slug,
      contactEmail,
      contactPhone: contactPhone || null,
      province: province || null,
      commissionRate,
      isActive: true,
      isPlatformOwner: false,
    });

    throw redirect(302, `/admin/tenants/${tenant.id}`);
  },
};
