import type { AgendaState, OverlayState } from "../types";
import type { BottomBarSlot } from "./bottomBar";
import type { BarProfileId } from "./overlay-layout";
import { getLayout } from "./overlay-layout";

/*
 * Agendas are bound to the scene layout: each profile (workbench / lecture /
 * mobile) owns an independent AgendaState — sections, done flags, active index
 * and section timer. Every operation below reads and writes the ACTIVE
 * layout's agenda only, so a lecture's run of show never leaks into the
 * workbench sidebar and vice versa. The same profile key also selects the
 * bottom bar, so a bar's progress/agenda segments always point into their own
 * layout family's agenda.
 *
 * Driving the agenda = changing the active section as a broadcast action.
 * Every switch stamps activeSectionStartedAt so the on-air "time in section"
 * restarts — this is the one choke point all section switches go through.
 *
 * The structure operations (add / remove / move sections, add / remove
 * bullets) are the ONLY way the UI reshapes an agenda: each keeps the
 * done-flag shape, the active index, and the same profile's progress segments
 * consistent in one atomic state update.
 */

export const MAX_AGENDA_SECTIONS = 12;
export const MAX_SECTION_BULLETS = 6;

/** The agenda profile follows the active scene layout (same key as the bar). */
export function activeAgendaProfile(state: OverlayState): BarProfileId {
  return getLayout(state.layout).barProfile;
}

export function agendaFor(state: OverlayState, profile: BarProfileId): AgendaState {
  return state.sidebar.agendas[profile];
}

export function activeAgenda(state: OverlayState): AgendaState {
  return agendaFor(state, activeAgendaProfile(state));
}

export function withAgenda(
  state: OverlayState,
  profile: BarProfileId,
  agenda: AgendaState,
): OverlayState {
  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      agendas: { ...state.sidebar.agendas, [profile]: agenda },
    },
  };
}

export function withActiveAgenda(state: OverlayState, agenda: AgendaState): OverlayState {
  return withAgenda(state, activeAgendaProfile(state), agenda);
}

/** Remap the ACTIVE profile's progress segments after sections moved or
 *  vanished. Other profiles' bars index into their own agendas — untouched. */
function remapActiveProgressSegments(
  state: OverlayState,
  map: (index: number) => number,
): OverlayState["bottomBar"]["segments"] {
  const profile = activeAgendaProfile(state);
  const remapped: BottomBarSlot[] = state.bottomBar.segments[profile].map((slot) =>
    slot.kind === "progress" ? { ...slot, sectionIndex: map(slot.sectionIndex) } : slot,
  );
  return { ...state.bottomBar.segments, [profile]: remapped };
}

/**
 * Clamp ONE profile's bottom-bar progress segments into a section count
 * (min(index, count-1) — the same semantics removeSection's remap uses).
 * Every wholesale agenda replacement (copy across scenes, prepare-next-session)
 * must run this on the profiles whose agendas it replaced, so a pinned
 * progress segment can never dangle past the new last section.
 */
export function clampProfileProgressSegments(
  segments: OverlayState["bottomBar"]["segments"],
  profile: BarProfileId,
  sectionCount: number,
): OverlayState["bottomBar"]["segments"] {
  const max = Math.max(0, sectionCount - 1);
  const clamped: BottomBarSlot[] = segments[profile].map((slot) =>
    slot.kind === "progress" && slot.sectionIndex > max
      ? { ...slot, sectionIndex: max }
      : slot,
  );
  return { ...segments, [profile]: clamped };
}

/** Append a new agenda section (title only; bullets grow on demand). */
/**
 * Copy one scene profile's agenda (sections, bullets, planned minutes) onto
 * another, replacing the target wholesale. Progress is deliberately reset —
 * done flags, active index and the section timer belong to a live run, not to
 * copied content.
 */
export function copyAgendaToProfile(
  state: OverlayState,
  from: BarProfileId,
  to: BarProfileId,
): OverlayState {
  if (from === to) return state;
  const source = state.sidebar.agendas[from];
  const sections = source.sections.map((section) => ({
    title: section.title,
    bullets: [...section.bullets],
    ...(section.minutes !== undefined ? { minutes: section.minutes } : {}),
    ...(section.speaker !== undefined ? { speaker: section.speaker } : {}),
  }));
  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      agendas: {
        ...state.sidebar.agendas,
        [to]: {
          activeSection: 0,
          activeSectionStartedAt: "",
          sections,
          sectionsDone: sections.map((section) => section.bullets.map(() => false)),
          completed: sections.map(() => false),
        },
      },
    },
    bottomBar: {
      ...state.bottomBar,
      // The target's bar keeps its structure, but a progress segment pinned
      // past the copied agenda's last section would dangle — clamp it.
      segments: clampProfileProgressSegments(
        state.bottomBar.segments,
        to,
        sections.length,
      ),
    },
  };
}

