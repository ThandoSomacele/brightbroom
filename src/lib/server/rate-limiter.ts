// src/lib/server/rate-limiter.ts
//
// Two stores behind one API:
// - REDIS_URL unset (Netlify demo, local dev): an in-memory Map, per process.
// - REDIS_URL set (self-hosted): fixed-window counters in Redis, shared by every
//   process of the deployment. Keys carry REDIS_KEY_PREFIX (default "bb:") so
//   several deployments can share one Redis without seeing each other's counts.
//
// A rate limiter must never be the reason a form stops working, so if Redis is
// unreachable the check fails open (allows) and logs at most once a minute.
import { createHash } from "node:crypto";
import { env } from "$env/dynamic/private";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime?: Date;
};

type RateLimitRecord = {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
};

// In-memory store for rate limiting (used when REDIS_URL is unset)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records periodically (every 15 minutes)
const cleanupTimer = setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Remove records older than the window
      if (now - record.firstAttempt > 24 * 60 * 60 * 1000) {
        // 24 hours
        rateLimitStore.delete(key);
      }
    }
  },
  15 * 60 * 1000,
);
// Don't keep a process (or a test run) alive just for this cleanup
cleanupTimer.unref?.();

/**
 * Rate limiting configuration by action type
 */
const limits = {
  passwordReset: {
    // Max 5 requests per IP in a 1 hour window
    ipLimit: { max: 5, window: 60 * 60 * 1000 },
    // Max 3 requests per email in a 24 hour window
    emailLimit: { max: 3, window: 24 * 60 * 60 * 1000 },
  },
  contactForm: {
    // Max 3 contact form submissions per IP in a 15 minute window
    ipLimit: { max: 3, window: 15 * 60 * 1000 },
    // Max 2 contact form submissions per email in a 1 hour window
    emailLimit: { max: 2, window: 60 * 60 * 1000 },
  },
  cleanerApplication: {
    // Max 2 cleaner applications per IP in a 1 hour window
    ipLimit: { max: 2, window: 60 * 60 * 1000 },
    // Max 1 cleaner application per email in a 24 hour window
    emailLimit: { max: 1, window: 24 * 60 * 60 * 1000 },
  },
  login: {
    // Max 10 sign-in attempts per IP in a 15 minute window
    ipLimit: { max: 10, window: 15 * 60 * 1000 },
    // Max 5 sign-in attempts per email in a 15 minute window: slows password
    // guessing against one account without locking its owner out for long
    emailLimit: { max: 5, window: 15 * 60 * 1000 },
  },
  registration: {
    // Max 5 registrations per IP in a 1 hour window
    ipLimit: { max: 5, window: 60 * 60 * 1000 },
    // Max 3 registrations per email in a 24 hour window
    emailLimit: { max: 3, window: 24 * 60 * 60 * 1000 },
  },
};

export type RateLimitType = keyof typeof limits;

function limitFor(type: RateLimitType, identifier: string) {
  // Determine if this is an email or IP address
  const isEmail = identifier.includes("@");
  return isEmail ? limits[type].emailLimit : limits[type].ipLimit;
}

// ---------------------------------------------------------------------------
// Redis store
// ---------------------------------------------------------------------------

/** The one ioredis method we use; a fake with the same shape stands in for tests */
export type RedisEvalClient = {
  eval(
    script: string,
    numKeys: number,
    ...args: (string | number)[]
  ): Promise<unknown>;
};

// Count this attempt and report the window. INCR always, PEXPIRE only when the
// window starts (count 1), so the window is fixed rather than sliding. The
// PTTL < 0 branch repairs a key that somehow lost its expiry, which would
// otherwise block that identifier forever.
const INCR_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

