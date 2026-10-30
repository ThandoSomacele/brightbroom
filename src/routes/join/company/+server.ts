// src/routes/join/company/+server.ts
//
// Cleaning companies no longer sign themselves up as marketplace tenants:
// BrightBroom is sold to them as their own site. Old links land on the
// pricing page. (A company's own deployment answers 404 here; see
// BRIGHTBROOM_ONLY_PATHS in hooks.server.ts.)
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => {
  throw redirect(308, "/pricing");
};
