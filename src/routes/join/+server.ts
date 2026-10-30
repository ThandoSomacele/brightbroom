// src/routes/join/+server.ts
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// /join on its own means joining as a cleaner. A server redirect, so search
// engines and people without JavaScript land on the form too.
export const GET: RequestHandler = () => {
  throw redirect(308, "/join/cleaner");
};
