import { deepEqual, equal, notEqual } from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE, type OverlayState } from "../types";
import {
  MAX_AGENDA_SECTIONS,
  MAX_SECTION_BULLETS,
  addBullet,
  addSection,
  clampSectionIndex,
  driveAgendaTo,
  moveSection,
  removeBullet,
  removeSection,
  restartSectionTimer,
  sectionWindow,
} from "./agenda";

const NOW = "2026-07-10T20:15:00.000Z";
const LATER = "2026-07-10T20:30:00.000Z";

test("driving the agenda clamps the index and stamps the section timer", () => {
  const driven = driveAgendaTo(DEFAULT_STATE, 1, NOW);
  equal(driven.sidebar.activeSection, 1);
  equal(driven.sidebar.activeSectionStartedAt, NOW);

  // Out-of-range drives land on the edges instead of exploding.
  equal(driveAgendaTo(DEFAULT_STATE, -3, NOW).sidebar.activeSection, 0);
  equal(
    driveAgendaTo(DEFAULT_STATE, 99, NOW).sidebar.activeSection,
    DEFAULT_STATE.sidebar.sections.length - 1,
  );
});

test("re-driving the same already-timed section is a no-op (timer keeps running)", () => {
  const driven = driveAgendaTo(DEFAULT_STATE, 1, NOW);
  const again = driveAgendaTo(driven, 1, LATER);
  equal(again, driven);
  equal(again.sidebar.activeSectionStartedAt, NOW);
});

test("the first drive onto the current untimed section still starts the timer", () => {
  // activeSection is already 0 in defaults but nothing has been timed yet.
  const driven = driveAgendaTo(DEFAULT_STATE, 0, NOW);
  equal(driven.sidebar.activeSectionStartedAt, NOW);
});

test("restartSectionTimer re-stamps without moving the agenda", () => {
  const driven = driveAgendaTo(DEFAULT_STATE, 1, NOW);
  const restarted = restartSectionTimer(driven, LATER);
  equal(restarted.sidebar.activeSection, 1);
  equal(restarted.sidebar.activeSectionStartedAt, LATER);
});

test("clampSectionIndex floors fractional input", () => {
  equal(clampSectionIndex(DEFAULT_STATE, 1.9), 1);
});

/* ------------------------------------------------------------------ */
/* Structure ops: add / remove / move sections, add / remove bullets. */
/* ------------------------------------------------------------------ */

/** Defaults + a progress slot pinned to section 2 in two different profiles,
 *  so remap behaviour across ALL bar profiles is observable. */
function stateWithProgressAt(sectionIndex: number): OverlayState {
  return {
    ...DEFAULT_STATE,
    sidebar: {
      ...DEFAULT_STATE.sidebar,
      activeSection: 1,
      sectionsDone: [[true], [false, true], [false]],
    },
    bottomBar: {
      ...DEFAULT_STATE.bottomBar,
      segments: {
        ...DEFAULT_STATE.bottomBar.segments,
        workbench: [{ kind: "progress", sectionIndex }],
        lecture: [{ kind: "live" }, { kind: "progress", sectionIndex }],
      },
    },
  };
}

function progressIndex(state: OverlayState, profile: "workbench" | "lecture"): number {
  const slot = state.bottomBar.segments[profile].find((s) => s.kind === "progress");
  if (!slot || slot.kind !== "progress") throw new Error("progress slot missing");
  return slot.sectionIndex;
}

test("addSection appends a bullet-less section with an empty done row", () => {
  const next = addSection(DEFAULT_STATE, "New Section");
  equal(next.sidebar.sections.length, DEFAULT_STATE.sidebar.sections.length + 1);
  const added = next.sidebar.sections[next.sidebar.sections.length - 1];
  equal(added.title, "New Section");
  deepEqual(added.bullets, []);
  equal(next.sidebar.sectionsDone.length, next.sidebar.sections.length);
  deepEqual(next.sidebar.sectionsDone[next.sidebar.sections.length - 1], []);
});

test("addSection is a no-op at the section cap", () => {
  let state: OverlayState = DEFAULT_STATE;
  for (let i = 0; i < 20; i += 1) state = addSection(state, `S${i}`);
  equal(state.sidebar.sections.length, MAX_AGENDA_SECTIONS);
  equal(addSection(state, "Over"), state);
});

