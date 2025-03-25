// src/lib/server/rate-limiter.ts
type RateLimitRecord = {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
};

// In-memory store for rate limiting
// In production, consider using Redis or similar for distributed environments
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records periodically (every 15 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    // Remove records older than the window
    if (now - record.firstAttempt > 24 * 60 * 60 * 1000) { // 24 hours
      rateLimitStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Rate limiting configuration by action type
 */
const limits = {
  passwordReset: {
    // Max 5 requests per IP in a 1 hour window
    ipLimit: { max: 5, window: 60 * 60 * 1000 }, 
    // Max 3 requests per email in a 24 hour window
    emailLimit: { max: 3, window: 24 * 60 * 60 * 1000 }
  }
};

/**
 * Check if a request exceeds rate limits
 * @param type The action type (e.g., 'passwordReset')
 * @param identifier The identifier (IP address or email)
 * @returns Whether the request is allowed and remaining attempts
 */
export function checkRateLimit(
  type: keyof typeof limits, 
  identifier: string
): { allowed: boolean; remaining: number; resetTime?: Date } {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  const limit = type === 'passwordReset' && identifier.includes('@') 
    ? limits[type].emailLimit 
    : limits[type].ipLimit;
  
  // Get or initialize record
  let record = rateLimitStore.get(key);
  if (!record) {
    record = { count: 0, firstAttempt: now, lastAttempt: now };
    rateLimitStore.set(key, record);
  }
  
  // Check if we need to reset the window
  if (now - record.firstAttempt > limit.window) {
    record = { count: 0, firstAttempt: now, lastAttempt: now };
    rateLimitStore.set(key, record);
  }
  
  // Check if limit exceeded
  const allowed = record.count < limit.max;
  const remaining = Math.max(0, limit.max - record.count - 1);
  
  // Update count and last attempt time if allowed
  if (allowed) {
    record.count += 1;
    record.lastAttempt = now;
    rateLimitStore.set(key, record);
  }
  
  // Calculate reset time
  const resetTime = new Date(record.firstAttempt + limit.window);
  
  return { allowed, remaining, resetTime };
}
