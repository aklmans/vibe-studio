import { deepStrictEqual, equal, ok } from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_LAYOUT_ID,
  LAYOUTS,
  LAYOUT_IDS,
  LECTURE_LEFT_LAYOUT,
  LECTURE_RIGHT_LAYOUT,
  WORKBENCH_LAYOUT,
  cameraCutoutFor,
  getLayout,
  isLayoutId,
  type Rect,
} from "./overlay-layout";

/*
 * Anti-drift baseline.
 *
 * These literals are the geometry the overlay shipped with before it was
 * extracted here — previously duplicated across OverlayCanvas.tsx and
 * live-prepare.ts and kept in sync by hand. They are now the single source for
 * the rendered frame AND the OBS scene-item transforms, so any change is a
 * visible change to the broadcast. Change them deliberately, never incidentally.
 */
test("workbench layout keeps the shipped geometry, field for field", () => {
  equal(WORKBENCH_LAYOUT.id, "workbench");
  deepStrictEqual(WORKBENCH_LAYOUT.canvas, { width: 1920, height: 1080 });

  deepStrictEqual(WORKBENCH_LAYOUT.regions.main, { left: 24, top: 24, width: 1440, height: 810 });
  deepStrictEqual(WORKBENCH_LAYOUT.regions.camera, { left: 1498, top: 786, width: 400, height: 272 });

  deepStrictEqual(WORKBENCH_LAYOUT.panels.sidebar, { left: 1496, top: 24, width: 400, height: 708 });
  deepStrictEqual(WORKBENCH_LAYOUT.panels.cameraPanel, { left: 1496, top: 756, width: 400, height: 300 });
  // Derived: top = main.top + main.height + edge; height = canvas - top - edge.
  deepStrictEqual(WORKBENCH_LAYOUT.panels.bottomBar, { left: 24, top: 858, width: 1440, height: 198 });
});

function right(r: Rect): number {
  return r.left + r.width;
}
function bottom(r: Rect): number {
  return r.top + r.height;
}

test("workbench regions and panels stay inside the canvas", () => {
  const { width, height } = WORKBENCH_LAYOUT.canvas;
  const rects: Rect[] = [
    ...Object.values(WORKBENCH_LAYOUT.regions),
    ...(Object.values(WORKBENCH_LAYOUT.panels) as Rect[]),
  ];
  for (const r of rects) {
    ok(r.left >= 0 && r.top >= 0, "no rect starts off-canvas");
    ok(right(r) <= width && bottom(r) <= height, "no rect overflows the canvas");
  }
});

test("workbench keeps the main frame clear of the right column and the bottom bar", () => {
  const main = WORKBENCH_LAYOUT.regions.main;
  const sidebar = WORKBENCH_LAYOUT.panels.sidebar!;
  const bottomBar = WORKBENCH_LAYOUT.panels.bottomBar!;

  // The right column starts after the main frame ends.
  ok(right(main) <= sidebar.left, "main must not overlap the sidebar");
  // The bottom bar sits below the main frame.
  ok(bottomBar.top >= bottom(main), "bottom bar must sit below the main frame");
  // The camera panel hangs under the sidebar in the same column.
  equal(WORKBENCH_LAYOUT.panels.cameraPanel!.left, sidebar.left);
});

test("getLayout resolves the default layout", () => {
  equal(DEFAULT_LAYOUT_ID, "workbench");
  equal(getLayout(), WORKBENCH_LAYOUT);
  equal(getLayout("workbench"), WORKBENCH_LAYOUT);
  equal(isLayoutId("lecture-left"), true);
  equal(isLayoutId("nope"), false);
  // Untrusted input (localStorage / live-state PATCH / ?layout=) flows through
  // this guard: Object.prototype keys must not pass, or getLayout returns a
  // non-layout and every OverlayCanvas render crashes.
  for (const hostile of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
    equal(isLayoutId(hostile), false, `${hostile} must be rejected`);
  }
  equal(isLayoutId(42), false);
  equal(isLayoutId(null), false);
});

