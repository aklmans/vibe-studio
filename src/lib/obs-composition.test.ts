import assert from "node:assert/strict";
import { deepStrictEqual, equal } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { WORKBENCH_LAYOUT } from "./overlay-layout";
import {
  canSwap,
  compositionOps,
  hasSourceConflict,
  inferCompositionState,
  isCameraSource,
  isMainSource,
  normalizeComposition,
  slotTransform,
  swapRegions,
  type CameraSource,
  type CompositionState,
} from "./obs-composition";

const MAIN_SCREEN_FRAME = WORKBENCH_LAYOUT.regions.main;
const CAMERA_SLOT_FRAME = WORKBENCH_LAYOUT.regions.camera;

function enabledMap(ops: ReturnType<typeof compositionOps>): Record<string, boolean> {
  return Object.fromEntries(ops.enables.map((op) => [op.source, op.enabled]));
}

function transformFor(
  ops: ReturnType<typeof compositionOps>,
  source: string,
): Record<string, string | number | boolean> | undefined {
  return ops.transforms.find((op) => op.source === source)?.transform;
}

test("the overlay canvas reads geometry from the layout, never its own constants", () => {
  // Geometry now has a single source of truth (overlay-layout.ts), so the old
  // cross-file drift check is replaced by proving the canvas holds no copy.
  const source = readFileSync(resolve("src/components/OverlayCanvas.tsx"), "utf8");
  assert.match(source, /from "\.\.\/lib\/overlay-layout"/);
  for (const stale of ["OBS_CAMERA_SLOT", "CAMERA_PANEL_SLOT", "MAIN_SCREEN_SLOT", "BOTTOM_BAR_SLOT"]) {
    assert.doesNotMatch(source, new RegExp(`const ${stale} = \\{`), `${stale} should come from the layout`);
  }
});

test("default composition: display-1 fills the main frame, webcam fills the slot", () => {
  const ops = compositionOps({ main: "display-1", camera: "camera" });

  deepStrictEqual(enabledMap(ops), {
    "Vibe Overlay Avatar Frame": false,
    "Vibe Overlay Empty Frame": true,
    "Vibe Main Display Capture": true,
    "Vibe Second Screen Capture": false,
    "Vibe Main App Capture": false,
    "Vibe Camera Capture": true,
  });

  const display = transformFor(ops, "Vibe Main Display Capture");
  const camera = transformFor(ops, "Vibe Camera Capture");
  assert(display && camera);
  equal(display.positionX, MAIN_SCREEN_FRAME.left);
  equal(display.boundsType, "OBS_BOUNDS_SCALE_INNER"); // 16:9 into 16:9
  equal(display.cropToBounds, false);
  equal(camera.positionX, CAMERA_SLOT_FRAME.left);
  equal(camera.boundsType, "OBS_BOUNDS_SCALE_OUTER"); // fill 400×272
  equal(camera.cropToBounds, true);
});

test("per-region selection routes each capture independently", () => {
  // Main = the app window; camera = the second screen.
  const ops = compositionOps({ main: "app", camera: "display-2" });
  const enabled = enabledMap(ops);
  equal(enabled["Vibe Main App Capture"], true);
  equal(enabled["Vibe Second Screen Capture"], true);
  equal(enabled["Vibe Main Display Capture"], false);
  equal(enabled["Vibe Camera Capture"], false);

  const app = transformFor(ops, "Vibe Main App Capture");
  const second = transformFor(ops, "Vibe Second Screen Capture");
  assert(app && second);
  equal(app.positionY, MAIN_SCREEN_FRAME.top);
  equal(second.positionY, CAMERA_SLOT_FRAME.top);
  equal(second.boundsType, "OBS_BOUNDS_SCALE_OUTER");
});

test("avatar theme swaps the frame sources and disables every capture", () => {
  const ops = compositionOps({ main: "display-1", camera: "avatar" });
  const enabled = enabledMap(ops);
  equal(enabled["Vibe Overlay Avatar Frame"], true);
  equal(enabled["Vibe Overlay Empty Frame"], false);
  equal(enabled["Vibe Camera Capture"], false);
  equal(enabled["Vibe Second Screen Capture"], false);
  // Main capture stays on (avatar only governs the camera cutout).
  equal(enabled["Vibe Main Display Capture"], true);
  // Only the main transform — no camera capture to place.
  equal(ops.transforms.length, 1);
});

