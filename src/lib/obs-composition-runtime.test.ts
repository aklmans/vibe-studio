import assert from "node:assert/strict";
import { deepStrictEqual, equal } from "node:assert/strict";
import test from "node:test";

import { applyComposition, probeComposition } from "./obs-composition-runtime";
import { ObsRequestError, type ObsConnection } from "./obs-ws";

interface FakeItem {
  id: number;
  enabled: boolean;
  positionY: number;
  index: number;
}

interface RecordedCall {
  type: string;
  data: Record<string, unknown> | undefined;
}

/** In-memory stand-in for a live OBS scene behind an ObsConnection. */
function fakeConnection(items: Record<string, FakeItem>) {
  const calls: RecordedCall[] = [];
  const byId = (id: unknown): FakeItem | undefined =>
    Object.values(items).find((item) => item.id === id);

  const connection: ObsConnection = {
    async request(type, data) {
      calls.push({ type, data });
      const payload = (data ?? {}) as Record<string, unknown>;
      switch (type) {
        case "GetSceneItemId": {
          const item = items[payload.sourceName as string];
          if (!item) throw new ObsRequestError(type, 600, "No source was found");
          return { sceneItemId: item.id };
        }
        case "GetSceneItemEnabled":
          return { sceneItemEnabled: byId(payload.sceneItemId)?.enabled === true };
        case "GetSceneItemTransform":
          return { sceneItemTransform: { positionY: byId(payload.sceneItemId)?.positionY ?? 0 } };
        case "GetSceneItemIndex":
          return { sceneItemIndex: byId(payload.sceneItemId)?.index ?? 0 };
        case "SetSceneItemEnabled": {
          const item = byId(payload.sceneItemId);
          if (item) item.enabled = payload.sceneItemEnabled === true;
          return {};
        }
        case "SetSceneItemTransform": {
          const item = byId(payload.sceneItemId);
          const transform = payload.sceneItemTransform as Record<string, unknown>;
          if (item && typeof transform.positionY === "number") {
            item.positionY = transform.positionY;
          }
          return {};
        }
        case "SetSceneItemIndex": {
          const item = byId(payload.sceneItemId);
          if (item && typeof payload.sceneItemIndex === "number") {
            item.index = payload.sceneItemIndex;
          }
          return {};
        }
        default:
          throw new Error(`unexpected request ${type}`);
      }
    },
    close() {},
  };
  return { connection, calls, items };
}

function fullScene(): Record<string, FakeItem> {
  return {
    "Vibe Main Display Capture": { id: 1, enabled: true, positionY: 24, index: 0 },
    "Vibe Camera Capture": { id: 2, enabled: true, positionY: 786, index: 2 },
    "Vibe Second Screen Capture": { id: 3, enabled: false, positionY: 786, index: 3 },
    "Vibe Overlay Avatar Frame": { id: 4, enabled: false, positionY: 0, index: 4 },
    "Vibe Overlay Empty Frame": { id: 5, enabled: true, positionY: 0, index: 5 },
  };
}

test("probeComposition reconstructs the current state from a full scene", async () => {
  const { connection } = fakeConnection(fullScene());
  const probe = await probeComposition(connection);
  deepStrictEqual(probe.current, { cameraSlot: "camera", layout: "standard" });
  deepStrictEqual(probe.missingSources, []);
});

test("probeComposition reports the optional second screen as missing", async () => {
  const scene = fullScene();
  delete scene["Vibe Second Screen Capture"];
  const { connection } = fakeConnection(scene);
  const probe = await probeComposition(connection);
  deepStrictEqual(probe.missingSources, ["Vibe Second Screen Capture"]);
  deepStrictEqual(probe.current, { cameraSlot: "camera", layout: "standard" });
});

test("probeComposition detects a swapped second-screen composition", async () => {
  const scene = fullScene();
  scene["Vibe Camera Capture"].enabled = false;
  scene["Vibe Second Screen Capture"].enabled = true;
  scene["Vibe Main Display Capture"].positionY = 786;
  const { connection } = fakeConnection(scene);
  const probe = await probeComposition(connection);
  deepStrictEqual(probe.current, { cameraSlot: "second-screen", layout: "swapped" });
});

test("applyComposition drives enables and transforms for second-screen standard", async () => {
  const { connection, items } = fakeConnection(fullScene());
  const result = await applyComposition(connection, {
    cameraSlot: "second-screen",
    layout: "standard",
  });

  equal(result.ok, true);
  deepStrictEqual(result.missingRequired, []);
  equal(items["Vibe Second Screen Capture"].enabled, true);
  equal(items["Vibe Camera Capture"].enabled, false);
  equal(items["Vibe Overlay Empty Frame"].enabled, true);
  equal(items["Vibe Overlay Avatar Frame"].enabled, false);
  equal(items["Vibe Main Display Capture"].enabled, true);
  // Transforms landed: display in the main frame, second screen in the slot.
  equal(items["Vibe Main Display Capture"].positionY, 24);
  equal(items["Vibe Second Screen Capture"].positionY, 786);
});

test("applyComposition refuses without side effects when the selected source is absent", async () => {
  const scene = fullScene();
  delete scene["Vibe Second Screen Capture"];
  const { connection, calls, items } = fakeConnection(scene);

  const result = await applyComposition(connection, {
    cameraSlot: "second-screen",
    layout: "standard",
  });

  equal(result.ok, false);
  deepStrictEqual(result.missingRequired, ["Vibe Second Screen Capture"]);
  assert(
    !calls.some((call) => call.type.startsWith("Set")),
    "no Set* request may run when the apply is refused",
  );
  equal(items["Vibe Camera Capture"].enabled, true); // untouched
});

test("applyComposition tolerates a missing source that is not required", async () => {
  const scene = fullScene();
  delete scene["Vibe Second Screen Capture"];
  const { connection, items } = fakeConnection(scene);

  const result = await applyComposition(connection, {
    cameraSlot: "camera",
    layout: "standard",
  });

  equal(result.ok, true);
  deepStrictEqual(result.missingSources, ["Vibe Second Screen Capture"]);
  equal(items["Vibe Camera Capture"].enabled, true);
});

test("applyComposition tucks a manually-added second screen below the overlay frames", async () => {
  const scene = fullScene();
  scene["Vibe Second Screen Capture"].index = 7; // added later → landed on top
  const { connection, calls, items } = fakeConnection(scene);

  await applyComposition(connection, { cameraSlot: "second-screen", layout: "standard" });

  const move = calls.find((call) => call.type === "SetSceneItemIndex");
  assert(move, "expected a targeted z-order fix");
  equal((move.data as Record<string, unknown>).sceneItemIndex, 5);
  equal(items["Vibe Second Screen Capture"].index, 5);

  // Already below the frames → no index churn.
  const settled = fakeConnection(fullScene());
  await applyComposition(settled.connection, { cameraSlot: "second-screen", layout: "standard" });
  assert(!settled.calls.some((call) => call.type === "SetSceneItemIndex"));
});
