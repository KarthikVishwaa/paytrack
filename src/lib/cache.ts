/**
 * A tiny cache in front of MongoDB so repeat reads (the dashboard especially) are instant.
 *
 * If REDIS_URL is set it uses Redis, which also keeps the cache shared when the app runs on
 * more than one server. If it is not set — or Redis cannot be reached — it silently falls back
 * to an in-process cache, so the app works exactly the same on a laptop with nothing extra
 * installed.
 */
import type { Redis } from "ioredis";

const TTL_SECONDS = 120;

/** Every key we cache. Writes clear the lot: the data set is small and always small. */
export const CACHE_KEYS = ["summary", "settings", "expenses", "users"] as const;
export type CacheKey = (typeof CACHE_KEYS)[number];

interface Entry {
  value: string;
  expiresAt: number;
}

const globalForCache = globalThis as unknown as {
  _paytrackMemoryCache?: Map<string, Entry>;
  _paytrackRedis?: Redis | null;
};

const memory = (globalForCache._paytrackMemoryCache ??= new Map<string, Entry>());

async function redisClient(): Promise<Redis | null> {
  if (globalForCache._paytrackRedis !== undefined) return globalForCache._paytrackRedis;

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForCache._paytrackRedis = null;
    return null;
  }

  try {
    const { default: IORedis } = await import("ioredis");
    const client = new IORedis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      lazyConnect: true,
      // Never let a Redis hiccup take the app down — we just fall back to memory.
      retryStrategy: () => null,
    });
    client.on("error", () => {});
    await client.connect();
    globalForCache._paytrackRedis = client;
    return client;
  } catch {
    console.warn("Redis is not reachable — using the in-memory cache instead.");
    globalForCache._paytrackRedis = null;
    return null;
  }
}

export async function cacheGet<T>(key: CacheKey): Promise<T | null> {
  try {
    const client = await redisClient();
    if (client) {
      const raw = await client.get("paytrack:" + key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
  } catch {
    // fall through to memory
  }

  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

export async function cacheSet(key: CacheKey, value: unknown): Promise<void> {
  const raw = JSON.stringify(value);
  try {
    const client = await redisClient();
    if (client) {
      await client.set("paytrack:" + key, raw, "EX", TTL_SECONDS);
      return;
    }
  } catch {
    // fall through to memory
  }
  memory.set(key, { value: raw, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}

/** Called after every write so nobody ever sees a stale number. */
export async function cacheBust(): Promise<void> {
  memory.clear();
  try {
    const client = await redisClient();
    if (client) await client.del(...CACHE_KEYS.map((k) => "paytrack:" + k));
  } catch {
    // the memory cache is already cleared, nothing else to do
  }
}

/** Reads through the cache, filling it on a miss. */
export async function cached<T>(key: CacheKey, load: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await load();
  await cacheSet(key, value);
  return value;
}
