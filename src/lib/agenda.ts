import type { OverlayState } from "../types";
import type { BottomBarSlot } from "./bottomBar";
import type { BarProfileId } from "./overlay-layout";

/*
 * Driving the agenda = changing the active section as a broadcast action.
 * Every switch stamps activeSectionStartedAt so the on-air "time in section"
 * restarts — this is the one choke point all section switches go through
 * (the agenda drive panel, the Sections editors, the inspector tabs).
 *
 * The structure operations below (add / remove / move sections, add / remove
 * bullets) are the ONLY way the UI reshapes the agenda: each keeps
 * sectionsDone's shape, the active index, and every bar profile's progress
 * segments consistent in one atomic state update.
 */

export const MAX_AGENDA_SECTIONS = 12;
export const MAX_SECTION_BULLETS = 6;

type Sidebar = OverlayState["sidebar"];

/** Remap each profile's progress segments after sections moved or vanished. */
function remapProgressSegments(
  state: OverlayState,
  map: (index: number) => number,
): OverlayState["bottomBar"]["segments"] {
  const remapList = (list: BottomBarSlot[]): BottomBarSlot[] =>
    list.map((slot) =>
      slot.kind === "progress" ? { ...slot, sectionIndex: map(slot.sectionIndex) } : slot,
    );
  const out = {} as OverlayState["bottomBar"]["segments"];
  for (const profile of Object.keys(state.bottomBar.segments) as BarProfileId[]) {
    out[profile] = remapList(state.bottomBar.segments[profile]);
  }
  return out;
}

function withSidebar(state: OverlayState, sidebar: Sidebar): OverlayState {
  return { ...state, sidebar };
}

/** Append a new agenda section (title only; bullets grow on demand). */
export function addSection(state: OverlayState, title: string): OverlayState {
  const sections = state.sidebar.sections;
  if (sections.length >= MAX_AGENDA_SECTIONS) return state;
  return withSidebar(state, {
    ...state.sidebar,
    sections: [...sections, { title, bullets: [] }],
    sectionsDone: [...state.sidebar.sectionsDone, []],
  });
}

/** Remove a section; the last one can never be removed. */
export function removeSection(state: OverlayState, index: number): OverlayState {
  const sections = state.sidebar.sections;
  if (sections.length <= 1 || index < 0 || index >= sections.length) return state;

  const nextSections = sections.filter((_, i) => i !== index);
  const nextDone = state.sidebar.sectionsDone.filter((_, i) => i !== index);
  const nextActive = Math.min(
    state.sidebar.activeSection > index
      ? state.sidebar.activeSection - 1
      : state.sidebar.activeSection,
    nextSections.length - 1,
  );

  return {
    ...withSidebar(state, {
      ...state.sidebar,
      sections: nextSections,
      sectionsDone: nextDone,
      activeSection: nextActive,
    }),
    bottomBar: {
      ...state.bottomBar,
      segments: remapProgressSegments(state, (i) =>
        Math.min(i > index ? i - 1 : i, Math.max(0, nextSections.length - 1)),
      ),
    },
  };
}

/** Move a section one step up (-1) or down (+1), carrying its done-row and
 *  following it with the active index / progress segments. */
export function moveSection(
  state: OverlayState,
  index: number,
  direction: -1 | 1,
): OverlayState {
  const sections = state.sidebar.sections;
  const target = index + direction;
  if (index < 0 || index >= sections.length || target < 0 || target >= sections.length) {
    return state;
  }

  const swap = <T,>(list: T[]): T[] => {
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };
  const mapIndex = (i: number) => (i === index ? target : i === target ? index : i);

  return {
    ...withSidebar(state, {
      ...state.sidebar,
      sections: swap(sections),
      sectionsDone: swap(state.sidebar.sectionsDone),
      activeSection: mapIndex(state.sidebar.activeSection),
    }),
    bottomBar: {
      ...state.bottomBar,
      segments: remapProgressSegments(state, mapIndex),
    },
  };
}

/** Append an empty bullet to a section (grows its done-row too). */
export function addBullet(state: OverlayState, sectionIndex: number): OverlayState {
  const section = state.sidebar.sections[sectionIndex];
  if (!section || section.bullets.length >= MAX_SECTION_BULLETS) return state;
  return withSidebar(state, {
    ...state.sidebar,
    sections: state.sidebar.sections.map((s, i) =>
      i === sectionIndex ? { ...s, bullets: [...s.bullets, ""] } : s,
    ),
    sectionsDone: state.sidebar.sectionsDone.map((row, i) =>
      i === sectionIndex ? [...row, false] : row,
    ),
  });
}

/** Remove one bullet (and its done flag). Empty bullets are legal, so a
 *  section may end up with none — a pure agenda item. */
export function removeBullet(
  state: OverlayState,
  sectionIndex: number,
  bulletIndex: number,
): OverlayState {
  const section = state.sidebar.sections[sectionIndex];
  if (!section || bulletIndex < 0 || bulletIndex >= section.bullets.length) return state;
  return withSidebar(state, {
    ...state.sidebar,
    sections: state.sidebar.sections.map((s, i) =>
      i === sectionIndex
        ? { ...s, bullets: s.bullets.filter((_, j) => j !== bulletIndex) }
        : s,
    ),
    sectionsDone: state.sidebar.sectionsDone.map((row, i) =>
      i === sectionIndex ? row.filter((_, j) => j !== bulletIndex) : row,
    ),
  });
}

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

/**
 * The broadcast sidebar shows at most `size` sections: a window starting at the
 * active one, pulled back at the tail so it stays full. With ≤ size sections it
 * returns [0, total) — the classic all-visible sidebar, pixel-identical.
 */
export function sectionWindow(
  active: number,
  total: number,
  size = 3,
): { start: number; end: number } {
  if (total <= size) return { start: 0, end: total };
  const start = Math.min(Math.max(0, active), total - size);
  return { start, end: start + size };
}

/** Restart the current section's timer without moving the agenda. */
export function restartSectionTimer(state: OverlayState, nowIso: string): OverlayState {
  return {
    ...state,
    sidebar: { ...state.sidebar, activeSectionStartedAt: nowIso },
  };
}
