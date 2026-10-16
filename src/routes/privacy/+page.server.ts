import { isSingleCompany } from "$lib/config/brand";
import { getLegalDocument } from "$lib/server/legal";
import type { PageServerLoad } from "./$types";

// A single company's own site uses the version without the marketplace
export const load: PageServerLoad = () => ({
  doc: getLegalDocument(isSingleCompany ? "privacy-single" : "privacy"),
});
