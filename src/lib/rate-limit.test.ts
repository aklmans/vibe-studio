import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "./rate-limit";

function fakeClock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

test("allows up to the limit, then blocks within the window", () => {
  const clock = fakeClock();
  const rl = createRateLimiter({ limit: 3, windowMs: 1000, now: clock.now });
  assert.deepEqual(
    [rl.check("a").allowed, rl.check("a").allowed, rl.check("a").allowed],
    [true, true, true],
  );
  const blocked = rl.check("a");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
});

test("reports remaining hits accurately", () => {
  const clock = fakeClock();
  const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: clock.now });
  assert.equal(rl.check("a").remaining, 1);
  assert.equal(rl.check("a").remaining, 0);
});

test("resets after the window elapses", () => {
  const clock = fakeClock();
  const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: clock.now });
  assert.equal(rl.check("a").allowed, true);
  assert.equal(rl.check("a").allowed, false);
  clock.advance(1000);
  assert.equal(rl.check("a").allowed, true);
});

test("tracks keys independently", () => {
  const clock = fakeClock();
  const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: clock.now });
  assert.equal(rl.check("a").allowed, true);
  assert.equal(rl.check("b").allowed, true);
  assert.equal(rl.check("a").allowed, false);
});

test("a limit of 0 blocks every request (off switch)", () => {
  const clock = fakeClock();
  const rl = createRateLimiter({ limit: 0, windowMs: 1000, now: clock.now });
  assert.equal(rl.check("a").allowed, false);
});
