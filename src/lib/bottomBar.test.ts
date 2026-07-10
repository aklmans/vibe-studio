import { deepStrictEqual, equal } from "node:assert/strict";
import test from "node:test";

import {
  LECTURE_DEFAULT_SEGMENTS,
  WORKBENCH_DEFAULT_SEGMENTS,
  segmentsForLayoutSwitch,
  type BottomBarSlot,
} from "./bottomBar";

test("switching layouts swaps untouched default segments both ways", () => {
  // Workbench default → a lecture layout: adopt the lecture lower-third.
  deepStrictEqual(
    segmentsForLayoutSwitch(WORKBENCH_DEFAULT_SEGMENTS, "lecture-left"),
    LECTURE_DEFAULT_SEGMENTS,
  );
  deepStrictEqual(
    segmentsForLayoutSwitch(WORKBENCH_DEFAULT_SEGMENTS, "lecture-right"),
    LECTURE_DEFAULT_SEGMENTS,
  );
  // Lecture default → workbench: restore the coding-stream triple.
  deepStrictEqual(
    segmentsForLayoutSwitch(LECTURE_DEFAULT_SEGMENTS, "workbench"),
    WORKBENCH_DEFAULT_SEGMENTS,
  );
});

test("a hand-edited bottom bar is never touched by a layout switch", () => {
  const custom: BottomBarSlot[] = [
    { kind: "live" },
    { kind: "text", title: "打赏", text: "谢谢老板" },
    { kind: "stack" },
  ];
  equal(segmentsForLayoutSwitch(custom, "lecture-left"), null);
  equal(segmentsForLayoutSwitch(custom, "workbench"), null);

  // Same kinds as the workbench default but a different progress target still
  // counts as hand-edited.
  const retargeted: BottomBarSlot[] = [
    { kind: "live" },
    { kind: "progress", sectionIndex: 2 },
    { kind: "stack" },
  ];
  equal(segmentsForLayoutSwitch(retargeted, "lecture-left"), null);
});

test("no-op switches return null (already the target set, or mobile)", () => {
  equal(segmentsForLayoutSwitch(LECTURE_DEFAULT_SEGMENTS, "lecture-left"), null);
  equal(segmentsForLayoutSwitch(WORKBENCH_DEFAULT_SEGMENTS, "workbench"), null);
  // Mobile has no bottom bar: leave segments alone so nothing is lost when the
  // user later switches back to a 16:9 layout.
  equal(segmentsForLayoutSwitch(WORKBENCH_DEFAULT_SEGMENTS, "mobile"), null);
  equal(segmentsForLayoutSwitch(LECTURE_DEFAULT_SEGMENTS, "mobile"), null);
});

test("the swap returns fresh slot objects, not shared references", () => {
  const swapped = segmentsForLayoutSwitch(WORKBENCH_DEFAULT_SEGMENTS, "lecture-left")!;
  equal(swapped === LECTURE_DEFAULT_SEGMENTS, false);
  swapped.forEach((slot, i) => equal(slot === LECTURE_DEFAULT_SEGMENTS[i], false));
});
