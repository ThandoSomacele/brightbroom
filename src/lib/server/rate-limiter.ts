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
  },
  contactForm: {
    // Max 3 contact form submissions per IP in a 15 minute window
    ipLimit: { max: 3, window: 15 * 60 * 1000 },
    // Max 2 contact form submissions per email in a 1 hour window
    emailLimit: { max: 2, window: 60 * 60 * 1000 }
  },
  cleanerApplication: {
    // Max 2 cleaner applications per IP in a 1 hour window
    ipLimit: { max: 2, window: 60 * 60 * 1000 },
    // Max 1 cleaner application per email in a 24 hour window
    emailLimit: { max: 1, window: 24 * 60 * 60 * 1000 }
  },
  registration: {
    // Max 5 registrations per IP in a 1 hour window
    ipLimit: { max: 5, window: 60 * 60 * 1000 },
    // Max 3 registrations per email in a 24 hour window
    emailLimit: { max: 3, window: 24 * 60 * 60 * 1000 }
  }
};

/**
 * Check if a request exceeds rate limits
 * @param type The action type (e.g., 'passwordReset', 'contactForm', 'cleanerApplication')
 * @param identifier The identifier (IP address or email)
 * @returns Whether the request is allowed and remaining attempts
 */
export function checkRateLimit(
  type: keyof typeof limits, 
  identifier: string
): { allowed: boolean; remaining: number; resetTime?: Date } {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  
  // Determine if this is an email or IP address
  const isEmail = identifier.includes('@');
  const limit = isEmail ? limits[type].emailLimit : limits[type].ipLimit;
  
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

/**
 * Get current rate limit status without incrementing the counter
 * Useful for checking limits before performing actions
 */
export function getRateLimitStatus(
  type: keyof typeof limits,
  identifier: string
): { allowed: boolean; remaining: number; resetTime?: Date } {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  
  // Determine if this is an email or IP address
  const isEmail = identifier.includes('@');
  const limit = isEmail ? limits[type].emailLimit : limits[type].ipLimit;
  
  const record = rateLimitStore.get(key);
  
  if (!record || now - record.firstAttempt > limit.window) {
    return {
      allowed: true,
      remaining: limit.max,
    };
  }
  
  const allowed = record.count < limit.max;
  const remaining = Math.max(0, limit.max - record.count);
  const resetTime = new Date(record.firstAttempt + limit.window);
  
  return { allowed, remaining, resetTime };
}
