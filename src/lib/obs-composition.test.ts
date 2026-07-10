import assert from "node:assert/strict";
import { deepStrictEqual, equal } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  LECTURE_LEFT_LAYOUT,
  LECTURE_RIGHT_LAYOUT,
  MOBILE_LAYOUT,
  WORKBENCH_LAYOUT,
  type OverlayLayout,
} from "./overlay-layout";
import {
  CAPTURE_SOURCE_NAME,
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
// The workbench always has a camera region; its geometry test pins it.
const CAMERA_SLOT_FRAME = WORKBENCH_LAYOUT.regions.camera!;

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

const off = { enabled: false, positionX: null, positionY: null };
/** A capture parked exactly on a region's top-left, which is what apply does. */
const at = (r: { left: number; top: number }) => ({
  enabled: true,
  positionX: r.left,
  positionY: r.top,
});

test("inferCompositionState reconstructs regions from OBS positions", () => {
  // display-1 in the main frame, webcam in the slot.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: false,
      captures: {
        "display-1": at(MAIN_SCREEN_FRAME),
        "display-2": off,
        app: off,
        camera: at(CAMERA_SLOT_FRAME),
      },
    }),
    { main: "display-1", camera: "camera" },
  );
  // Swapped displays: display-2 up top, display-1 in the slot.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: false,
      captures: {
        "display-1": at(CAMERA_SLOT_FRAME),
        "display-2": at(MAIN_SCREEN_FRAME),
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
        "display-1": at(MAIN_SCREEN_FRAME),
        "display-2": off,
        app: off,
        camera: at(CAMERA_SLOT_FRAME),
      },
    }),
    { main: "display-1", camera: "avatar" },
  );
  // Nothing in the slot, no avatar → off.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: false,
      captures: {
        "display-1": at(MAIN_SCREEN_FRAME),
        "display-2": off,
        app: off,
        camera: off,
      },
    }),
    { main: "display-1", camera: "off" },
  );
});

test("inferCompositionState tells the column from the slides in the lecture layouts", () => {
  // These layouts put main and camera side by side, so a Y-only split cannot
  // separate them — the probe's positionX is what makes this work.
  for (const layout of [LECTURE_LEFT_LAYOUT, LECTURE_RIGHT_LAYOUT] as OverlayLayout[]) {
    const main = layout.regions.main;
    const camera = layout.regions.camera!;
    deepStrictEqual(
      inferCompositionState(
        {
          avatarFrameEnabled: false,
          captures: { "display-1": at(main), "display-2": off, app: off, camera: at(camera) },
        },
        layout,
      ),
      { main: "display-1", camera: "camera" },
      `${layout.id}: display in the slides, webcam in the column`,
    );
    deepStrictEqual(
      inferCompositionState(
        {
          avatarFrameEnabled: false,
          captures: { "display-1": at(camera), "display-2": at(main), app: off, camera: off },
        },
        layout,
      ),
      { main: "display-2", camera: "display-1" },
      `${layout.id}: swapped displays`,
    );
  }
});

test("regions that share a top are separated by X, not Y", () => {
  // The shipped lecture rects happen to differ in Y by the camera titlebar, so a
  // Y split would still work there. This pins the actual capability: the region
  // is chosen by proximity, so a layout may place the two regions on one row.
  const sideBySide: OverlayLayout = {
    id: "lecture-left",
    canvas: { width: 1920, height: 1080 },
    barProfile: "lecture",
    regions: {
      main: { left: 500, top: 144, width: 1000, height: 562 },
      camera: { left: 24, top: 144, width: 440, height: 248 },
    },
    panels: {},
  };
  deepStrictEqual(
    inferCompositionState(
      {
        avatarFrameEnabled: false,
        captures: {
          "display-1": at(sideBySide.regions.main),
          "display-2": off,
          app: off,
          camera: at(sideBySide.regions.camera!),
        },
      },
      sideBySide,
    ),
    { main: "display-1", camera: "camera" },
  );
});

test("inferCompositionState falls back to Y when positionX is unreadable", () => {
  // Older/partial probes carry no X. Still correct while the layout stacks its
  // regions vertically, which is exactly the workbench case.
  deepStrictEqual(
    inferCompositionState({
      avatarFrameEnabled: false,
      captures: {
        "display-1": { enabled: true, positionX: null, positionY: MAIN_SCREEN_FRAME.top },
        "display-2": off,
        app: off,
        camera: { enabled: true, positionX: null, positionY: CAMERA_SLOT_FRAME.top },
      },
    }),
    { main: "display-1", camera: "camera" },
  );
});

test("compositionOps parks sources on the given layout's regions", () => {
  const ops = compositionOps({ main: "display-1", camera: "camera" }, LECTURE_LEFT_LAYOUT);
  const slides = transformFor(ops, CAPTURE_SOURCE_NAME["display-1"])!;
  const webcam = transformFor(ops, CAPTURE_SOURCE_NAME.camera)!;

  equal(slides.positionX, LECTURE_LEFT_LAYOUT.regions.main.left);
  equal(slides.positionY, LECTURE_LEFT_LAYOUT.regions.main.top);
  equal(webcam.positionX, LECTURE_LEFT_LAYOUT.regions.camera!.left);
  equal(webcam.positionY, LECTURE_LEFT_LAYOUT.regions.camera!.top);
  // The column sits left of the slides in this layout.
  equal(webcam.positionX < slides.positionX, true);
});

test("mobile parks the screen share and the camera on its stacked portrait regions", () => {
  const ops = compositionOps({ main: "display-1", camera: "camera" }, MOBILE_LAYOUT);
  const screen = transformFor(ops, CAPTURE_SOURCE_NAME["display-1"])!;
  const webcam = transformFor(ops, CAPTURE_SOURCE_NAME.camera)!;
  equal(screen.positionY, MOBILE_LAYOUT.regions.main.top);
  equal(webcam.positionY, MOBILE_LAYOUT.regions.camera!.top);
  // Stacked vertically: the camera sits below the screen share.
  equal((webcam.positionY as number) > (screen.positionY as number), true);
});

test("a camera-less layout parks only the main capture and keeps the theme frames plain", () => {
  // No layout ships camera-less today, but the guard must hold for one: the
  // camera choice is ignored, no camera transform is emitted, and the avatar
  // theme frame must not switch on.
  const cameraLess: OverlayLayout = {
    id: "mobile",
    canvas: { width: 1080, height: 1920 },
    barProfile: "mobile",
    regions: { main: { left: 24, top: 144, width: 1032, height: 1408 } },
    panels: {},
  };
  const ops = compositionOps({ main: "display-1", camera: "avatar" }, cameraLess);
  deepStrictEqual(enabledMap(ops), {
    "Vibe Overlay Avatar Frame": false,
    "Vibe Overlay Empty Frame": true,
    "Vibe Main Display Capture": true,
    "Vibe Second Screen Capture": false,
    "Vibe Main App Capture": false,
    "Vibe Camera Capture": false,
  });
  equal(ops.transforms.length, 1);
  equal(ops.transforms[0].source, CAPTURE_SOURCE_NAME["display-1"]);
  equal(ops.transforms[0].transform.positionX, cameraLess.regions.main.left);

  // Inference mirrors it: everything reads as main; camera is off even if a
  // stale avatar frame is still enabled in the scene.
  deepStrictEqual(
    inferCompositionState(
      {
        avatarFrameEnabled: true,
        captures: {
          "display-1": at(cameraLess.regions.main),
          "display-2": off,
          app: off,
          camera: off,
        },
      },
      cameraLess,
    ),
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