test("removeSection drops the section, its done row, and remaps every profile's progress", () => {
  const state = stateWithProgressAt(2);
  const next = removeSection(state, 0);

  equal(next.sidebar.sections.length, 2);
  equal(next.sidebar.sections[0].title, state.sidebar.sections[1].title);
  deepEqual(next.sidebar.sectionsDone, [[false, true], [false]]);
  // Active was 1 → shifts to 0; progress pinned to 2 → shifts to 1 in BOTH profiles.
  equal(next.sidebar.activeSection, 0);
  equal(progressIndex(next, "workbench"), 1);
  equal(progressIndex(next, "lecture"), 1);
});

test("removing the section a progress slot points at clamps it into range", () => {
  const state = stateWithProgressAt(2);
  const next = removeSection(state, 2);
  equal(next.sidebar.sections.length, 2);
  equal(progressIndex(next, "workbench"), 1);
  equal(progressIndex(next, "lecture"), 1);
});

test("the last remaining section can never be removed", () => {
  let state: OverlayState = DEFAULT_STATE;
  state = removeSection(state, 0);
  state = removeSection(state, 0);
  equal(state.sidebar.sections.length, 1);
  equal(removeSection(state, 0), state);
});

test("moveSection swaps sections with their done rows and follows active + progress", () => {
  const state = stateWithProgressAt(2);
  const next = moveSection(state, 1, 1); // swap sections 1 and 2

  equal(next.sidebar.sections[1].title, state.sidebar.sections[2].title);
  equal(next.sidebar.sections[2].title, state.sidebar.sections[1].title);
  deepEqual(next.sidebar.sectionsDone, [[true], [false], [false, true]]);
  // Active section 1 moved to 2; progress pinned to 2 followed to 1.
  equal(next.sidebar.activeSection, 2);
  equal(progressIndex(next, "workbench"), 1);
  equal(progressIndex(next, "lecture"), 1);
});

test("moveSection at the boundary is a no-op", () => {
  equal(moveSection(DEFAULT_STATE, 0, -1), DEFAULT_STATE);
  const last = DEFAULT_STATE.sidebar.sections.length - 1;
  equal(moveSection(DEFAULT_STATE, last, 1), DEFAULT_STATE);
});

test("addBullet grows the section and its done row in lockstep, up to the cap", () => {
  let state: OverlayState = addSection(DEFAULT_STATE, "Pure agenda");
  const idx = state.sidebar.sections.length - 1;
  for (let i = 0; i < 10; i += 1) state = addBullet(state, idx);
  equal(state.sidebar.sections[idx].bullets.length, MAX_SECTION_BULLETS);
  equal(state.sidebar.sectionsDone[idx].length, MAX_SECTION_BULLETS);
  equal(addBullet(state, idx), state);
});

test("removeBullet drops the bullet and its done flag; zero bullets is legal", () => {
  const state = stateWithProgressAt(0);
  const next = removeBullet(state, 1, 0);
  equal(
    next.sidebar.sections[1].bullets.length,
    state.sidebar.sections[1].bullets.length - 1,
  );
  // Done flags stay aligned: [false, true] loses index 0 → [true].
  deepEqual(next.sidebar.sectionsDone[1], [true]);

  // Draining a section to zero bullets is allowed (pure agenda item).
  let drained: OverlayState = state;
  while (drained.sidebar.sections[0].bullets.length > 0) {
    const before = drained;
    drained = removeBullet(drained, 0, 0);
    notEqual(drained, before);
  }
  deepEqual(drained.sidebar.sections[0].bullets, []);
  deepEqual(drained.sidebar.sectionsDone[0], []);
});

test("sectionWindow keeps ≤3 sections untouched and slides from the active one", () => {
  // Pass-through when everything fits.
  deepEqual(sectionWindow(0, 3), { start: 0, end: 3 });
  deepEqual(sectionWindow(2, 3), { start: 0, end: 3 });
  deepEqual(sectionWindow(0, 1), { start: 0, end: 1 });

  // Head, middle and tail of an 8-section agenda.
  deepEqual(sectionWindow(0, 8), { start: 0, end: 3 });
  deepEqual(sectionWindow(4, 8), { start: 4, end: 7 });
  deepEqual(sectionWindow(7, 8), { start: 5, end: 8 });
  deepEqual(sectionWindow(6, 8), { start: 5, end: 8 });
});
