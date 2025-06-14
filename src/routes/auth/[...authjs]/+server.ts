// src/routes/auth/[...authjs]/+server.ts
import { handle } from "$lib/server/auth-config/auth.config";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  console.log("[AUTH ROUTE] GET request to:", event.url.pathname);
  console.log("[AUTH ROUTE] Search params:", event.url.search);
  return handle(event);
};

export const POST: RequestHandler = async (event) => {
  console.log("[AUTH ROUTE] POST request to:", event.url.pathname);
  console.log("[AUTH ROUTE] Search params:", event.url.search);
  return handle(event);
};
