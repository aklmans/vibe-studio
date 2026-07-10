// Bottom bar slot types. Each slot picks a "kind" that drives both the editor
// fields shown and the canvas renderer. Keeps the existing 3-segment width
// budget; lets each segment carry structured info instead of free-form text.

import type { Locale } from "./i18n";
import { dict } from "./i18n";
import type { LayoutId } from "./overlay-layout";

export type BottomBarKind =
  | "live"     // elapsed since liveSession.startedAt + start time
  | "progress" // section completion bar from sidebar.sectionsDone[sectionIndex]
  | "stack"    // chip list from state.stack.items
  | "topic"    // mirrors cover.todayTopic so newcomers see what's being built
  | "agenda"   // lecture lower-third: current section n/N + up next, from sidebar
  | "social"   // persistent attribution: the first visible social handle
  | "text";    // freeform title + text (legacy / escape hatch)

export interface LiveSlot {
  kind: "live";
}
export interface ProgressSlot {
  kind: "progress";
  sectionIndex: number;
}
export interface StackSlot {
  kind: "stack";
}
export interface TopicSlot {
  kind: "topic";
}
export interface AgendaSlot {
  kind: "agenda";
}
export interface SocialSlot {
  kind: "social";
  /** Which social to feature (index into cover.socials). Absent = the first
   *  visible one — so the slot works with zero configuration. */
  socialIndex?: number;
}
export interface TextSlot {
  kind: "text";
  title: string;
  text: string;
}

export type BottomBarSlot =
  | LiveSlot
  | ProgressSlot
  | StackSlot
  | TopicSlot
  | AgendaSlot
  | SocialSlot
  | TextSlot;

export const BOTTOM_BAR_KIND_VALUES: BottomBarKind[] = [
  "live",
  "progress",
  "stack",
  "topic",
  "agenda",
  "social",
  "text",
];

export function getBottomBarKindOptions(locale: Locale): { value: BottomBarKind; label: string }[] {
  const t = (key: string) => dict[locale][key as keyof typeof dict.zh] ?? key;
  return [
    { value: "live", label: t("bar.onAir") },
    { value: "progress", label: t("bar.progress") },
    { value: "stack", label: t("bar.stack") },
    { value: "topic", label: t("bar.topic") },
    { value: "agenda", label: t("bar.agenda") },
    { value: "social", label: t("bar.social") },
    { value: "text", label: t("bar.text") },
  ];
}

export function isBottomBarKind(value: unknown): value is BottomBarKind {
  return (
    typeof value === "string" &&
    (BOTTOM_BAR_KIND_VALUES as string[]).includes(value)
  );
}

export function defaultSlotForKind(kind: BottomBarKind, locale: Locale = "zh"): BottomBarSlot {
  switch (kind) {
    case "live":
      return { kind: "live" };
    case "progress":
      return { kind: "progress", sectionIndex: 0 };
    case "stack":
      return { kind: "stack" };
    case "topic":
      return { kind: "topic" };
    case "agenda":
      return { kind: "agenda" };
    case "social":
      return { kind: "social" };
    case "text":
      return { kind: "text", title: dict[locale]["segmentEditor.title"] ?? "Title", text: dict[locale]["segmentEditor.text"] ?? "Text" };
  }
}

// ─── Per-layout default segment sets ────────────────────────────────────────

/** The classic coding-stream triple (matches DEFAULT_STATE / the v1 apply). */
export const WORKBENCH_DEFAULT_SEGMENTS: BottomBarSlot[] = [
  { kind: "live" },
  { kind: "progress", sectionIndex: 0 },
  { kind: "stack" },
];

/** The lecture lower-third: liveness → agenda position → follow handle. */
export const LECTURE_DEFAULT_SEGMENTS: BottomBarSlot[] = [
  { kind: "live" },
  { kind: "agenda" },
  { kind: "social" },
];

function sameSegments(a: BottomBarSlot[], b: BottomBarSlot[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((slot, i) => {
    const other = b[i];
    if (slot.kind !== other.kind) return false;
    if (slot.kind === "progress" && other.kind === "progress") {
      return slot.sectionIndex === other.sectionIndex;
    }
    if (slot.kind === "text" && other.kind === "text") {
      return slot.title === other.title && slot.text === other.text;
    }
    if (slot.kind === "social" && other.kind === "social") {
      return slot.socialIndex === other.socialIndex;
    }
    return true;
  });
}

/**
 * When the scene layout changes, swap the bottom-bar segments to the target
 * layout's default set — but ONLY while they still exactly match a known
 * default. A hand-edited bar is the user's own and is never touched. Mobile has
 * no bottom bar, so switching to it changes nothing (and loses nothing).
 * Returns the replacement, or null when the segments should stay as they are.
 */
export function segmentsForLayoutSwitch(
  current: BottomBarSlot[],
  to: LayoutId,
): BottomBarSlot[] | null {
  if (to === "mobile") return null;
  const target =
    to === "lecture-left" || to === "lecture-right"
      ? LECTURE_DEFAULT_SEGMENTS
      : WORKBENCH_DEFAULT_SEGMENTS;
  if (sameSegments(current, target)) return null;
  const untouchedDefault =
    sameSegments(current, WORKBENCH_DEFAULT_SEGMENTS) ||
    sameSegments(current, LECTURE_DEFAULT_SEGMENTS);
  return untouchedDefault ? target.map((slot) => ({ ...slot })) : null;
}

// Format milliseconds as a stream-style clock. <1h shows "M:SS"; >=1h shows
// "H:MM:SS". Negative or zero returns "0:00".
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

// Format the start datetime as a short HH:mm label for the live slot footnote.
export function formatStartLabel(startedAt: string): string {
  if (!startedAt) return "";
  const d = new Date(startedAt);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
