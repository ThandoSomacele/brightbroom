// src/lib/server/rate-limiter.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetMemoryStoreForTests,
  __setRedisClientForTests,
  checkRateLimit,
  getRateLimitStatus,
  redisKey,
  type RedisEvalClient,
} from "./rate-limiter";

/**
 * A tiny stand-in for Redis that understands the two scripts the limiter
 * sends: the counting one (INCR) and the peeking one (GET). Expiry follows
 * Date.now(), so fake timers move it.
 */
function fakeRedis() {
  const store = new Map<string, { count: number; expiresAt: number }>();
  const live = (key: string) => {
    const entry = store.get(key);
    if (entry && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    return entry;
  };
  const client: RedisEvalClient = {
    async eval(script, _numKeys, ...args) {
      const key = String(args[0]);
      const entry = live(key);
      if (script.includes("INCR")) {
        const windowMs = Number(args[1]);
        const next = entry ?? { count: 0, expiresAt: Date.now() + windowMs };
        next.count += 1;
        store.set(key, next);
        return [next.count, next.expiresAt - Date.now()];
      }
      return entry ? [entry.count, entry.expiresAt - Date.now()] : [0, -2];
    },
  };
  return { client, store };
}

const stores: [string, () => RedisEvalClient | null][] = [
  ["in-memory", () => null],
  ["redis (fake client)", () => fakeRedis().client],
];

describe.each(stores)("rate limiter, %s store", (_name, makeClient) => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T08:00:00Z"));
    __resetMemoryStoreForTests();
    __setRedisClientForTests(makeClient());
  });

  afterEach(() => {
    __setRedisClientForTests(undefined);
    vi.useRealTimers();
  });

  it("allows up to the IP limit, then blocks", async () => {
    // contactForm: 3 per IP per 15 minutes
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await checkRateLimit("contactForm", "10.0.0.1"));
    }
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[0].resetTime?.getTime()).toBe(
      Date.now() + 15 * 60 * 1000,
    );
  });

  it("uses the email limit for email identifiers", async () => {
    // contactForm: 2 per email per hour
    const a = await checkRateLimit("contactForm", "a@example.com");
    const b = await checkRateLimit("contactForm", "a@example.com");
    const c = await checkRateLimit("contactForm", "a@example.com");
    expect([a.allowed, b.allowed, c.allowed]).toEqual([true, true, false]);
  });

  it("keeps identifiers and action types apart", async () => {
    await checkRateLimit("cleanerApplication", "x@example.com");
    expect((await checkRateLimit("cleanerApplication", "x@example.com")).allowed).toBe(false);
    expect((await checkRateLimit("cleanerApplication", "y@example.com")).allowed).toBe(true);
    expect((await checkRateLimit("registration", "x@example.com")).allowed).toBe(true);
  });

  it("opens a new window once the old one has passed", async () => {
    await checkRateLimit("cleanerApplication", "z@example.com");
    expect((await checkRateLimit("cleanerApplication", "z@example.com")).allowed).toBe(false);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    expect((await checkRateLimit("cleanerApplication", "z@example.com")).allowed).toBe(true);
  });

  it("getRateLimitStatus reports without counting", async () => {
    expect(await getRateLimitStatus("passwordReset", "10.0.0.2")).toEqual({
      allowed: true,
      remaining: 5,
    });
    await checkRateLimit("passwordReset", "10.0.0.2");
    const status = await getRateLimitStatus("passwordReset", "10.0.0.2");
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(4);
    expect(status.resetTime).toBeInstanceOf(Date);
    // Peeking again does not use anything up
    expect((await getRateLimitStatus("passwordReset", "10.0.0.2")).remaining).toBe(4);
  });
});

describe("rate limiter, Redis specifics", () => {
  afterEach(() => {
    __setRedisClientForTests(undefined);
  });

  it("prefixes keys and does not store the raw identifier", () => {
    const key = redisKey("contactForm", "someone@example.com");
    expect(key.startsWith("bb:ratelimit:contactForm:")).toBe(true);
    expect(key).not.toContain("someone");
  });

  it("fails open, logging once, when Redis errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    __setRedisClientForTests({
      eval: async () => {
        throw new Error("connect ECONNREFUSED");
      },
    });

    const first = await checkRateLimit("contactForm", "10.0.0.3");
    const second = await checkRateLimit("contactForm", "10.0.0.3");
    const status = await getRateLimitStatus("contactForm", "10.0.0.3");

    expect(first).toEqual({ allowed: true, remaining: 3 });
    expect(second.allowed).toBe(true);
    expect(status.allowed).toBe(true);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});
