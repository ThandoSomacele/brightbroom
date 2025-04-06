// src/lib/server/env.ts
import { env } from "$env/dynamic/private";

// Default fallback values if environment variables are not set
const DEFAULT_URL = "https://brightbroom.com";
const DEFAULT_RESEND_API_KEY = ""; // This should be empty to fail loudly if not configured

// Export environment variables with fallback values for safety
export const RESEND_API_KEY = env.RESEND_API_KEY || DEFAULT_RESEND_API_KEY;
export const PUBLIC_URL = env.PUBLIC_URL || DEFAULT_URL;

// Log public URL at startup for debugging
console.log(`Application configured with PUBLIC_URL: ${PUBLIC_URL}`);
