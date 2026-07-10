// Bottom bar slot types. Each slot picks a "kind" that drives both the editor
// fields shown and the canvas renderer. Keeps the existing 3-segment width
// budget; lets each segment carry structured info instead of free-form text.

import type { OverlayState } from "../types";
import type { Locale } from "./i18n";
import { dict } from "./i18n";
import { getLayout, type BarProfileId } from "./overlay-layout";

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

// ─── Per-profile bottom bars ────────────────────────────────────────────────
//
// Each bar profile owns its own segment list: the workbench triple, the lecture
// lower-third, and the mobile strip are independent data sets. Switching the
// scene layout switches WHICH set renders and edits — it never rewrites one.

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

/** The portrait strip — same lower-third logic as the lecture. */
export const MOBILE_DEFAULT_SEGMENTS: BottomBarSlot[] = [
  { kind: "live" },
  { kind: "agenda" },
  { kind: "social" },
];

/** Fresh per-profile defaults (new copies — safe to hand to state). */
export function defaultBarSegments(): Record<BarProfileId, BottomBarSlot[]> {
  return {
    workbench: WORKBENCH_DEFAULT_SEGMENTS.map((slot) => ({ ...slot })),
    lecture: LECTURE_DEFAULT_SEGMENTS.map((slot) => ({ ...slot })),
    mobile: MOBILE_DEFAULT_SEGMENTS.map((slot) => ({ ...slot })),
  };
}

/** The bar profile the active scene layout reads and edits. */
export function activeBarProfile(state: OverlayState): BarProfileId {
  return getLayout(state.layout).barProfile;
}

export function activeBarSegments(state: OverlayState): BottomBarSlot[] {
  return state.bottomBar.segments[activeBarProfile(state)];
}

/** Replace the ACTIVE profile's segments; the other profiles stay untouched. */
export function withActiveBarSegments(
  state: OverlayState,
  segments: BottomBarSlot[],
): OverlayState {
  return {
    ...state,
    bottomBar: {
      ...state.bottomBar,
      segments: { ...state.bottomBar.segments, [activeBarProfile(state)]: segments },
    },
  };
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
