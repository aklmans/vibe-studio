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
          if (item && typeof transform.positionY === "number") item.positionY = transform.positionY;
          return {};
        }
        case "SetSceneItemIndex": {
          const item = byId(payload.sceneItemId);
          if (item && typeof payload.sceneItemIndex === "number") item.index = payload.sceneItemIndex;
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

const MAIN_Y = 24;
const SLOT_Y = 786;

function fullScene(): Record<string, FakeItem> {
  return {
    "Vibe Main Display Capture": { id: 1, enabled: true, positionY: MAIN_Y, index: 0 },
    "Vibe Main App Capture": { id: 2, enabled: false, positionY: MAIN_Y, index: 1 },
    "Vibe Camera Capture": { id: 3, enabled: true, positionY: SLOT_Y, index: 2 },
    "Vibe Second Screen Capture": { id: 4, enabled: false, positionY: SLOT_Y, index: 3 },
    "Vibe Overlay Avatar Frame": { id: 5, enabled: false, positionY: 0, index: 4 },
    "Vibe Overlay Empty Frame": { id: 6, enabled: true, positionY: 0, index: 5 },
  };
}

test("probeComposition reconstructs the current state from a full scene", async () => {
  const { connection } = fakeConnection(fullScene());
  const probe = await probeComposition(connection);
  deepStrictEqual(probe.current, { main: "display-1", camera: "camera" });
  deepStrictEqual(probe.missingSources, []);
});

test("probeComposition reports absent captures so the UI can annotate them", async () => {
  const scene = fullScene();
  delete scene["Vibe Second Screen Capture"];
  delete scene["Vibe Main App Capture"];
  const { connection } = fakeConnection(scene);
  const probe = await probeComposition(connection);
  deepStrictEqual(probe.missingSources.sort(), [
    "Vibe Main App Capture",
    "Vibe Second Screen Capture",
  ]);
  deepStrictEqual(probe.current, { main: "display-1", camera: "camera" });
});

test("probeComposition detects swapped displays", async () => {
  const scene = fullScene();
  scene["Vibe Main Display Capture"].positionY = SLOT_Y;
  scene["Vibe Camera Capture"].enabled = false;
  scene["Vibe Second Screen Capture"].enabled = true;
  scene["Vibe Second Screen Capture"].positionY = MAIN_Y;
  const { connection } = fakeConnection(scene);
  const probe = await probeComposition(connection);
  deepStrictEqual(probe.current, { main: "display-2", camera: "display-1" });
});

test("applyComposition drives enables + transforms for a mixed per-region state", async () => {
  const { connection, items } = fakeConnection(fullScene());
  const result = await applyComposition(connection, { main: "app", camera: "display-2" });

  equal(result.ok, true);
  deepStrictEqual(result.missingRequired, []);
  equal(items["Vibe Main App Capture"].enabled, true);
  equal(items["Vibe Second Screen Capture"].enabled, true);
  equal(items["Vibe Main Display Capture"].enabled, false);
  equal(items["Vibe Camera Capture"].enabled, false);
  equal(items["Vibe Overlay Empty Frame"].enabled, true);
  equal(items["Vibe Overlay Avatar Frame"].enabled, false);
  // App parked in the main frame, second screen in the slot.
  equal(items["Vibe Main App Capture"].positionY, MAIN_Y);
  equal(items["Vibe Second Screen Capture"].positionY, SLOT_Y);
});

test("applyComposition refuses without side effects when the selected source is absent", async () => {
  const scene = fullScene();
  delete scene["Vibe Second Screen Capture"];
  const { connection, calls, items } = fakeConnection(scene);

  const result = await applyComposition(connection, { main: "display-2", camera: "camera" });

  equal(result.ok, false);
  deepStrictEqual(result.missingRequired, ["Vibe Second Screen Capture"]);
  assert(!calls.some((call) => call.type.startsWith("Set")), "no Set* when refused");
  equal(items["Vibe Main Display Capture"].enabled, true); // untouched
});

test("applyComposition tolerates a missing capture that is not selected", async () => {
  const scene = fullScene();
  delete scene["Vibe Second Screen Capture"];
  const { connection, items } = fakeConnection(scene);

  const result = await applyComposition(connection, { main: "display-1", camera: "camera" });

  equal(result.ok, true);
  deepStrictEqual(result.missingSources, ["Vibe Second Screen Capture"]);
  equal(items["Vibe Camera Capture"].enabled, true);
});

test("applyComposition tucks a manually-added second screen below the overlay frames", async () => {
  const scene = fullScene();
  scene["Vibe Second Screen Capture"].index = 7; // added later → landed on top
  const { connection, calls, items } = fakeConnection(scene);

  await applyComposition(connection, { main: "display-1", camera: "display-2" });

  const move = calls.find((call) => call.type === "SetSceneItemIndex");
  assert(move, "expected a targeted z-order fix");
  equal((move.data as Record<string, unknown>).sceneItemIndex, 5);
  equal(items["Vibe Second Screen Capture"].index, 5);

  // Already below the frames → no index churn.
  const settled = fakeConnection(fullScene());
  await applyComposition(settled.connection, { main: "display-1", camera: "camera" });
  assert(!settled.calls.some((call) => call.type === "SetSceneItemIndex"));
});
