import type { OverlayState } from "../types";
import { normalizeStackItems, stackItemsToLabels } from "./stack";
import { isBottomBarKind } from "./bottomBar";
import type { BottomBarSlot } from "./bottomBar";
import type { Locale } from "./i18n";
import type { BarProfileId } from "./overlay-layout";

/** Deep-copy a per-profile segments record. */
function copySegmentsByProfile(
  segments: Record<BarProfileId, BottomBarSlot[]>,
): Record<BarProfileId, BottomBarSlot[]> {
  return {
    workbench: segments.workbench.map((segment) => ({ ...segment })),
    lecture: segments.lecture.map((segment) => ({ ...segment })),
    mobile: segments.mobile.map((segment) => ({ ...segment })),
  };
}

export type LiveSessionStatus = "draft" | "live" | "ended";

export interface LiveSessionSummary {
  id: string;
  dateKey: string;
  locale: Locale;
  title: string;
  status: LiveSessionStatus;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiveTaskData {
  text: string;
  done: boolean;
}

export interface LiveSectionData {
  title: string;
  tasks: LiveTaskData[];
  /** Planned duration in minutes (agenda timing). */
  minutes?: number;
  /** Manual per-section completion (checked off by the host). */
  done?: boolean;
}

/** One scene profile's persisted agenda: its sections and active index. */
export interface LiveAgendaData {
  activeSection: number;
  sections: LiveSectionData[];
}

export interface LiveDataSnapshot {
  session: LiveSessionSummary;
  /** Independent agendas per scene profile, mirroring OverlayState.sidebar. */
  agendas: Record<BarProfileId, LiveAgendaData>;
  bottomBar: {
    visible: boolean;
    segments: OverlayState["bottomBar"]["segments"];
  };
  stackItems: string[];
}

function sameSectionContent(a: LiveSectionData, b: LiveSectionData): boolean {
  // `done` is progress, not content — duplicates still fold (done merges OR-wise).
  return (
    a.title === b.title &&
    a.minutes === b.minutes &&
    a.tasks.length === b.tasks.length &&
    a.tasks.every((task, index) => task.text === b.tasks[index]?.text)
  );
}

function mergeSectionData(a: LiveSectionData, b: LiveSectionData): LiveSectionData {
  return {
    title: a.title,
    ...(a.minutes !== undefined ? { minutes: a.minutes } : {}),
    ...(a.done || b.done ? { done: true } : {}),
    tasks: a.tasks.map((task, index) => ({
      text: task.text,
      done: task.done || b.tasks[index]?.done === true,
    })),
  };
}

function normalizeSections(sections: LiveSectionData[]): {
  sections: LiveSectionData[];
  indexMap: number[];
} {
  const normalized: LiveSectionData[] = [];
  const indexMap: number[] = [];

  for (const section of sections) {
    const previous = normalized[normalized.length - 1];
    if (previous && sameSectionContent(previous, section)) {
      const previousIndex = normalized.length - 1;
      normalized[previousIndex] = mergeSectionData(previous, section);
      indexMap.push(previousIndex);
      continue;
    }

    normalized.push({
      title: section.title,
      ...(section.minutes !== undefined ? { minutes: section.minutes } : {}),
      ...(section.done ? { done: true } : {}),
      tasks: section.tasks.map((task) => ({ ...task })),
    });
    indexMap.push(normalized.length - 1);
  }

  return { sections: normalized, indexMap };
}

function remapSectionIndex(
  sectionIndex: number,
  indexMap: number[],
  sectionCount: number,
): number {
  if (sectionCount <= 0) return 0;
  const mapped = indexMap[sectionIndex];
  if (typeof mapped === "number") return Math.min(Math.max(mapped, 0), sectionCount - 1);
  return Math.min(Math.max(sectionIndex, 0), sectionCount - 1);
}

function normalizeSegment(
  segment: BottomBarSlot,
  indexMap: number[],
  sectionCount: number,
): BottomBarSlot {
  return segment.kind === "progress"
    ? {
        kind: "progress",
        sectionIndex: remapSectionIndex(segment.sectionIndex, indexMap, sectionCount),
      }
    : { ...segment };
}

function bottomBarSegmentKey(segment: BottomBarSlot): string {
  return JSON.stringify(segment);
}

function dedupeAdjacentByKey<T>(items: T[], keyForItem: (item: T) => string): T[] {
  const normalized: T[] = [];
  let previousKey = "";

  for (const item of items) {
    const key = keyForItem(item);
    if (normalized.length > 0 && key === previousKey) continue;
    normalized.push(item);
    previousKey = key;
  }

  return normalized;
}

export function normalizeLiveDataSnapshot(snapshot: LiveDataSnapshot): LiveDataSnapshot {
  // Repairs adjacent duplicate rows from persisted live-data snapshots without
  // touching visual state. Each profile's agenda normalizes independently, and
  // a bar profile's progress segments remap against ITS OWN agenda's indexMap
  // (bar and agenda share the scene profile key).
  const normalizedAgendas = {} as Record<BarProfileId, LiveAgendaData>;
  const indexMaps = {} as Record<BarProfileId, { indexMap: number[]; count: number }>;
  for (const profile of ["workbench", "lecture", "mobile"] as const) {
    const agenda = snapshot.agendas[profile];
    const { sections, indexMap } = normalizeSections(agenda.sections);
    normalizedAgendas[profile] = {
      sections,
      activeSection: remapSectionIndex(agenda.activeSection, indexMap, sections.length),
    };
    indexMaps[profile] = { indexMap, count: sections.length };
  }

  const normalizeProfileSegments = (
    list: BottomBarSlot[],
    profile: BarProfileId,
  ): BottomBarSlot[] =>
    dedupeAdjacentByKey(
      list.map((segment) =>
        normalizeSegment(segment, indexMaps[profile].indexMap, indexMaps[profile].count),
      ),
      bottomBarSegmentKey,
    );

  return {
    ...snapshot,
    agendas: normalizedAgendas,
    bottomBar: {
      ...snapshot.bottomBar,
      segments: {
        workbench: normalizeProfileSegments(snapshot.bottomBar.segments.workbench, "workbench"),
        lecture: normalizeProfileSegments(snapshot.bottomBar.segments.lecture, "lecture"),
        mobile: normalizeProfileSegments(snapshot.bottomBar.segments.mobile, "mobile"),
      },
    },
    stackItems: dedupeAdjacentByKey(snapshot.stackItems, (item) => item),
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

function isStatus(value: unknown): value is LiveSessionStatus {
  return value === "draft" || value === "live" || value === "ended";
}

function isBottomBarSlot(value: unknown): value is BottomBarSlot {
  const source = record(value);
  if (!source || !isBottomBarKind(source.kind)) return false;

  switch (source.kind) {
    case "live":
    case "stack":
    case "topic":
    case "agenda":
      return true;
    case "social":
      return source.socialIndex === undefined || typeof source.socialIndex === "number";
    case "progress":
      return typeof source.sectionIndex === "number";
    case "text":
      return typeof source.title === "string" && typeof source.text === "string";
  }
}

export function isLiveDataSnapshot(value: unknown): value is LiveDataSnapshot {
  const source = record(value);
  const session = record(source?.session);
  const bottomBar = record(source?.bottomBar);

  return Boolean(
    source &&
      session &&
      typeof session.id === "string" &&
      typeof session.dateKey === "string" &&
      isLocale(session.locale) &&
      typeof session.title === "string" &&
      isStatus(session.status) &&
      typeof session.startedAt === "string" &&
      (typeof session.endedAt === "string" || session.endedAt === null) &&
      typeof session.createdAt === "string" &&
      typeof session.updatedAt === "string" &&
      isAgendasByProfile(source.agendas) &&
      bottomBar &&
      typeof bottomBar.visible === "boolean" &&
      isSegmentsByProfile(bottomBar.segments) &&
      Array.isArray(source.stackItems) &&
      source.stackItems.every((item) => typeof item === "string"),
  );
}

function isLiveAgendaData(value: unknown): boolean {
  const source = record(value);
  return Boolean(
    source &&
      typeof source.activeSection === "number" &&
      Array.isArray(source.sections) &&
      source.sections.every((section) => {
        const sectionSource = record(section);
        return (
          sectionSource &&
          typeof sectionSource.title === "string" &&
          Array.isArray(sectionSource.tasks) &&
          sectionSource.tasks.every((task) => {
            const taskSource = record(task);
            return (
              taskSource &&
              typeof taskSource.text === "string" &&
              typeof taskSource.done === "boolean"
            );
          })
        );
      }),
  );
}

function isAgendasByProfile(value: unknown): boolean {
  const source = record(value);
  if (!source) return false;
  return (["workbench", "lecture", "mobile"] as const).every((profile) =>
    isLiveAgendaData(source[profile]),
  );
}

function isSegmentsByProfile(
  value: unknown,
): value is Record<BarProfileId, BottomBarSlot[]> {
  const source = record(value);
  if (!source) return false;
  return (["workbench", "lecture", "mobile"] as const).every(
    (profile) =>
      Array.isArray(source[profile]) &&
      (source[profile] as unknown[]).every(isBottomBarSlot),
  );
}

function agendaToLiveData(agenda: OverlayState["sidebar"]["agendas"][BarProfileId]): LiveAgendaData {
  return {
    activeSection: agenda.activeSection,
    sections: agenda.sections.map((section, sectionIndex) => ({
      title: section.title,
      ...(section.minutes !== undefined ? { minutes: section.minutes } : {}),
      ...(agenda.completed[sectionIndex] ? { done: true } : {}),
      tasks: section.bullets.map((text, taskIndex) => ({
        text,
        done: agenda.sectionsDone[sectionIndex]?.[taskIndex] ?? false,
      })),
    })),
  };
}

export function overlayStateToLiveData(
  state: OverlayState,
  session: LiveSessionSummary,
): LiveDataSnapshot {
  return normalizeLiveDataSnapshot({
    session,
    agendas: {
      workbench: agendaToLiveData(state.sidebar.agendas.workbench),
      lecture: agendaToLiveData(state.sidebar.agendas.lecture),
      mobile: agendaToLiveData(state.sidebar.agendas.mobile),
    },
    bottomBar: {
      visible: state.bottomBar.visible,
      segments: copySegmentsByProfile(state.bottomBar.segments),
    },
    stackItems: stackItemsToLabels(state.stack.items),
  });
}

export function applyLiveDataToOverlayState(
  state: OverlayState,
  liveData: LiveDataSnapshot,
): OverlayState {
  const normalized = normalizeLiveDataSnapshot(liveData);

  const liveDataToAgenda = (
    data: LiveAgendaData,
    previous: OverlayState["sidebar"]["agendas"][BarProfileId],
  ): OverlayState["sidebar"]["agendas"][BarProfileId] => ({
    activeSection: data.activeSection,
    // The section timer is runtime-local, not persisted — keep the running one.
    activeSectionStartedAt: previous.activeSectionStartedAt,
    sections: data.sections.map((section) => ({
      title: section.title,
      bullets: section.tasks.map((task) => task.text),
      ...(section.minutes !== undefined ? { minutes: section.minutes } : {}),
    })),
    sectionsDone: data.sections.map((section) => section.tasks.map((task) => task.done)),
    completed: data.sections.map((section) => section.done === true),
  });

  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      agendas: {
        workbench: liveDataToAgenda(normalized.agendas.workbench, state.sidebar.agendas.workbench),
        lecture: liveDataToAgenda(normalized.agendas.lecture, state.sidebar.agendas.lecture),
        mobile: liveDataToAgenda(normalized.agendas.mobile, state.sidebar.agendas.mobile),
      },
    },
    bottomBar: {
      ...state.bottomBar,
      visible: normalized.bottomBar.visible,
      segments: copySegmentsByProfile(normalized.bottomBar.segments),
    },
    liveSession: {
      ...state.liveSession,
      startedAt: normalized.session.startedAt,
    },
    stack: {
      ...state.stack,
      items: normalizeStackItems(normalized.stackItems, state.stack.items),
    },
  };
}
