import type { OverlayState } from "../types";

/*
 * Driving the agenda = changing the active section as a broadcast action.
 * Every switch stamps activeSectionStartedAt so the on-air "time in section"
 * restarts — this is the one choke point all section switches go through
 * (the agenda drive panel, the Sections editors, the inspector tabs).
 */

export function clampSectionIndex(state: OverlayState, index: number): number {
  const last = Math.max(0, state.sidebar.sections.length - 1);
  return Math.min(Math.max(0, Math.floor(index)), last);
}

export function driveAgendaTo(
  state: OverlayState,
  index: number,
  nowIso: string,
): OverlayState {
  const next = clampSectionIndex(state, index);
  if (next === state.sidebar.activeSection && state.sidebar.activeSectionStartedAt) {
    return state; // already there and already timed — no-op
  }
  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      activeSection: next,
      activeSectionStartedAt: nowIso,
    },
  };
}

/** Restart the current section's timer without moving the agenda. */
export function restartSectionTimer(state: OverlayState, nowIso: string): OverlayState {
  return {
    ...state,
    sidebar: { ...state.sidebar, activeSectionStartedAt: nowIso },
  };
}
