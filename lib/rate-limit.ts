/**
 * Rate limiter.
 *
 * - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses a global
 *   Redis-backed sliding window (shared across Vercel Function containers).
 * - Otherwise falls back to an in-memory window (per container).
 *
 * The async `rateLimit()` is the one you should use in route handlers.
 */

type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();
function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key) ?? { hits: [] };
  const cutoff = now - windowMs;
  bucket.hits = bucket.hits.filter((ts) => ts > cutoff);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      resetAt: (bucket.hits[0] ?? now) + windowMs,
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: limit - bucket.hits.length,
    resetAt: now + windowMs,
  };
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(upstashUrl && upstashToken);

async function rateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // Sliding-window via a sorted set keyed by timestamp.
  // Pipelined in one round-trip for minimal latency.
  const now = Date.now();
  const cutoff = now - windowMs;
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

  const body = JSON.stringify([
    ["ZREMRANGEBYSCORE", key, 0, cutoff],
    ["ZADD", key, now, member],
    ["ZCARD", key],
    ["PEXPIRE", key, windowMs],
  ]);

  try {
    const res = await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const arr = (await res.json()) as Array<{ result?: number }>;
    const count = Number(arr[2]?.result ?? 0);
    const ok = count <= limit;
    return {
      ok,
      remaining: Math.max(0, limit - count),
      resetAt: now + windowMs,
    };
  } catch (err) {
    console.error("[rate-limit] Upstash failed, falling back to memory", err);
    return rateLimitMemory(key, limit, windowMs);
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (useUpstash) return rateLimitUpstash(key, limit, windowMs);
  return rateLimitMemory(key, limit, windowMs);
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequestsResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000)
  );
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
      "X-RateLimit-Remaining": "0",
    },
  });
}
