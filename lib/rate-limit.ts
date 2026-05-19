/**
 * F-08 FIX: Simple in-process rate limiter using a sliding-window counter.
 * Works in both Node.js and Edge runtime (no external dependencies).
 * For production at scale, replace with Upstash Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  /** Max requests allowed within the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart > config.windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: config.limit - 1, resetIn: config.windowMs }
  }

  if (entry.count >= config.limit) {
    const resetIn = config.windowMs - (now - entry.windowStart)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetIn: config.windowMs - (now - entry.windowStart),
  }
}

// Periodically clean up expired entries to prevent memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 60_000) store.delete(key)
    }
  }, 60_000)
}

/** Pre-configured limiters */
export const AI_RATE_LIMIT: RateLimitConfig = { limit: 10, windowMs: 60_000 }       // 10 req/min
export const MUTATION_RATE_LIMIT: RateLimitConfig = { limit: 30, windowMs: 60_000 } // 30 req/min
export const AUTH_RATE_LIMIT: RateLimitConfig = { limit: 5, windowMs: 60_000 }      // 5 req/min
