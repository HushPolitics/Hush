/**
 * Minimal in-memory rate limiter for public form endpoints (dispute,
 * contact). This is the "lightweight" protection the spec calls for, not a
 * durable one: state lives in module scope, so it resets on cold start and
 * isn't shared across concurrent serverless instances. Good enough to stop
 * a naive script hammering the endpoint from one warm instance; swap for a
 * shared store (e.g. Upstash's Ratelimit, keyed the same way) before this
 * needs to hold up against real abuse.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

const hits = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count++;
  return true;
}
