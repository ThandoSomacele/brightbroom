import { auth } from "$lib/server/auth";
import { redirect, type Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = auth.handleRequest(event);
  const session = await event.locals.auth.validate();
  
  // Set user in locals
  event.locals.user = session?.user || null;
  
  // Protect routes
  if (event.url.pathname.startsWith("/profile") || event.url.pathname.startsWith("/book")) {
    if (!session) {
      throw redirect(302, `/auth/login?redirectTo=${event.url.pathname}`);
    }
  }
  
  // Role-based protection
  if (event.url.pathname.startsWith("/admin") && session?.user.role !== "ADMIN") {
    throw redirect(302, "/");
  }
  
  if (event.url.pathname.startsWith("/cleaner") && session?.user.role !== "CLEANER") {
    throw redirect(302, "/");
  }
  
  return resolve(event);
};
