// src/routes/+layout.server.ts
import { env } from '$env/dynamic/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Return user data and CSRF token
  return {
    user: locals.user,
    csrf: locals.csrf,
    // Set per Netlify context: true on production while there are no trained
    // cleaners; unset on the development branch so the sandbox demo keeps its
    // full booking flow. The hard gate lives in hooks.server.ts - this flag
    // only softens the visible CTAs.
    bookingsPaused: env.PUBLIC_BOOKINGS_PAUSED === 'true'
  };
};
