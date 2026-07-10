import { deepEqual, equal, notEqual } from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE, type OverlayState } from "../types";
import {
  MAX_AGENDA_SECTIONS,
  MAX_SECTION_BULLETS,
  activeAgenda,
  activeAgendaProfile,
  addBullet,
  addSection,
  agendaFor,
  clampSectionIndex,
  driveAgendaTo,
  moveSection,
  removeBullet,
  removeSection,
  restartSectionTimer,
  sectionWindow,
  withAgenda,
} from "./agenda";

const NOW = "2026-07-10T20:15:00.000Z";
const LATER = "2026-07-10T20:30:00.000Z";

/** DEFAULT_STATE's layout is workbench — its agenda is the active one. */
const wb = (state: OverlayState) => state.sidebar.agendas.workbench;

test("driving the agenda clamps the index and stamps the section timer", () => {
  const driven = driveAgendaTo(DEFAULT_STATE, 1, NOW);
  equal(wb(driven).activeSection, 1);
  equal(wb(driven).activeSectionStartedAt, NOW);

  // Out-of-range drives land on the edges instead of exploding.
  equal(wb(driveAgendaTo(DEFAULT_STATE, -3, NOW)).activeSection, 0);
  equal(
    wb(driveAgendaTo(DEFAULT_STATE, 99, NOW)).activeSection,
    wb(DEFAULT_STATE).sections.length - 1,
  );
});

test("re-driving the same already-timed section is a no-op (timer keeps running)", () => {
  const driven = driveAgendaTo(DEFAULT_STATE, 1, NOW);
  const again = driveAgendaTo(driven, 1, LATER);
  equal(again, driven);
  equal(wb(again).activeSectionStartedAt, NOW);
});

test("the first drive onto the current untimed section still starts the timer", () => {
  // activeSection is already 0 in defaults but nothing has been timed yet.
  const driven = driveAgendaTo(DEFAULT_STATE, 0, NOW);
  equal(wb(driven).activeSectionStartedAt, NOW);
});

test("restartSectionTimer re-stamps without moving the agenda", () => {
  const driven = driveAgendaTo(DEFAULT_STATE, 1, NOW);
  const restarted = restartSectionTimer(driven, LATER);
  equal(wb(restarted).activeSection, 1);
  equal(wb(restarted).activeSectionStartedAt, LATER);
});

test("clampSectionIndex floors fractional input", () => {
  equal(clampSectionIndex(DEFAULT_STATE, 1.9), 1);
});

/* ------------------------------------------------------------------ */
/* Scene binding: every op targets the ACTIVE layout's agenda only.   */
/* ------------------------------------------------------------------ */

test("the agenda profile follows the scene layout", () => {
  equal(activeAgendaProfile(DEFAULT_STATE), "workbench");
  equal(activeAgendaProfile({ ...DEFAULT_STATE, layout: "lecture-left" }), "lecture");
  equal(activeAgendaProfile({ ...DEFAULT_STATE, layout: "lecture-right" }), "lecture");
  equal(activeAgendaProfile({ ...DEFAULT_STATE, layout: "mobile" }), "mobile");
});

test("driving in a lecture layout moves the lecture agenda and leaves the others alone", () => {
  const lecture: OverlayState = { ...DEFAULT_STATE, layout: "lecture-left" };
  const driven = driveAgendaTo(lecture, 2, NOW);

  equal(agendaFor(driven, "lecture").activeSection, 2);
  equal(agendaFor(driven, "lecture").activeSectionStartedAt, NOW);
  // Workbench and mobile agendas are untouched — including their timers.
  equal(agendaFor(driven, "workbench"), DEFAULT_STATE.sidebar.agendas.workbench);
  equal(agendaFor(driven, "mobile"), DEFAULT_STATE.sidebar.agendas.mobile);
});

test("each profile keeps its own independent section timer across layout switches", () => {
  // Time workbench section 1, switch to lecture, time lecture section 0 later.
  const timedWb = driveAgendaTo(DEFAULT_STATE, 1, NOW);
  const inLecture = driveAgendaTo({ ...timedWb, layout: "lecture-left" }, 0, LATER);

  equal(agendaFor(inLecture, "workbench").activeSectionStartedAt, NOW);
  equal(agendaFor(inLecture, "lecture").activeSectionStartedAt, LATER);

  // Switching back re-reads the still-running workbench timer.
  const backHome: OverlayState = { ...inLecture, layout: "workbench" };
  equal(activeAgenda(backHome).activeSectionStartedAt, NOW);
});

test("structure edits in one scene never leak into another scene's agenda", () => {
  const lecture: OverlayState = { ...DEFAULT_STATE, layout: "lecture-left" };
  const edited = removeSection(addSection(lecture, "临时加节"), 0);

  notEqual(agendaFor(edited, "lecture"), DEFAULT_STATE.sidebar.agendas.lecture);
  equal(agendaFor(edited, "workbench"), DEFAULT_STATE.sidebar.agendas.workbench);
  equal(agendaFor(edited, "mobile"), DEFAULT_STATE.sidebar.agendas.mobile);
});

/* ------------------------------------------------------------------ */
/* Structure ops: add / remove / move sections, add / remove bullets. */
/* ------------------------------------------------------------------ */