// Read the window without counting
const PEEK_SCRIPT = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
local ttl = redis.call('PTTL', KEYS[1])
return {count, ttl}
`;

let redisClient: RedisEvalClient | null = null;
let redisClientPromise: Promise<RedisEvalClient> | null = null;
let lastRedisErrorLog = 0;

/** Log Redis trouble at most once a minute, so an outage can't flood the logs */
function logRedisError(error: unknown): void {
  const now = Date.now();
  if (now - lastRedisErrorLog < 60_000) return;
  lastRedisErrorLog = now;
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `[rate-limiter] Redis unavailable, allowing requests (fail open): ${message}`,
  );
}

function redisUrl(): string | undefined {
  const url = env.REDIS_URL?.trim();
  return url ? url : undefined;
}

function keyPrefix(): string {
  return env.REDIS_KEY_PREFIX ?? "bb:";
}

/**
 * The Redis key for a counter. The identifier (an IP or an email address) is
 * hashed so personal information isn't stored in a Redis that may be shared.
 */
export function redisKey(type: RateLimitType, identifier: string): string {
  const digest = createHash("sha256")
    .update(identifier.toLowerCase())
    .digest("hex")
    .slice(0, 32);
  return `${keyPrefix()}ratelimit:${type}:${digest}`;
}

/**
 * Connect on first use, never at import: importing this module (as `vite
 * build` does) must not open a socket. ioredis itself is loaded lazily too.
 */
async function getRedis(url: string): Promise<RedisEvalClient> {
  if (redisClient) return redisClient;
  if (!redisClientPromise) {
    redisClientPromise = import("ioredis").then(({ Redis }) => {
      const client = new Redis(url, {
        lazyConnect: true,
        // Answer fast when Redis is down instead of queueing for seconds:
        // each command gets one retry and must reply within a second.
        maxRetriesPerRequest: 1,
        commandTimeout: 1000,
        connectTimeout: 2000,
        // Keep trying to reconnect in the background, backing off to 5s
        retryStrategy: (times) => Math.min(times * 200, 5000),
      });
      // Without a listener ioredis reports every reconnect failure itself
      client.on("error", logRedisError);
      redisClient = client;
      return client;
    });
    // A failed import shouldn't be cached forever
    redisClientPromise.catch(() => {
      redisClientPromise = null;
    });
  }
  return redisClientPromise;
}

function parseReply(reply: unknown): { count: number; ttl: number } {
  if (!Array.isArray(reply) || reply.length < 2) {
    throw new Error("Unexpected Redis reply");
  }
  return { count: Number(reply[0]), ttl: Number(reply[1]) };
}

async function checkRateLimitRedis(
  client: RedisEvalClient,
  type: RateLimitType,
  identifier: string,
): Promise<RateLimitResult> {
  const limit = limitFor(type, identifier);
  const now = Date.now();
  const { count, ttl } = parseReply(
    await client.eval(INCR_SCRIPT, 1, redisKey(type, identifier), limit.window),
  );

  // count includes this attempt, so this matches the in-memory store:
  // allowed while the count before this attempt was under the max, and
  // remaining = attempts left after this one.
  return {
    allowed: count <= limit.max,
    remaining: Math.max(0, limit.max - count),
    resetTime: new Date(now + Math.max(0, ttl)),
  };
}

async function getRateLimitStatusRedis(
  client: RedisEvalClient,
  type: RateLimitType,
  identifier: string,
): Promise<RateLimitResult> {
  const limit = limitFor(type, identifier);
  const now = Date.now();
  const { count, ttl } = parseReply(
    await client.eval(PEEK_SCRIPT, 1, redisKey(type, identifier)),
  );

  // No key (ttl -2) or no attempts yet: a fresh window
  if (count === 0 || ttl < 0) {
    return { allowed: true, remaining: limit.max };
  }

  return {
    allowed: count < limit.max,
    remaining: Math.max(0, limit.max - count),
    resetTime: new Date(now + ttl),
  };
}

/** Allow, without a reset time, when the store can't be reached */
function failOpen(type: RateLimitType, identifier: string): RateLimitResult {
  return { allowed: true, remaining: limitFor(type, identifier).max };
}

/** The Redis client to use, or null for the in-memory store */
async function activeRedis(): Promise<RedisEvalClient | null> {
  if (testRedisOverride !== undefined) return testRedisOverride;
  const url = redisUrl();
  return url ? getRedis(url) : null;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

function checkRateLimitMemory(
  type: RateLimitType,
  identifier: string,
): RateLimitResult {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  const limit = limitFor(type, identifier);

  // Get or Initialise record
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

function getRateLimitStatusMemory(
  type: RateLimitType,
  identifier: string,
): RateLimitResult {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  const limit = limitFor(type, identifier);

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a request exceeds rate limits, counting this attempt
 * @param type The action type (e.g., 'passwordReset', 'contactForm', 'cleanerApplication')
 * @param identifier The identifier (IP address or email)
 * @returns Whether the request is allowed and remaining attempts
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string,
): Promise<RateLimitResult> {
  let client: RedisEvalClient | null;
  try {
    client = await activeRedis();
  } catch (error) {
    logRedisError(error);
    return failOpen(type, identifier);
  }
  if (!client) return checkRateLimitMemory(type, identifier);

  try {
    return await checkRateLimitRedis(client, type, identifier);
  } catch (error) {
    logRedisError(error);
    return failOpen(type, identifier);
  }
}

/**
 * Get current rate limit status without incrementing the counter
 * Useful for checking limits before performing actions
 */
export async function getRateLimitStatus(
  type: RateLimitType,
  identifier: string,
): Promise<RateLimitResult> {
  let client: RedisEvalClient | null;
  try {
    client = await activeRedis();
  } catch (error) {
    logRedisError(error);
    return failOpen(type, identifier);
  }
  if (!client) return getRateLimitStatusMemory(type, identifier);

  try {
    return await getRateLimitStatusRedis(client, type, identifier);
  } catch (error) {
    logRedisError(error);
    return failOpen(type, identifier);
  }
}

// ---------------------------------------------------------------------------
// Test hooks
// ---------------------------------------------------------------------------

// undefined = follow REDIS_URL; null = force in-memory; a client = use it
let testRedisOverride: RedisEvalClient | null | undefined;

/** Tests only: swap the store. Pass undefined to go back to REDIS_URL. */
export function __setRedisClientForTests(
  client: RedisEvalClient | null | undefined,
): void {
  testRedisOverride = client;
  lastRedisErrorLog = 0;
}

/** Tests only: forget every in-memory counter */
export function __resetMemoryStoreForTests(): void {
  rateLimitStore.clear();
}
