/**
 * A small login-attempt limiter so a script can't just sit there guessing
 * passwords against one account. Same Redis-or-memory approach as the cache
 * (src/lib/cache.ts): shared and durable across server instances when
 * REDIS_URL is set, an in-process fallback otherwise — never a hard
 * dependency, and a Redis hiccup just falls back rather than breaking login.
 */
import type { Redis } from "ioredis";

const MAX_ATTEMPTS = 6;
const WINDOW_SECONDS = 5 * 60;

const globalForRateLimit = globalThis as unknown as {
  _paytrackLoginAttempts?: Map<string, { count: number; resetAt: number }>;
  _paytrackRateLimitRedis?: Redis | null;
};

const memory = (globalForRateLimit._paytrackLoginAttempts ??= new Map());

async function redisClient(): Promise<Redis | null> {
  if (globalForRateLimit._paytrackRateLimitRedis !== undefined) {
    return globalForRateLimit._paytrackRateLimitRedis;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRateLimit._paytrackRateLimitRedis = null;
    return null;
  }

  try {
    const { default: IORedis } = await import("ioredis");
    const client = new IORedis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    client.on("error", () => {});
    await client.connect();
    globalForRateLimit._paytrackRateLimitRedis = client;
    return client;
  } catch {
    globalForRateLimit._paytrackRateLimitRedis = null;
    return null;
  }
}

function key(identifier: string): string {
  return "paytrack:loginfail:" + identifier.toLowerCase().trim();
}

/**
 * Call once per failed login. Returns how many seconds to wait before the
 * next attempt is allowed, or 0 if there's still room within the window.
 */
export async function recordFailedLogin(identifier: string): Promise<number> {
  const k = key(identifier);

  try {
    const client = await redisClient();
    if (client) {
      const count = await client.incr(k);
      if (count === 1) await client.expire(k, WINDOW_SECONDS);
      if (count <= MAX_ATTEMPTS) return 0;
      const ttl = await client.ttl(k);
      return ttl > 0 ? ttl : WINDOW_SECONDS;
    }
  } catch {
    // fall through to memory
  }

  const now = Date.now();
  const entry = memory.get(k);
  if (!entry || entry.resetAt < now) {
    memory.set(k, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return 0;
  }
  entry.count += 1;
  if (entry.count <= MAX_ATTEMPTS) return 0;
  return Math.ceil((entry.resetAt - now) / 1000);
}

/** How many seconds until the next attempt is allowed — 0 if not currently blocked. Doesn't count an attempt. */
export async function loginBlockedFor(identifier: string): Promise<number> {
  const k = key(identifier);

  try {
    const client = await redisClient();
    if (client) {
      const count = await client.get(k);
      if (!count || Number(count) <= MAX_ATTEMPTS) return 0;
      const ttl = await client.ttl(k);
      return ttl > 0 ? ttl : 0;
    }
  } catch {
    // fall through to memory
  }

  const now = Date.now();
  const entry = memory.get(k);
  if (!entry || entry.resetAt < now || entry.count <= MAX_ATTEMPTS) return 0;
  return Math.ceil((entry.resetAt - now) / 1000);
}

/** Call on a successful login so old failed attempts don't linger and bite later. */
export async function clearFailedLogins(identifier: string): Promise<void> {
  const k = key(identifier);
  memory.delete(k);
  try {
    const client = await redisClient();
    if (client) await client.del(k);
  } catch {
    // memory is already cleared, nothing else to do
  }
}
