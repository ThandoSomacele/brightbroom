// src/lib/utils/strings.ts

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate a short booking reference from a full ID
 * Examples: 
 * - "abc123xyz456" -> "ABC-Y456"
 * - "short" -> "SHORT"
 */
export function getBookingReference(fullId: string): string {
  // Take first 3 and last 4 characters for a readable reference
  if (fullId.length <= 7) return fullId.toUpperCase();
  const prefix = fullId.substring(0, 3).toUpperCase();
  const suffix = fullId.substring(fullId.length - 4).toUpperCase();
  return `${prefix}-${suffix}`;
}
