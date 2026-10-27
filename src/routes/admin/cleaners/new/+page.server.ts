// src/routes/admin/cleaners/new/+page.server.ts
// Redirects to the unified application pipeline.
// All cleaners now enter through applications — admin can create on their behalf.
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { requireAdmin } from "$lib/server/route-guards";

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);
  throw redirect(302, "/admin/applications/new");
};
