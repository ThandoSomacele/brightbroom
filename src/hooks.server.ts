// src/hooks.server.ts
import { validateSessionToken } from "$lib/server/auth";
import { handle as authHandle } from "$lib/server/auth-config/auth.config";
import type { User } from "$lib/server/db/schema";
import { error, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

/**
 * Auth.js handle - handles OAuth authentication
 */
const handleAuthJS: Handle = authHandle;

/**
 * Custom authentication hook that validates session tokens and sets user data
 * This maintains compatibility with your existing auth system
 */
const handleCustomAuth: Handle = async ({ event, resolve }) => {
  // Skip custom auth if Auth.js has already set a session
  if (event.locals.session || event.locals.user) {
    return resolve(event);
  }

  // Get session token from cookies (your existing system)
  const sessionToken = event.cookies.get("session");

  // Default to no user and no session
  event.locals.user = null;
  event.locals.session = null;

  if (sessionToken) {
    try {
      // Validate the session token using your existing system
      const { user, session } = await validateSessionToken(sessionToken);

      if (session && user) {
        // Set user and session in locals
        event.locals.user = user as User;
        event.locals.session = session;
      }
    } catch (err) {
      console.error("Session validation error:", err);
      // Continue without user/session if validation fails
    }
  }

  return resolve(event);
};

/**
 * Error handling hook that captures and formats server errors
 */
const handleErrors: Handle = async ({ event, resolve }) => {
  try {
    return await resolve(event);
  } catch (e) {
    console.error("Server error:", e);

    // Convert Error to a standard format
    const err = e as Error;

    // Check if it's already a SvelteKit error with a status
    if (err instanceof Error && "status" in err) {
      // Pass through SvelteKit errors
      throw err;
    } else {
      // Format non-SvelteKit errors
      const message =
        process.env.NODE_ENV === "development"
          ? err.message || "Unknown server error"
          : "An unexpected error occurred";

      throw error(500, message);
    }
  }
};

/**
 * Custom routing hook to handle specific error cases
 */
const handleRouting: Handle = async ({ event, resolve }) => {
  // Get the requested path
  const path = event.url.pathname;

  // IMPORTANT: Completely exempt PayFast IPN webhook from all checks
  if (path === "/api/payments/ipn") {
    console.log("PayFast IPN webhook accessed:", {
      method: event.request.method,
      path: event.url.pathname,
    });
    // Bypass ALL checks and middleware
    return resolve(event);
  }

  // Handle any custom routing error cases
  if (path.includes("//")) {
    // Double slashes in URL path - redirect to corrected URL
    throw error(404, "Invalid URL format");
  }

  // Admin route protection
  if (path.startsWith("/admin")) {
    const user = event.locals.user;

    // Check if not authenticated
    if (!user) {
      throw error(401, "Authentication required");
    }

    // Check if not admin
    if (user.role !== "ADMIN") {
      throw error(403, "You don't have permission to access this area");
    }
  }

  // Continue with normal request handling
  return resolve(event);
};

// Combine hooks in sequence (order matters!)
// 1. First handle Auth.js OAuth
// 2. Then handle your custom authentication
// 3. Then check route permissions
// 4. Finally handle any errors that occur
export const handle = sequence(
  handleAuthJS,
  handleCustomAuth,
  handleRouting,
  handleErrors,
);
