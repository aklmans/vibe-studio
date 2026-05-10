import { DEFAULT_STATE, type OverlayState } from "./types";
import { type ThemeMode } from "./lib/theme";
import { BADGE_PRESETS, type BadgeConfig, type BadgeKind } from "./lib/badges";
import {
  isSocialKind,
  type SocialConfig,
  type SocialKind,
} from "./lib/socials";
import {
  isBottomBarKind,
  type BottomBarKind,
  type BottomBarSlot,
} from "./lib/bottomBar";
import { isWallpaperPresetId, type WallpaperPresetId } from "./lib/wallpaper";

const STORAGE_KEY = "vibe-overlay-state";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type OverlayColors = OverlayState["colors"];
type SidebarSection = OverlayState["sidebar"]["sections"][number];

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

function normalizeBoolGrid(
  value: unknown,
  fallback: boolean[][],
): boolean[][] {
  if (!Array.isArray(value)) return fallback.map((row) => [...row]);

  return fallback.map((defaultRow, rowIdx) => {
    const row = Array.isArray((value as unknown[])[rowIdx])
      ? ((value as unknown[])[rowIdx] as unknown[])
      : [];
    return defaultRow.map((defaultVal, colIdx) =>
      typeof row[colIdx] === "boolean" ? (row[colIdx] as boolean) : defaultVal,
    );
  });
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

function normalizeSegment(value: unknown, fallback: BottomBarSlot): BottomBarSlot {
  const source = record(value);
  if (!source) return { ...fallback } as BottomBarSlot;

  // Legacy v0 shape: { title: string, text: string }. Promote to a "text" slot.
  if (!source.kind && (typeof source.title === "string" || typeof source.text === "string")) {
    return {
      kind: "text",
      title: stringOrDefault(source.title, ""),
      text: stringOrDefault(source.text, ""),
    };
  }

  const kind: BottomBarKind = isBottomBarKind(source.kind)
    ? source.kind
    : fallback.kind;

  switch (kind) {
    case "live":
      return { kind: "live" };
    case "progress": {
      const max = DEFAULT_STATE.sidebar.sections.length;
      const raw = typeof source.sectionIndex === "number" ? Math.floor(source.sectionIndex) : 0;
      const clamped = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), Math.max(0, max - 1)) : 0;
      return { kind: "progress", sectionIndex: clamped };
    }
    case "stack":
      return { kind: "stack" };
    case "topic":
      return { kind: "topic" };
    case "text":
      return {
        kind: "text",
        title: stringOrDefault(source.title, ""),
        text: stringOrDefault(source.text, ""),
      };
  }
}

function normalizeSegments(value: unknown): BottomBarSlot[] {
  const items = Array.isArray(value) ? value : [];
  const length = Math.max(
    items.length,
    DEFAULT_STATE.bottomBar.segments.length,
  );

  return Array.from({ length }, (_, index) => {
    const fallback =
      DEFAULT_STATE.bottomBar.segments[index] ??
      DEFAULT_STATE.bottomBar.segments[0];
    return normalizeSegment(items[index], fallback);
  });
}