test("the camera cutout is derived from its panel's chrome, never written twice", () => {
  // 2px border + 28px titlebar. This is what used to be duplicated by hand.
  deepStrictEqual(cameraCutoutFor({ left: 1496, top: 756, width: 400, height: 300 }), {
    left: 1498,
    top: 786,
    width: 400,
    height: 272,
  });
  for (const layout of Object.values(LAYOUTS)) {
    const panel = layout.panels.cameraPanel;
    if (!panel) continue;
    deepStrictEqual(layout.regions.camera, cameraCutoutFor(panel), `${layout.id} cutout`);
  }
});

test("lecture-left puts the presenter column left of 16:9 slides", () => {
  deepStrictEqual(LECTURE_LEFT_LAYOUT.panels.header, { left: 24, top: 24, width: 1872, height: 96 });
  deepStrictEqual(LECTURE_LEFT_LAYOUT.panels.cameraPanel, { left: 24, top: 144, width: 440, height: 280 });
  deepStrictEqual(LECTURE_LEFT_LAYOUT.regions.camera, { left: 26, top: 174, width: 440, height: 252 });
  deepStrictEqual(LECTURE_LEFT_LAYOUT.panels.intro, { left: 24, top: 448, width: 440, height: 608 });
  deepStrictEqual(LECTURE_LEFT_LAYOUT.regions.main, { left: 488, top: 144, width: 1408, height: 792 });
  deepStrictEqual(LECTURE_LEFT_LAYOUT.panels.bottomBar, { left: 488, top: 960, width: 1408, height: 96 });
  equal(LECTURE_LEFT_LAYOUT.panels.sidebar, undefined, "lecture layouts have no sidebar");
});

test("lecture-right mirrors lecture-left", () => {
  deepStrictEqual(LECTURE_RIGHT_LAYOUT.regions.main, { left: 24, top: 144, width: 1408, height: 792 });
  deepStrictEqual(LECTURE_RIGHT_LAYOUT.panels.cameraPanel, { left: 1456, top: 144, width: 440, height: 280 });
  deepStrictEqual(LECTURE_RIGHT_LAYOUT.regions.camera, { left: 1458, top: 174, width: 440, height: 252 });
  deepStrictEqual(LECTURE_RIGHT_LAYOUT.panels.intro, { left: 1456, top: 448, width: 440, height: 608 });
  deepStrictEqual(LECTURE_RIGHT_LAYOUT.panels.bottomBar, { left: 24, top: 960, width: 1408, height: 96 });
  equal(LECTURE_RIGHT_LAYOUT.panels.sidebar, undefined, "lecture layouts have no sidebar");
});

test("the lecture main region is an exact 16:9", () => {
  for (const layout of [LECTURE_LEFT_LAYOUT, LECTURE_RIGHT_LAYOUT]) {
    const { width, height } = layout.regions.main;
    equal(width * 9, height * 16, `${layout.id} main must be 16:9`);
  }
});

test("every layout keeps its rects on-canvas and its two regions apart", () => {
  for (const id of LAYOUT_IDS) {
    const layout = LAYOUTS[id];
    const { width, height } = layout.canvas;
    const rects: Rect[] = [
      ...Object.values(layout.regions),
      ...(Object.values(layout.panels) as Rect[]),
    ];
    for (const r of rects) {
      ok(r.left >= 0 && r.top >= 0, `${id}: no rect starts off-canvas`);
      ok(right(r) <= width && bottom(r) <= height, `${id}: no rect overflows the canvas`);
    }
    const { main, camera } = layout.regions;
    const disjoint =
      right(main) <= camera.left ||
      right(camera) <= main.left ||
      bottom(main) <= camera.top ||
      bottom(camera) <= main.top;
    ok(disjoint, `${id}: the main and camera regions must not overlap`);
  }
});