/** Defaults + a progress slot pinned to `sectionIndex` in BOTH the workbench
 *  and lecture bars — remap must touch only the active (workbench) profile. */
function stateWithProgressAt(sectionIndex: number): OverlayState {
  const base = withAgenda(DEFAULT_STATE, "workbench", {
    ...DEFAULT_STATE.sidebar.agendas.workbench,
    activeSection: 1,
    sectionsDone: [[true], [false, true], [false]],
  });
  return {
    ...base,
    bottomBar: {
      ...base.bottomBar,
      segments: {
        ...base.bottomBar.segments,
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
  equal(wb(next).sections.length, wb(DEFAULT_STATE).sections.length + 1);
  const added = wb(next).sections[wb(next).sections.length - 1];
  equal(added.title, "New Section");
  deepEqual(added.bullets, []);
  equal(wb(next).sectionsDone.length, wb(next).sections.length);
  deepEqual(wb(next).sectionsDone[wb(next).sections.length - 1], []);
});

test("addSection is a no-op at the section cap", () => {
  let state: OverlayState = DEFAULT_STATE;
  for (let i = 0; i < 20; i += 1) state = addSection(state, `S${i}`);
  equal(wb(state).sections.length, MAX_AGENDA_SECTIONS);
  equal(addSection(state, "Over"), state);
});

test("removeSection drops the section + done row and remaps ONLY the active profile's progress", () => {
  const state = stateWithProgressAt(2);
  const next = removeSection(state, 0);

  equal(wb(next).sections.length, 2);
  equal(wb(next).sections[0].title, wb(state).sections[1].title);
  deepEqual(wb(next).sectionsDone, [[false, true], [false]]);
  // Active was 1 → shifts to 0; the workbench progress pinned to 2 → 1.
  equal(wb(next).activeSection, 0);
  equal(progressIndex(next, "workbench"), 1);
  // The lecture bar indexes the LECTURE agenda — a workbench edit must not
  // remap it (that was the old cross-profile misbinding).
  equal(progressIndex(next, "lecture"), 2);
});

test("removing the section a progress slot points at clamps it into range", () => {
  const state = stateWithProgressAt(2);
  const next = removeSection(state, 2);
  equal(wb(next).sections.length, 2);
  equal(progressIndex(next, "workbench"), 1);
});

test("the last remaining section can never be removed", () => {
  let state: OverlayState = DEFAULT_STATE;
  state = removeSection(state, 0);
  state = removeSection(state, 0);
  equal(wb(state).sections.length, 1);
  equal(removeSection(state, 0), state);
});

test("moveSection swaps sections with their done rows and follows active + progress", () => {
  const state = stateWithProgressAt(2);
  const next = moveSection(state, 1, 1); // swap sections 1 and 2

  equal(wb(next).sections[1].title, wb(state).sections[2].title);
  equal(wb(next).sections[2].title, wb(state).sections[1].title);
  deepEqual(wb(next).sectionsDone, [[true], [false], [false, true]]);
  // Active section 1 moved to 2; the workbench progress pinned to 2 → 1.
  equal(wb(next).activeSection, 2);
  equal(progressIndex(next, "workbench"), 1);
  equal(progressIndex(next, "lecture"), 2);
});

test("moveSection at the boundary is a no-op", () => {
  equal(moveSection(DEFAULT_STATE, 0, -1), DEFAULT_STATE);
  const last = wb(DEFAULT_STATE).sections.length - 1;
  equal(moveSection(DEFAULT_STATE, last, 1), DEFAULT_STATE);
});

test("addBullet grows the section and its done row in lockstep, up to the cap", () => {
  let state: OverlayState = addSection(DEFAULT_STATE, "Pure agenda");
  const idx = wb(state).sections.length - 1;
  for (let i = 0; i < 10; i += 1) state = addBullet(state, idx);
  equal(wb(state).sections[idx].bullets.length, MAX_SECTION_BULLETS);
  equal(wb(state).sectionsDone[idx].length, MAX_SECTION_BULLETS);
  equal(addBullet(state, idx), state);
});

test("removeBullet drops the bullet and its done flag; zero bullets is legal", () => {
  const state = stateWithProgressAt(0);
  const next = removeBullet(state, 1, 0);
  equal(
    wb(next).sections[1].bullets.length,
    wb(state).sections[1].bullets.length - 1,
  );
  // Done flags stay aligned: [false, true] loses index 0 → [true].
  deepEqual(wb(next).sectionsDone[1], [true]);

  // Draining a section to zero bullets is allowed (pure agenda item).
  let drained: OverlayState = state;
  while (wb(drained).sections[0].bullets.length > 0) {
    const before = drained;
    drained = removeBullet(drained, 0, 0);
    notEqual(drained, before);
  }
  deepEqual(wb(drained).sections[0].bullets, []);
  deepEqual(wb(drained).sectionsDone[0], []);
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

  // The lecture card's 5-row window.
  deepEqual(sectionWindow(0, 8, 5), { start: 0, end: 5 });
  deepEqual(sectionWindow(6, 8, 5), { start: 3, end: 8 });
});
