import assert from "node:assert/strict";
import test from "node:test";

import { UI_COLORS } from "./design-tokens";
import { getObsCameraFrameColors, normalizeObsCameraMode } from "./obs-camera";

test("normalizeObsCameraMode accepts supported camera modes", () => {
  assert.equal(normalizeObsCameraMode("empty"), "empty");
  assert.equal(normalizeObsCameraMode("avatar"), "avatar");
});

test("normalizeObsCameraMode falls back to avatar for missing or invalid values", () => {
  assert.equal(normalizeObsCameraMode(undefined), "avatar");
  assert.equal(normalizeObsCameraMode(""), "avatar");
  assert.equal(normalizeObsCameraMode("off"), "avatar");
});

test("getObsCameraFrameColors makes the empty camera slot fully transparent", () => {
  assert.deepEqual(getObsCameraFrameColors("empty"), {
    shellBackground: "transparent",
    stageBackground: "transparent",
  });
});

test("getObsCameraFrameColors keeps avatar mode visually unchanged", () => {
  assert.deepEqual(getObsCameraFrameColors("avatar"), {
    shellBackground: UI_COLORS.cameraShell,
    stageBackground: UI_COLORS.cameraStage,
  });
});
