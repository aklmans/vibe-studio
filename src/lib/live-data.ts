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
}

export interface LiveDataSnapshot {
  session: LiveSessionSummary;
  activeSection: number;
  sections: LiveSectionData[];
  bottomBar: {
    visible: boolean;
    segments: OverlayState["bottomBar"]["segments"];
  };
  stackItems: string[];
}

function sameSectionContent(a: LiveSectionData, b: LiveSectionData): boolean {
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
  // Repairs adjacent duplicate rows from persisted live-data snapshots without touching visual state.
  const { sections, indexMap } = normalizeSections(snapshot.sections);
  const sectionCount = sections.length;
  const activeSection = remapSectionIndex(snapshot.activeSection, indexMap, sectionCount);
  const normalizeProfileSegments = (list: BottomBarSlot[]): BottomBarSlot[] =>
    dedupeAdjacentByKey(
      list.map((segment) => normalizeSegment(segment, indexMap, sectionCount)),
      bottomBarSegmentKey,
    );

  return {
    ...snapshot,
    activeSection,
    sections,
    bottomBar: {
      ...snapshot.bottomBar,
      segments: {
        workbench: normalizeProfileSegments(snapshot.bottomBar.segments.workbench),
        lecture: normalizeProfileSegments(snapshot.bottomBar.segments.lecture),
        mobile: normalizeProfileSegments(snapshot.bottomBar.segments.mobile),
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
      }) &&
      bottomBar &&
      typeof bottomBar.visible === "boolean" &&
      isSegmentsByProfile(bottomBar.segments) &&
      Array.isArray(source.stackItems) &&
      source.stackItems.every((item) => typeof item === "string"),
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

export function overlayStateToLiveData(
  state: OverlayState,
  session: LiveSessionSummary,
): LiveDataSnapshot {
  return normalizeLiveDataSnapshot({
    session,
    activeSection: state.sidebar.activeSection,
    sections: state.sidebar.sections.map((section, sectionIndex) => ({
      title: section.title,
      ...(section.minutes !== undefined ? { minutes: section.minutes } : {}),
      tasks: section.bullets.map((text, taskIndex) => ({
        text,
        done: state.sidebar.sectionsDone[sectionIndex]?.[taskIndex] ?? false,
      })),
    })),
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

  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      activeSection: normalized.activeSection,
      sections: normalized.sections.map((section) => ({
        title: section.title,
        bullets: section.tasks.map((task) => task.text),
        ...(section.minutes !== undefined ? { minutes: section.minutes } : {}),
      })),
      sectionsDone: normalized.sections.map((section) =>
        section.tasks.map((task) => task.done),
      ),
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