test("camera 'off' leaves the empty frame (focus card) with no camera capture", () => {
  const ops = compositionOps({ main: "display-1", camera: "off" });
  const enabled = enabledMap(ops);
  equal(enabled["Vibe Overlay Empty Frame"], true);
  equal(enabled["Vibe Overlay Avatar Frame"], false);
  equal(enabled["Vibe Camera Capture"], false);
  equal(enabled["Vibe Second Screen Capture"], false);
  equal(ops.transforms.length, 1);
});

test("swap exchanges two display regions and is a no-op otherwise", () => {
  equal(canSwap({ main: "display-1", camera: "display-2" }), true);
  deepStrictEqual(swapRegions({ main: "display-1", camera: "display-2" }), {
    main: "display-2",
    camera: "display-1",
  });
  // App / webcam / avatar / off are not swappable into or out of the main frame.
  for (const state of [
    { main: "app", camera: "display-2" },
    { main: "display-1", camera: "camera" },
    { main: "display-1", camera: "avatar" },
    { main: "display-1", camera: "off" },
  ] as CompositionState[]) {
    equal(canSwap(state), false, JSON.stringify(state));
    deepStrictEqual(swapRegions(state), state);
  }
});

test("conflict detection + normalization keep one capture per region", () => {
  equal(hasSourceConflict({ main: "display-1", camera: "display-1" }), true);
  equal(hasSourceConflict({ main: "display-1", camera: "display-2" }), false);
  equal(hasSourceConflict({ main: "display-1", camera: "avatar" }), false);

  // User just set main → camera yields.
  deepStrictEqual(
    normalizeComposition({ main: "display-2", camera: "display-2" }, "main"),
    { main: "display-2", camera: "camera" },
  );
  // User just set camera → main moves to the other display.
  deepStrictEqual(
    normalizeComposition({ main: "display-1", camera: "display-1" }, "camera"),
    { main: "display-2", camera: "display-1" },
  );
  // No conflict → untouched.
  deepStrictEqual(
    normalizeComposition({ main: "app", camera: "camera" }, "camera"),
    { main: "app", camera: "camera" },
  );
});

test("inferCompositionState reconstructs regions from OBS positions", () => {
  const off = { enabled: false, positionY: null };
  // display-1 in the main frame, webcam in the slot.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: false,
      captures: {
        "display-1": { enabled: true, positionY: MAIN_SCREEN_FRAME.top },
        "display-2": off,
        app: off,
        camera: { enabled: true, positionY: CAMERA_SLOT_FRAME.top },
      },
    }),
    { main: "display-1", camera: "camera" },
  );
  // Swapped displays: display-2 up top, display-1 in the slot.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: false,
      captures: {
        "display-1": { enabled: true, positionY: CAMERA_SLOT_FRAME.top },
        "display-2": { enabled: true, positionY: MAIN_SCREEN_FRAME.top },
        app: off,
        camera: off,
      },
    }),
    { main: "display-2", camera: "display-1" },
  );
  // Avatar wins; camera capture flags ignored.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: true,
      captures: {
        "display-1": { enabled: true, positionY: MAIN_SCREEN_FRAME.top },
        "display-2": off,
        app: off,
        camera: { enabled: true, positionY: CAMERA_SLOT_FRAME.top },
      },
    }),
    { main: "display-1", camera: "avatar" },
  );
  // Nothing in the slot, no avatar → off.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: false,
      captures: {
        "display-1": { enabled: true, positionY: MAIN_SCREEN_FRAME.top },
        "display-2": off,
        app: off,
        camera: off,
      },
    }),
    { main: "display-1", camera: "off" },
  );
});

test("slotTransform sends boundsType as a string enum, not the scene-JSON integer", () => {
  const t = slotTransform({ left: 24, top: 24, width: 1440, height: 810 }, "contain");
  equal(t.boundsType, "OBS_BOUNDS_SCALE_INNER");
  equal(typeof t.boundsType, "string");
  equal(slotTransform({ left: 0, top: 0, width: 1, height: 1 }, "cover").boundsType, "OBS_BOUNDS_SCALE_OUTER");
});

test("type guards accept exactly the wire values", () => {
  for (const value of ["display-1", "display-2", "app"]) equal(isMainSource(value), true, value);
  equal(isMainSource("camera"), false);
  equal(isMainSource("avatar"), false);
  for (const value of ["display-1", "display-2", "camera", "avatar", "off"] as CameraSource[]) {
    equal(isCameraSource(value), true, value);
  }
  equal(isCameraSource("app"), false);
});
