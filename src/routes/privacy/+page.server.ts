import { getLegalDocument } from "$lib/server/legal";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => ({ doc: getLegalDocument("privacy") });
