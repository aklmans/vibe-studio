// Minimal in-memory fixed-window rate limiter, keyed by an arbitrary string
// (e.g. a client IP). No dependencies. It is process-local, so it resets on
// redeploy and is not shared across instances — that is acceptable for its only
// job: a coarse abuse guard for the public showcase's agent runs, backed by a
// provider-side spend cap. It is not a distributed or security-grade limiter.
//
// The clock is injectable so the window logic is unit-testable without waiting.

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining hits in the current window after this check. */
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
}

export interface RateLimiterOptions {
  /** Max hits allowed per window per key. */
  limit: number;
  /** Window length in ms. */
  windowMs: number;
  /** Injectable clock (defaults to Date.now); tests pass a fake. */
  now?: () => number;
  /** Sweep expired entries once the map grows past this many keys. */
  maxKeys?: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export function createRateLimiter({
  limit,
  windowMs,
  now = () => Date.now(),
  maxKeys = 10_000,
}: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  function sweep(nowMs: number): void {
    for (const [key, entry] of windows) {
      if (nowMs >= entry.resetAt) windows.delete(key);
    }
  }

  return {
    check(key: string): RateLimitResult {
      const nowMs = now();
      // A limit of 0 (or less) blocks every request — useful as an off switch.
      if (limit <= 0) {
        return { allowed: false, remaining: 0, resetAt: nowMs + windowMs };
      }
      if (windows.size > maxKeys) sweep(nowMs);

      const entry = windows.get(key);
      if (!entry || nowMs >= entry.resetAt) {
        const resetAt = nowMs + windowMs;
        windows.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: limit - 1, resetAt };
      }
      if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }
      entry.count += 1;
      return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
    },
  };
}
