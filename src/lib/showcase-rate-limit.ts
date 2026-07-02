// Process-local rate limiter for public-showcase agent runs, kept out of the
// route module (Next forbids arbitrary exports from route.ts, and a route can't
// hold a test reset hook). Built once from env on first use; a local/private
// (app-mode) deploy never calls this.
import { createRateLimiter, type RateLimiter } from "./rate-limit";
import { readShowcaseGuardrails } from "./session-agent";

const RATE_WINDOW_MS = 60 * 60 * 1000;

let limiter: RateLimiter | null = null;

export function showcaseRunLimiter(): RateLimiter {
  if (!limiter) {
    const { rateLimitPerHour } = readShowcaseGuardrails(process.env);
    limiter = createRateLimiter({ limit: rateLimitPerHour, windowMs: RATE_WINDOW_MS });
  }
  return limiter;
}

/** Test-only: drop the memoized limiter so the next call rereads env. */
export function resetShowcaseRunLimiterForTest(): void {
  limiter = null;
}
