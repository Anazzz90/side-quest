/**
 * Minimal in-process rate limiter for the CP3 development auth flow.
 *
 * This is intentionally small: it bounds repeated sign-in/sign-up attempts
 * from a single process during local development and review. It is NOT a
 * production control — it resets on restart and does not share state across
 * server instances. A durable, shared store (e.g. Redis, or a Supabase
 * table with a scheduled cleanup) is required before any hosted deployment;
 * that work is tracked against CP1 hosting decisions, not CP3.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
