import { equal } from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE } from "../types";
import { clampSectionIndex, driveAgendaTo, restartSectionTimer } from "./agenda";

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
