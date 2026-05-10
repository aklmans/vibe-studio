import assert from "node:assert/strict";
import test from "node:test";

import { normalizeObsCameraMode } from "./obs-camera";

test("normalizeObsCameraMode accepts supported camera modes", () => {
  assert.equal(normalizeObsCameraMode("empty"), "empty");
  assert.equal(normalizeObsCameraMode("avatar"), "avatar");
});

test("normalizeObsCameraMode falls back to avatar for missing or invalid values", () => {
  assert.equal(normalizeObsCameraMode(undefined), "avatar");
  assert.equal(normalizeObsCameraMode(""), "avatar");
  assert.equal(normalizeObsCameraMode("off"), "avatar");
});
