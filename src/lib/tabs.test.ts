import test from "node:test";
import assert from "node:assert/strict";
import { APP_TABS, CANVAS_TABS, isCanvasTab } from "./tabs";

test("app tabs include live data while canvas tabs stay exportable previews", () => {
  assert.deepEqual(APP_TABS, [
    "overlay",
    "live",
    "cover",
    "poster",
    "wallpaper",
  ]);
  assert.deepEqual(CANVAS_TABS, ["overlay", "cover", "poster", "wallpaper"]);
  assert.equal(isCanvasTab("overlay"), true);
  assert.equal(isCanvasTab("live"), false);
});
