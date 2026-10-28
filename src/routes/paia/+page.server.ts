import { getLegalDocument } from "$lib/server/legal";
import type { PageServerLoad } from "./$types";

// BrightBroom (Pty) Ltd's own manual, so marketplace only (see hooks.server.ts)
export const load: PageServerLoad = () => ({ doc: getLegalDocument("paia") });