export function addSection(state: OverlayState, title: string): OverlayState {
  const agenda = activeAgenda(state);
  if (agenda.sections.length >= MAX_AGENDA_SECTIONS) return state;
  return withActiveAgenda(state, {
    ...agenda,
    sections: [...agenda.sections, { title, bullets: [] }],
    sectionsDone: [...agenda.sectionsDone, []],
    completed: [...agenda.completed, false],
  });
}

/** Remove a section; the last one can never be removed. */
export function removeSection(state: OverlayState, index: number): OverlayState {
  const agenda = activeAgenda(state);
  const sections = agenda.sections;
  if (sections.length <= 1 || index < 0 || index >= sections.length) return state;

  const nextSections = sections.filter((_, i) => i !== index);
  const nextDone = agenda.sectionsDone.filter((_, i) => i !== index);
  const nextCompleted = agenda.completed.filter((_, i) => i !== index);
  const nextActive = Math.min(
    agenda.activeSection > index ? agenda.activeSection - 1 : agenda.activeSection,
    nextSections.length - 1,
  );

  return {
    ...withActiveAgenda(state, {
      ...agenda,
      sections: nextSections,
      sectionsDone: nextDone,
      completed: nextCompleted,
      activeSection: nextActive,
    }),
    bottomBar: {
      ...state.bottomBar,
      segments: remapActiveProgressSegments(state, (i) =>
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
  const agenda = activeAgenda(state);
  const sections = agenda.sections;
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
    ...withActiveAgenda(state, {
      ...agenda,
      sections: swap(sections),
      sectionsDone: swap(agenda.sectionsDone),
      completed: swap(agenda.completed),
      activeSection: mapIndex(agenda.activeSection),
    }),
    bottomBar: {
      ...state.bottomBar,
      segments: remapActiveProgressSegments(state, mapIndex),
    },
  };
}

/** Append an empty bullet to a section (grows its done-row too). */
export function addBullet(state: OverlayState, sectionIndex: number): OverlayState {
  const agenda = activeAgenda(state);
  const section = agenda.sections[sectionIndex];
  if (!section || section.bullets.length >= MAX_SECTION_BULLETS) return state;
  return withActiveAgenda(state, {
    ...agenda,
    sections: agenda.sections.map((s, i) =>
      i === sectionIndex ? { ...s, bullets: [...s.bullets, ""] } : s,
    ),
    sectionsDone: agenda.sectionsDone.map((row, i) =>
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
  const agenda = activeAgenda(state);
  const section = agenda.sections[sectionIndex];
  if (!section || bulletIndex < 0 || bulletIndex >= section.bullets.length) return state;
  return withActiveAgenda(state, {
    ...agenda,
    sections: agenda.sections.map((s, i) =>
      i === sectionIndex
        ? { ...s, bullets: s.bullets.filter((_, j) => j !== bulletIndex) }
        : s,
    ),
    sectionsDone: agenda.sectionsDone.map((row, i) =>
      i === sectionIndex ? row.filter((_, j) => j !== bulletIndex) : row,
    ),
  });
}

export function clampSectionIndex(state: OverlayState, index: number): number {
  const last = Math.max(0, activeAgenda(state).sections.length - 1);
  return Math.min(Math.max(0, Math.floor(index)), last);
}

export function driveAgendaTo(
  state: OverlayState,
  index: number,
  nowIso: string,
): OverlayState {
  const agenda = activeAgenda(state);
  const next = clampSectionIndex(state, index);
  if (next === agenda.activeSection && agenda.activeSectionStartedAt) {
    return state; // already there and already timed — no-op
  }
  return withActiveAgenda(state, {
    ...agenda,
    activeSection: next,
    activeSectionStartedAt: nowIso,
  });
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

/** Manually check a section off (or un-check it). This is the ONLY way a
 *  section reads as completed — driving the agenda forward never sets it. */
export function toggleSectionCompleted(state: OverlayState, index: number): OverlayState {
  const agenda = activeAgenda(state);
  if (index < 0 || index >= agenda.sections.length) return state;
  return withActiveAgenda(state, {
    ...agenda,
    completed: agenda.sections.map((_, i) =>
      i === index ? !agenda.completed[i] : agenda.completed[i] === true,
    ),
  });
}

/** Restart the current section's timer without moving the agenda. */
export function restartSectionTimer(state: OverlayState, nowIso: string): OverlayState {
  const agenda = activeAgenda(state);
  return withActiveAgenda(state, { ...agenda, activeSectionStartedAt: nowIso });
}
