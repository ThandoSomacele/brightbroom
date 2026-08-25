// src/routes/admin/verification/+page.server.ts
import { tenantService } from "$lib/server/services/tenant.service";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = locals.tenant?.id;
  if (!tenantId) {
    // Platform admins have no company of their own to verify
    throw redirect(302, "/admin/dashboard");
  }

  const tenant = await tenantService.getById(tenantId);
  if (!tenant) throw error(404, "Company not found");

  const documents = await tenantService.getDocuments(tenantId);
  const byType = new Map(documents.map((d) => [d.type, d]));

  return {
    tenant,
    // Pair every known document type with whatever has been uploaded for it,
    // so the page renders one row per type rather than per upload. Optional
    // ones are shown too — a company can volunteer them.
    requirements: tenantService.documentTypes.map((requirement) => ({
      ...requirement,
      document: byType.get(requirement.type) ?? null,
    })),
    outstandingRequired: tenantService.requiredDocuments.filter(
      (r) => !byType.has(r.type),
    ).length,
  };
};
