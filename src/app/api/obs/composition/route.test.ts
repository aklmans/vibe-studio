import assert from "node:assert/strict";
import { equal } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { GET, POST } from "./route";

/*
 * Route guard tests only. The valid-POST path talks to a live OBS instance and
 * is covered by obs-composition-runtime.test.ts with a fake connection —
 * tests must never reach the developer's real OBS.
 */

function withShowcase(run: () => Promise<void>): Promise<void> {
  const saved = process.env.VIBE_SHOWCASE;
  process.env.VIBE_SHOWCASE = "1";
  return run().finally(() => {
    if (saved === undefined) delete process.env.VIBE_SHOWCASE;
    else process.env.VIBE_SHOWCASE = saved;
  });
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/obs/composition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("the composition route does not exist on the public showcase", async () => {
  await withShowcase(async () => {
    equal((await GET()).status, 404);
    equal(
      (await POST(postRequest({ cameraSlot: "camera", layout: "standard" }))).status,
      404,
    );
  });
});

test("POST rejects an invalid composition body before touching OBS", async () => {
  const saved = process.env.VIBE_SHOWCASE;
  delete process.env.VIBE_SHOWCASE;
  try {
    for (const body of [
      {},
      { cameraSlot: "screen", layout: "standard" },
      { cameraSlot: "camera", layout: "swap" },
      { cameraSlot: "camera" },
    ]) {
      const response = await POST(postRequest(body));
      equal(response.status, 400, JSON.stringify(body));
      const data = (await response.json()) as { ok: boolean };
      equal(data.ok, false);
    }
  } finally {
    if (saved === undefined) delete process.env.VIBE_SHOWCASE;
    else process.env.VIBE_SHOWCASE = saved;
  }
});

test("the route stays server-only and never handles the OBS password client-side", () => {
  // Source-level guard: the client wrapper must not import the ws transport.
  const client = readFileSync(resolve("src/lib/obs-composition-client.ts"), "utf8");
  assert.doesNotMatch(client, /obs-ws/);
  assert.doesNotMatch(client, /server_password/);
  assert.match(client, /import type \{ CompositionState \}/);
});
