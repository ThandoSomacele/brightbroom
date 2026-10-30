// src/lib/server/retired-page.ts
// The GET for a retired page (RETIRED_PATHS in $lib/config/site-routes).
// hooks.server.ts already redirects these to the home page. The route files
// exist because on Netlify (split functions) a path with no route never reaches
// the hook: it gets the static 404 page instead.
import { redirect, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = () => redirect(308, "/");
