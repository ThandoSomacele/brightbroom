// src/hooks.server.ts
import { lucia } from "$lib/server/auth";
import { redirect, type Handle } from "@sveltejs/kit";

// Helper function to check if a route is protected
function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/profile") || pathname.startsWith("/book");
}

// Helper function to check if a route is protected by role
function isProtectedByRole(pathname: string, role?: string): boolean {
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return true;
  }

  if (pathname.startsWith("/cleaner") && role !== "CLEANER") {
    return true;
  }

  return false;
}

export const handle: Handle = async ({ event, resolve }) => {
  // Get the session ID from cookies
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  
  if (!sessionId) {
    // No session ID in cookies
    event.locals.user = null;
    event.locals.session = null;

    // Check for protected routes
    if (isProtectedRoute(event.url.pathname)) {
      throw redirect(302, `/auth/login?redirectTo=${event.url.pathname}`);
    }

    return resolve(event);
  }

  // Validate the session
  const { session, user } = await lucia.validateSession(sessionId);

  // Update event.locals
  event.locals.user = user;
  event.locals.session = session;

  if (session && session.fresh) {
    // Session was refreshed, update the cookie
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: ".",
      ...sessionCookie.attributes,
    });
  }

  if (!session) {
    // Invalid session, remove the cookie
    const sessionCookie = lucia.createBlankSessionCookie();
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: ".",
      ...sessionCookie.attributes,
    });
  }

  // Check for protected routes when a session exists but with incorrect role
  if (isProtectedByRole(event.url.pathname, user?.role)) {
    throw redirect(302, "/");
  }

  return resolve(event);
};
