import { deepStrictEqual, equal, notStrictEqual } from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE } from "../types";
import {
  LECTURE_DEFAULT_SEGMENTS,
  MOBILE_DEFAULT_SEGMENTS,
  WORKBENCH_DEFAULT_SEGMENTS,
  activeBarProfile,
  activeBarSegments,
  defaultBarSegments,
  withActiveBarSegments,
  type BottomBarSlot,
} from "./bottomBar";
import type { LayoutId } from "./overlay-layout";

function withLayout(layout: LayoutId) {
  return { ...DEFAULT_STATE, layout };
}

test("each layout resolves its own bar profile", () => {
  equal(activeBarProfile(withLayout("workbench")), "workbench");
  equal(activeBarProfile(withLayout("lecture-left")), "lecture");
  equal(activeBarProfile(withLayout("lecture-right")), "lecture");
  equal(activeBarProfile(withLayout("mobile")), "mobile");
});

test("activeBarSegments reads the active profile's set", () => {
  deepStrictEqual(activeBarSegments(withLayout("workbench")), WORKBENCH_DEFAULT_SEGMENTS);
  deepStrictEqual(activeBarSegments(withLayout("lecture-left")), LECTURE_DEFAULT_SEGMENTS);
  deepStrictEqual(activeBarSegments(withLayout("mobile")), MOBILE_DEFAULT_SEGMENTS);
});

test("editing one profile's bar never touches the others", () => {
  // Customize the LECTURE bar while lecture-left is active...
  const lectureCustom: BottomBarSlot[] = [
    { kind: "live" },
    { kind: "text", title: "打赏", text: "谢谢老板" },
  ];
  const edited = withActiveBarSegments(withLayout("lecture-left"), lectureCustom);
  deepStrictEqual(edited.bottomBar.segments.lecture, lectureCustom);
  // ...the workbench and mobile bars are byte-identical to before.
  deepStrictEqual(edited.bottomBar.segments.workbench, DEFAULT_STATE.bottomBar.segments.workbench);
  deepStrictEqual(edited.bottomBar.segments.mobile, DEFAULT_STATE.bottomBar.segments.mobile);

  // Switching layout is just a pointer move: lecture keeps its custom bar and
  // workbench still reads its own untouched set.
  const backOnWorkbench = { ...edited, layout: "workbench" as LayoutId };
  deepStrictEqual(activeBarSegments(backOnWorkbench), WORKBENCH_DEFAULT_SEGMENTS);
  const backOnLecture = { ...edited, layout: "lecture-right" as LayoutId };
  deepStrictEqual(activeBarSegments(backOnLecture), lectureCustom);
});

test("defaultBarSegments returns fresh copies, not shared references", () => {
  const a = defaultBarSegments();
  const b = defaultBarSegments();
  notStrictEqual(a.workbench, b.workbench);
  notStrictEqual(a.lecture[0], b.lecture[0]);
  deepStrictEqual(a, {
    workbench: WORKBENCH_DEFAULT_SEGMENTS,
    lecture: LECTURE_DEFAULT_SEGMENTS,
    mobile: MOBILE_DEFAULT_SEGMENTS,
  });
});
