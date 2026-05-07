import { DEFAULT_STATE, type OverlayState } from "./types";

const STORAGE_KEY = "vibe-overlay-state";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type OverlayColors = OverlayState["colors"];
type SidebarSection = OverlayState["sidebar"]["sections"][number];
type BottomBarSegment = OverlayState["bottomBar"]["segments"][number];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function boolOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function colorOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : fallback;
}

function normalizeBullets(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];

  const bullets = value.filter(
    (item): item is string => typeof item === "string",
  );
  return bullets.length > 0 ? bullets : [...fallback];
}

function normalizeSections(value: unknown): SidebarSection[] {
  const items = Array.isArray(value) ? value : [];
  const length = Math.max(items.length, DEFAULT_STATE.sidebar.sections.length);

  return Array.from({ length }, (_, index) => {
    const fallback =
      DEFAULT_STATE.sidebar.sections[index] ??
      DEFAULT_STATE.sidebar.sections[0];
    const source = record(items[index]);

    return {
      title: stringOrDefault(source?.title, fallback.title),
      bullets: normalizeBullets(source?.bullets, fallback.bullets),
    };
  });
}

function normalizeSegments(value: unknown): BottomBarSegment[] {
  const items = Array.isArray(value) ? value : [];
  const length = Math.max(
    items.length,
    DEFAULT_STATE.bottomBar.segments.length,
  );

  return Array.from({ length }, (_, index) => {
    const fallback =
      DEFAULT_STATE.bottomBar.segments[index] ??
      DEFAULT_STATE.bottomBar.segments[0];
    const source = record(items[index]);

    return {
      title: stringOrDefault(source?.title, fallback.title),
      text: stringOrDefault(source?.text, fallback.text),
    };
  });
}

function normalizeColors(value: unknown): OverlayColors {
  const source = record(value);

  return {
    bgDark: colorOrDefault(source?.bgDark, DEFAULT_STATE.colors.bgDark),
    bgPanel: colorOrDefault(source?.bgPanel, DEFAULT_STATE.colors.bgPanel),
    borderColor: colorOrDefault(
      source?.borderColor,
      DEFAULT_STATE.colors.borderColor,
    ),
    textColor: colorOrDefault(
      source?.textColor,
      DEFAULT_STATE.colors.textColor,
    ),
    mutedText: colorOrDefault(
      source?.mutedText,
      DEFAULT_STATE.colors.mutedText,
    ),
    cyanAccent: colorOrDefault(
      source?.cyanAccent,
      DEFAULT_STATE.colors.cyanAccent,
    ),
    pinkAccent: colorOrDefault(
      source?.pinkAccent,
      DEFAULT_STATE.colors.pinkAccent,
    ),
    warmAccent: colorOrDefault(
      source?.warmAccent,
      DEFAULT_STATE.colors.warmAccent,
    ),
  };
}

function browserStorage(): StorageLike | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function normalizeOverlayState(value: unknown): OverlayState {
  const source = record(value);
  const sidebar = record(source?.sidebar);
  const bottomBar = record(source?.bottomBar);
  const mainScreen = record(source?.mainScreen);
  const cover = record(source?.cover);

  return {
    sidebar: {
      visible: boolOrDefault(sidebar?.visible, DEFAULT_STATE.sidebar.visible),
      sections: normalizeSections(sidebar?.sections),
    },
    bottomBar: {
      visible: boolOrDefault(
        bottomBar?.visible,
        DEFAULT_STATE.bottomBar.visible,
      ),
      segments: normalizeSegments(bottomBar?.segments),
    },
    mainScreen: {
      visible: boolOrDefault(
        mainScreen?.visible,
        DEFAULT_STATE.mainScreen.visible,
      ),
    },
    cover: {
      title: stringOrDefault(cover?.title, DEFAULT_STATE.cover.title),
      badge1: stringOrDefault(cover?.badge1, DEFAULT_STATE.cover.badge1),
      badge2: stringOrDefault(cover?.badge2, DEFAULT_STATE.cover.badge2),
      manifestoLine1: stringOrDefault(
        cover?.manifestoLine1,
        DEFAULT_STATE.cover.manifestoLine1,
      ),
      manifestoLine2: stringOrDefault(
        cover?.manifestoLine2,
        DEFAULT_STATE.cover.manifestoLine2,
      ),
      manifestoLine3: stringOrDefault(
        cover?.manifestoLine3,
        DEFAULT_STATE.cover.manifestoLine3,
      ),
      closingPrefix: stringOrDefault(
        cover?.closingPrefix,
        DEFAULT_STATE.cover.closingPrefix,
      ),
      closingStruck: stringOrDefault(
        cover?.closingStruck,
        DEFAULT_STATE.cover.closingStruck,
      ),
      closingHighlight: stringOrDefault(
        cover?.closingHighlight,
        DEFAULT_STATE.cover.closingHighlight,
      ),
      closingSuffix: stringOrDefault(
        cover?.closingSuffix,
        DEFAULT_STATE.cover.closingSuffix,
      ),
    },
    colors: normalizeColors(source?.colors),
    activeTab: source?.activeTab === "cover" ? "cover" : "overlay",
  };
}

export function loadOverlayState(
  storage: StorageLike | null = browserStorage(),
): OverlayState {
  if (!storage) return normalizeOverlayState(DEFAULT_STATE);

  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw
      ? normalizeOverlayState(JSON.parse(raw))
      : normalizeOverlayState(DEFAULT_STATE);
  } catch {
    return normalizeOverlayState(DEFAULT_STATE);
  }
}

export function saveOverlayState(
  state: OverlayState,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeOverlayState(state)));
  } catch {
    // Ignore quota/private-mode failures; the editor can continue in memory.
  }
}
