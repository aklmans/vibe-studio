import { equal, ok } from "node:assert/strict";
import test from "node:test";
import { GET, PATCH } from "./route";

/*
 * Showcase guard (review P2-12): live-state is a single-user surface. On the
 * public showcase the WRITE path does not exist (404, matching
 * /api/obs/composition) so anonymous visitors cannot rewrite what the shared
 * demo's OBS pages render; reads stay open for the OBS routes.
 */

function withShowcase(run: () => Promise<void>): Promise<void> {
  const saved = process.env.VIBE_SHOWCASE;
  process.env.VIBE_SHOWCASE = "1";
  return run().finally(() => {
    if (saved === undefined) delete process.env.VIBE_SHOWCASE;
    else process.env.VIBE_SHOWCASE = saved;
  });
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/live-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("live-state writes do not exist on the public showcase; reads stay open", async () => {
  await withShowcase(async () => {
    equal((await PATCH(patchRequest({ locale: "en" }))).status, 404);
    equal(GET().status, 200);
  });
});

test("live-state writes work on a local/private deployment", async () => {
  const saved = process.env.VIBE_SHOWCASE;
  delete process.env.VIBE_SHOWCASE;
  try {
    const response = await PATCH(patchRequest(null));
    equal(response.status, 200);
    const snapshot = (await response.json()) as { revision?: number };
    ok(typeof snapshot === "object" && snapshot !== null);
  } finally {
    if (saved !== undefined) process.env.VIBE_SHOWCASE = saved;
  }
});
