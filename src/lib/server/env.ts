// src/lib/server/env.ts
import { env } from "$env/dynamic/private";

export const RESEND_API_KEY = env.RESEND_API_KEY;
export const PUBLIC_URL = env.PUBLIC_URL || "http://localhost:5173";
