import { deepStrictEqual, equal, ok } from "node:assert/strict";
import test from "node:test";

import { DEFAULT_LAYOUT_ID, WORKBENCH_LAYOUT, getLayout, type Rect } from "./overlay-layout";

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
});
