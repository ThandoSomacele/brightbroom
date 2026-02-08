// src/routes/admin/cleaners/new/+page.server.ts
// Redirects to the unified application pipeline.
// All cleaners now enter through applications — admin can create on their behalf.
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  throw redirect(302, "/admin/applications/new");
};