function normalizeStackItems(value: unknown): string[] {
  const fallback = DEFAULT_STATE.stack.items;
  if (!Array.isArray(value)) return [...fallback];
  const cleaned = value
    .map((entry) => (typeof entry === "string" ? entry : ""))
    .filter((entry) => entry.trim().length > 0);
  if (cleaned.length === 0) return [];
  return cleaned;
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
    subtleText: colorOrDefault(
      source?.subtleText,
      DEFAULT_STATE.colors.subtleText,
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

function normalizeActiveSection(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  const idx = Math.floor(value);
  if (idx < 0) return 0;
  if (idx >= max) return Math.max(0, max - 1);
  return idx;
}

function normalizeTheme(value: unknown): ThemeMode {
  return value === "editorial" ? "editorial" : "neon";
}

const BADGE_KIND_VALUES: BadgeKind[] = [
  "claude",
  "codex",
  "gemini",
  "grok",
  "custom",
];

function normalizeBadgeKind(value: unknown): BadgeKind {
  return BADGE_KIND_VALUES.includes(value as BadgeKind)
    ? (value as BadgeKind)
    : "claude";
}

function normalizeBadge(value: unknown, fallback: BadgeConfig): BadgeConfig {
  const source = record(value);
  if (!source) return { ...fallback };
  const kind = normalizeBadgeKind(source.kind);
  const presetLabel =
    kind === "custom" ? fallback.label : BADGE_PRESETS[kind].label;
  return {
    visible: boolOrDefault(source.visible, fallback.visible),
    kind,
    label: stringOrDefault(source.label, presetLabel),
    customIconUrl: stringOrDefault(source.customIconUrl, fallback.customIconUrl),
  };
}

function normalizeBadges(
  value: unknown,
  legacy: { badge1?: unknown; badge2?: unknown },
): BadgeConfig[] {
  const defaults = DEFAULT_STATE.cover.badges;

  if (Array.isArray(value)) {
    return defaults.map((fallback, i) => normalizeBadge(value[i], fallback));
  }

  // Legacy v0 -> v1 migration: { badge1: "Claude", badge2: "Codex" } strings
  // become the first two BadgeConfig entries.
  const legacyLabels = [legacy.badge1, legacy.badge2];
  return defaults.map((fallback, i) => {
    const legacyLabel = legacyLabels[i];
    if (typeof legacyLabel === "string" && legacyLabel.length > 0) {
      return { ...fallback, label: legacyLabel };
    }
    return { ...fallback };
  });
}

function normalizeSocialKind(value: unknown): SocialKind {
  return isSocialKind(value) ? value : "custom";
}

function normalizeSocial(
  value: unknown,
  fallback: SocialConfig,
): SocialConfig {
  const source = record(value);
  if (!source) return { ...fallback };
  const kind = normalizeSocialKind(source.kind);
  return {
    visible: boolOrDefault(source.visible, fallback.visible),
    kind,
    label: stringOrDefault(source.label, fallback.label),
    value: stringOrDefault(source.value, fallback.value),
    customColor: stringOrDefault(source.customColor, fallback.customColor),
  };
}

function normalizeSocials(
  value: unknown,
  legacy: {
    socialBilibili?: unknown;
    socialBlog?: unknown;
    socialGithub?: unknown;
    socialQQ?: unknown;
  },
): SocialConfig[] {
  const defaults = DEFAULT_STATE.cover.socials;

  if (Array.isArray(value)) {
    return defaults.map((fallback, i) => normalizeSocial(value[i], fallback));
  }

  // Legacy v0 -> v1 migration: four flat strings become the first four
  // SocialConfig entries (bilibili / blog / github / qq).
  const legacyValues: Record<SocialKind, string> = {
    bilibili: stringOrDefault(legacy.socialBilibili, ""),
    blog: stringOrDefault(legacy.socialBlog, ""),
    github: stringOrDefault(legacy.socialGithub, ""),
    qq: stringOrDefault(legacy.socialQQ, ""),
    x: "",
    youtube: "",
    wechat: "",
    custom: "",
  };

  return defaults.map((fallback) => ({
    ...fallback,
    value: legacyValues[fallback.kind] || fallback.value,
  }));
}

function normalizeWallpaperPresetId(value: unknown): WallpaperPresetId {
  return isWallpaperPresetId(value)
    ? value
    : DEFAULT_STATE.wallpaper.previewPresetId;
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
  const liveSession = record(source?.liveSession);
  const stack = record(source?.stack);
  const wallpaper = record(source?.wallpaper);

  return {
    sidebar: {
      visible: boolOrDefault(sidebar?.visible, DEFAULT_STATE.sidebar.visible),
      socialVisible: boolOrDefault(
        sidebar?.socialVisible,
        DEFAULT_STATE.sidebar.socialVisible,
      ),
      activeSection: normalizeActiveSection(
        sidebar?.activeSection,
        DEFAULT_STATE.sidebar.sections.length,
      ),
      sectionsDone: normalizeBoolGrid(
        sidebar?.sectionsDone,
        DEFAULT_STATE.sidebar.sectionsDone,
      ),
      sections: normalizeSections(sidebar?.sections),
    },
    bottomBar: {
      visible: boolOrDefault(
        bottomBar?.visible,
        DEFAULT_STATE.bottomBar.visible,
      ),
      segments: normalizeSegments(bottomBar?.segments),
    },
    liveSession: {
      startedAt: stringOrDefault(
        liveSession?.startedAt,
        DEFAULT_STATE.liveSession.startedAt,
      ),
    },
    stack: {
      items: normalizeStackItems(stack?.items),
    },
    mainScreen: {
      visible: boolOrDefault(
        mainScreen?.visible,
        DEFAULT_STATE.mainScreen.visible,
      ),
      cameraVisible: boolOrDefault(
        mainScreen?.cameraVisible,
        DEFAULT_STATE.mainScreen.cameraVisible,
      ),
    },
    cover: {
      title: stringOrDefault(cover?.title, DEFAULT_STATE.cover.title),
      badges: normalizeBadges(cover?.badges, {
        badge1: cover?.badge1,
        badge2: cover?.badge2,
      }),
      avatarUrl: stringOrDefault(
        cover?.avatarUrl,
        DEFAULT_STATE.cover.avatarUrl,
      ),
      avatarVisible: boolOrDefault(
        cover?.avatarVisible,
        DEFAULT_STATE.cover.avatarVisible,
      ),
      todayLabel: stringOrDefault(
        cover?.todayLabel,
        DEFAULT_STATE.cover.todayLabel,
      ),
      todayTopic: stringOrDefault(
        cover?.todayTopic,
        DEFAULT_STATE.cover.todayTopic,
      ),
      manifestoVisible: boolOrDefault(
        cover?.manifestoVisible,
        DEFAULT_STATE.cover.manifestoVisible,
      ),
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
      hookVisible: boolOrDefault(
        cover?.hookVisible,
        DEFAULT_STATE.cover.hookVisible,
      ),
      hookText: stringOrDefault(
        cover?.hookText,
        DEFAULT_STATE.cover.hookText,
      ),
      closingVisible: boolOrDefault(
        cover?.closingVisible,
        DEFAULT_STATE.cover.closingVisible,
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
      socialVisible: boolOrDefault(
        cover?.socialVisible,
        DEFAULT_STATE.cover.socialVisible,
      ),
      socials: normalizeSocials(cover?.socials, {
        socialBilibili: cover?.socialBilibili,
        socialBlog: cover?.socialBlog,
        socialGithub: cover?.socialGithub,
        socialQQ: cover?.socialQQ,
      }),
    },
    wallpaper: {
      previewPresetId: normalizeWallpaperPresetId(wallpaper?.previewPresetId),
      brandLabel: stringOrDefault(
        wallpaper?.brandLabel,
        DEFAULT_STATE.wallpaper.brandLabel,
      ),
      brandLabelVisible: boolOrDefault(
        wallpaper?.brandLabelVisible,
        DEFAULT_STATE.wallpaper.brandLabelVisible,
      ),
      slogan: stringOrDefault(
        wallpaper?.slogan,
        DEFAULT_STATE.wallpaper.slogan,
      ),
      sloganVisible: boolOrDefault(
        wallpaper?.sloganVisible,
        DEFAULT_STATE.wallpaper.sloganVisible,
      ),
      avatarVisible: boolOrDefault(
        wallpaper?.avatarVisible,
        DEFAULT_STATE.wallpaper.avatarVisible,
      ),
      badgesVisible: boolOrDefault(
        wallpaper?.badgesVisible,
        DEFAULT_STATE.wallpaper.badgesVisible,
      ),
      socialVisible: boolOrDefault(
        wallpaper?.socialVisible,
        DEFAULT_STATE.wallpaper.socialVisible,
      ),
    },
    colors: normalizeColors(source?.colors),
    theme: normalizeTheme(source?.theme),
    activeTab:
      source?.activeTab === "cover"
        ? "cover"
        : source?.activeTab === "poster"
          ? "poster"
          : source?.activeTab === "wallpaper"
            ? "wallpaper"
            : "overlay",
  };
}

export function loadOverlayState(
  storage: StorageLike | null = browserStorage(),
  defaultValue: OverlayState = DEFAULT_STATE,
): OverlayState {
  if (!storage) return normalizeOverlayState(defaultValue);

  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw
      ? normalizeOverlayState(JSON.parse(raw))
      : normalizeOverlayState(defaultValue);
  } catch {
    return normalizeOverlayState(defaultValue);
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
