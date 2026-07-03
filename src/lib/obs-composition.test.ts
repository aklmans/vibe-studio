import assert from "node:assert/strict";
import { deepStrictEqual, equal } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { CAMERA_SLOT_FRAME, MAIN_SCREEN_FRAME } from "./live-prepare";
import {
  canSwapLayout,
  compositionOps,
  inferCompositionState,
  isCameraSlotChoice,
  isCompositionLayout,
  slotTransform,
} from "./obs-composition";

function enabledMap(ops: ReturnType<typeof compositionOps>): Record<string, boolean> {
  return Object.fromEntries(ops.enables.map((op) => [op.source, op.enabled]));
}

function transformFor(
  ops: ReturnType<typeof compositionOps>,
  source: string,
): Record<string, string | number | boolean> | undefined {
  return ops.transforms.find((op) => op.source === source)?.transform;
}

test("camera slot geometry matches the overlay canvas OBS cutout", () => {
  const source = readFileSync(resolve("src/components/OverlayCanvas.tsx"), "utf8");
  const match = source.match(
    /const OBS_CAMERA_SLOT = \{\s*left: (\d+),\s*top: (\d+),\s*width: (\d+),\s*height: (\d+),\s*\} as const;/,
  );
  assert(match, "OverlayCanvas.tsx should define OBS_CAMERA_SLOT");
  deepStrictEqual(
    {
      left: Number(match[1]),
      top: Number(match[2]),
      width: Number(match[3]),
      height: Number(match[4]),
    },
    CAMERA_SLOT_FRAME,
  );
});

test("standard camera composition: webcam fills the slot, display fits the main frame", () => {
  const ops = compositionOps({ cameraSlot: "camera", layout: "standard" });

  deepStrictEqual(enabledMap(ops), {
    "Vibe Overlay Empty Frame": true,
    "Vibe Overlay Avatar Frame": false,
    "Vibe Camera Capture": true,
    "Vibe Second Screen Capture": false,
    "Vibe Main Display Capture": true,
  });

  const display = transformFor(ops, "Vibe Main Display Capture");
  const camera = transformFor(ops, "Vibe Camera Capture");
  assert(display && camera);
  equal(display.positionX, MAIN_SCREEN_FRAME.left);
  // obs-websocket wants the string enum, not the scene-JSON integer.
  equal(display.boundsType, "OBS_BOUNDS_SCALE_INNER"); // 16:9 into 16:9, no crop
  equal(display.cropToBounds, false);
  equal(camera.positionX, CAMERA_SLOT_FRAME.left);
  equal(camera.positionY, CAMERA_SLOT_FRAME.top);
  equal(camera.boundsType, "OBS_BOUNDS_SCALE_OUTER"); // fill the 400×272 slot
  equal(camera.cropToBounds, true);
});

test("second-screen composition enables only the second capture in the slot", () => {
  const ops = compositionOps({ cameraSlot: "second-screen", layout: "standard" });
  const enabled = enabledMap(ops);
  equal(enabled["Vibe Second Screen Capture"], true);
  equal(enabled["Vibe Camera Capture"], false);
  equal(enabled["Vibe Overlay Empty Frame"], true);

  const second = transformFor(ops, "Vibe Second Screen Capture");
  assert(second);
  deepStrictEqual(
    { x: second.positionX, y: second.positionY, w: second.boundsWidth, h: second.boundsHeight },
    {
      x: CAMERA_SLOT_FRAME.left,
      y: CAMERA_SLOT_FRAME.top,
      w: CAMERA_SLOT_FRAME.width,
      h: CAMERA_SLOT_FRAME.height,
    },
  );
});

test("swapped layout puts the capture in the main frame and the display in the slot", () => {
  const ops = compositionOps({ cameraSlot: "second-screen", layout: "swapped" });
  const second = transformFor(ops, "Vibe Second Screen Capture");
  const display = transformFor(ops, "Vibe Main Display Capture");
  assert(second && display);
  equal(second.positionX, MAIN_SCREEN_FRAME.left);
  equal(second.boundsType, "OBS_BOUNDS_SCALE_INNER"); // 16:9 fits the main frame exactly
  equal(display.positionX, CAMERA_SLOT_FRAME.left);
  equal(display.boundsType, "OBS_BOUNDS_SCALE_OUTER");
  equal(display.cropToBounds, true);
});

test("avatar theme swaps the frame sources and disables both captures", () => {
  const ops = compositionOps({ cameraSlot: "avatar", layout: "standard" });
  const enabled = enabledMap(ops);
  equal(enabled["Vibe Overlay Avatar Frame"], true);
  equal(enabled["Vibe Overlay Empty Frame"], false);
  equal(enabled["Vibe Camera Capture"], false);
  equal(enabled["Vibe Second Screen Capture"], false);
  // No capture to swap: the display stays in the main frame even if "swapped" leaks in.
  const swappedOps = compositionOps({ cameraSlot: "avatar", layout: "swapped" });
  equal(transformFor(swappedOps, "Vibe Main Display Capture")?.positionX, MAIN_SCREEN_FRAME.left);
  equal(swappedOps.transforms.length, 1);
  equal(canSwapLayout("avatar"), false);
  equal(canSwapLayout("second-screen"), true);
});

test("slotTransform pins the shared transform contract", () => {
  deepStrictEqual(slotTransform({ left: 24, top: 24, width: 1440, height: 810 }, "contain"), {
    positionX: 24,
    positionY: 24,
    boundsType: "OBS_BOUNDS_SCALE_INNER",
    boundsWidth: 1440,
    boundsHeight: 810,
    boundsAlignment: 0,
    alignment: 5,
    rotation: 0,
    cropLeft: 0,
    cropRight: 0,
    cropTop: 0,
    cropBottom: 0,
    cropToBounds: false,
  });
  equal(
    typeof slotTransform({ left: 0, top: 0, width: 1, height: 1 }, "cover").boundsType,
    "string",
    "boundsType must be a string over obs-websocket",
  );
});

test("inferCompositionState reconstructs choice and layout from OBS flags", () => {
  deepStrictEqual(
    inferCompositionState({
      cameraEnabled: true,
      secondScreenEnabled: false,
      avatarFrameEnabled: false,
      mainDisplayPositionY: 24,
    }),
    { cameraSlot: "camera", layout: "standard" },
  );
  deepStrictEqual(
    inferCompositionState({
      cameraEnabled: false,
      secondScreenEnabled: true,
      avatarFrameEnabled: false,
      mainDisplayPositionY: 786,
    }),
    { cameraSlot: "second-screen", layout: "swapped" },
  );
  // Avatar wins over stale capture flags and never reports swapped.
  deepStrictEqual(
    inferCompositionState({
      cameraEnabled: true,
      secondScreenEnabled: false,
      avatarFrameEnabled: true,
      mainDisplayPositionY: 786,
    }),
    { cameraSlot: "avatar", layout: "standard" },
  );
  // Unreadable transform defaults to standard.
  deepStrictEqual(
    inferCompositionState({
      cameraEnabled: true,
      secondScreenEnabled: false,
      avatarFrameEnabled: false,
      mainDisplayPositionY: null,
    }),
    { cameraSlot: "camera", layout: "standard" },
  );
});

test("type guards accept exactly the wire values", () => {
  for (const value of ["camera", "second-screen", "avatar"]) {
    equal(isCameraSlotChoice(value), true, value);
  }
  equal(isCameraSlotChoice("screen"), false);
  equal(isCompositionLayout("standard"), true);
  equal(isCompositionLayout("swapped"), true);
  equal(isCompositionLayout("swap"), false);
});
