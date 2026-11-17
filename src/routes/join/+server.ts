// src/routes/join/+server.ts
import { redirect } from "@sveltejs/kit";
import { isSingleCompany } from "$lib/config/brand";
import type { RequestHandler } from "./$types";

// /join on its own means joining as a cleaner. A server redirect, so search
// engines and people without JavaScript land on the form too. brightbroom.com
// no longer hires cleaners, so there it goes to the home page.
export const GET: RequestHandler = () => {
  throw redirect(308, isSingleCompany ? "/join/cleaner" : "/");
};
