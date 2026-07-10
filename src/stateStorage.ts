import { DEFAULT_STATE, type CoverVisual, type OverlayState } from "./types";
import {
  THEME_PRESETS,
  isLegacyThemeMode,
  migrateThemeMode,
  type ThemeMode,
} from "./lib/theme";
import { isLayoutId } from "./lib/overlay-layout";
import { OVERLAY_STATE_STORAGE_KEY } from "./lib/storage-keys";
import {
  LEGACY_BADGE_KIND_TO_ICON_KEY,
  badgeLabelForIconKey,
  isBadgeIconKey,
  isBadgeIconMode,
  isLegacyBadgeKind,
  type BadgeConfig,
  type BadgeIconKey,
} from "./lib/badges";
import {
  LEGACY_SOCIAL_KIND_TO_ICON_KEY,
  isSocialKind,
  type SocialConfig,
  type SocialKind,
} from "./lib/socials";
import {
  isBrandIconKey,
  isBrandIconMode,
  type BrandIconKey,
} from "./lib/brand-icons";
import {
  isBottomBarKind,
  type BottomBarKind,
  type BottomBarSlot,
} from "./lib/bottomBar";
import { isWallpaperPresetId, type WallpaperPresetId } from "./lib/wallpaper";
import { isAppTab } from "./lib/tabs";
import { normalizeStackItems } from "./lib/stack";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type OverlayColors = OverlayState["colors"];
type SidebarSection = OverlayState["sidebar"]["sections"][number];

const LEGACY_DEFAULT_COVER_AVATAR_URL = "/avatar.jpg";
const DEFAULT_BROADCAST_AVATAR_URL = "/avatar.png";

const LEGACY_THEME_PRESETS: Record<"neon" | "editorial", OverlayColors> = {
  neon: {
    bgDark: "#10111D",
    bgPanel: "#191A2A",
    textColor: "#F4F7FF",
    mutedText: "#C7D2FE",
    subtleText: "#6B7CA8",
    borderColor: "#8DA8FF",
    cyanAccent: "#7DD3FC",
    pinkAccent: "#FF6FAE",
    warmAccent: "#FFB86B",
  },
  editorial: {
    bgDark: "#0B1020",
    bgPanel: "#111827",
    textColor: "#F5F5F2",
    mutedText: "#C7C9D1",
    subtleText: "#5A6178",
    borderColor: "#5A6178",
    cyanAccent: "#9CB3D9",
    pinkAccent: "#DA7756",
    warmAccent: "#E8B97A",
  },
};

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

/** A free list of text lines. A non-array is garbage; an empty array is a choice. */
function normalizeTextLines(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  return value.filter((line): line is string => typeof line === "string");
}

function normalizeCoverAvatarUrl(value: unknown, fallback: string): string {
  const url = stringOrDefault(value, fallback);
  return url === LEGACY_DEFAULT_COVER_AVATAR_URL ? DEFAULT_BROADCAST_AVATAR_URL : url;
}

/**
 * Resolve the cover visual type. New states carry it explicitly; older states
 * are interpreted from the legacy "Show Avatar" toggle and the legacy built-in
 * avatar URL so nothing breaks:
 *  - avatarVisible === false  → "title" (pure typographic cover)
 *  - missing legacy URL      → "avatar" (the current default cover style)
 *  - legacy /avatar.jpg       → "avatar" (migrates to /avatar.png)
 *  - otherwise                → "scene"
 */
function normalizeCoverVisual(
  value: unknown,
  legacy: { avatarVisible: boolean; rawAvatarUrl: unknown },
): CoverVisual {
  if (value === "avatar" || value === "scene" || value === "title") {
    return value;
  }
  if (!legacy.avatarVisible) return "title";
  if (legacy.rawAvatarUrl == null) return "avatar";
  if (legacy.rawAvatarUrl === LEGACY_DEFAULT_COVER_AVATAR_URL) return "avatar";
  return "scene";
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

function normalizeSections(value: unknown, defaults: SidebarSection[]): SidebarSection[] {
  const items = Array.isArray(value) ? value : [];
  const length = Math.max(items.length, defaults.length);

  return Array.from({ length }, (_, index) => {
    const fallback = defaults[index] ?? defaults[0];
    const source = record(items[index]);

    const minutes =
      typeof source?.minutes === "number" &&
      Number.isFinite(source.minutes) &&
      Math.floor(source.minutes) >= 1 &&
      Math.floor(source.minutes) <= 999
        ? Math.floor(source.minutes)
        : undefined;
    return {
      title: stringOrDefault(source?.title, fallback.title),
      bullets: normalizeBullets(source?.bullets, fallback.bullets),
      ...(minutes !== undefined ? { minutes } : {}),
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
      return {
        kind: "progress",
        sectionIndex: typeof source.sectionIndex === "number" && Number.isFinite(Math.floor(source.sectionIndex))
          ? Math.max(0, Math.floor(source.sectionIndex))
          : (fallback.kind === "progress" ? (fallback as { kind: "progress"; sectionIndex: number }).sectionIndex : 0),
      };
    }
    case "stack":
      return { kind: "stack" };
    case "topic":
      return { kind: "topic" };
    case "agenda":
      return { kind: "agenda" };
    case "social": {
      const socialIndex =
        typeof source.socialIndex === "number" &&
        Number.isFinite(source.socialIndex) &&
        Math.floor(source.socialIndex) >= 0
          ? Math.floor(source.socialIndex)
          : undefined;
      return { kind: "social", ...(socialIndex !== undefined ? { socialIndex } : {}) };
    }
    case "text":
      return {
        kind: "text",
        title: stringOrDefault(source.title, (fallback as { kind: "text"; title: string }).title),
        text: stringOrDefault(source.text, (fallback as { kind: "text"; text: string }).text),
      };
  }
}

function normalizeSegments(value: unknown, defaults: BottomBarSlot[]): BottomBarSlot[] {
  const items = Array.isArray(value) ? value : [];
  const length = Math.max(items.length, defaults.length);

  return Array.from({ length }, (_, index) => {
    const fallback = defaults[index] ?? defaults[0];
    return normalizeSegment(items[index], fallback);
  });
}

function normalizeColors(value: unknown, defaults: OverlayColors): OverlayColors {
  const source = record(value);

  return {
    bgDark: colorOrDefault(source?.bgDark, defaults.bgDark),
    bgPanel: colorOrDefault(source?.bgPanel, defaults.bgPanel),
    borderColor: colorOrDefault(source?.borderColor, defaults.borderColor),
    textColor: colorOrDefault(source?.textColor, defaults.textColor),
    mutedText: colorOrDefault(source?.mutedText, defaults.mutedText),
    subtleText: colorOrDefault(source?.subtleText, defaults.subtleText),
    cyanAccent: colorOrDefault(source?.cyanAccent, defaults.cyanAccent),
    pinkAccent: colorOrDefault(source?.pinkAccent, defaults.pinkAccent),
    warmAccent: colorOrDefault(source?.warmAccent, defaults.warmAccent),
  };
}

function normalizeLegacyColors(
  value: unknown,
  legacyTheme: "neon" | "editorial",
): OverlayColors {
  const source = record(value);
  const nextTheme = migrateThemeMode(legacyTheme);
  const nextPreset = THEME_PRESETS[nextTheme];
  const oldPreset = LEGACY_THEME_PRESETS[legacyTheme];
  const normalized = normalizeColors(source, nextPreset);

  return (Object.keys(nextPreset) as Array<keyof OverlayColors>).reduce(
    (colors, key) => {
      const raw = source?.[key];
      colors[key] =
        typeof raw === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(raw) &&
        raw.toLowerCase() !== oldPreset[key].toLowerCase()
          ? normalized[key]
          : nextPreset[key];
      return colors;
    },
    { ...nextPreset },
  );
}

function normalizeActiveSection(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  const idx = Math.floor(value);
  if (idx < 0) return 0;
  if (idx >= max) return Math.max(0, max - 1);
  return idx;
}

function normalizeTheme(value: unknown, fallback: ThemeMode): ThemeMode {
  // Accept current values and migrate the legacy neon/editorial system
  // (neon → dark, editorial → light). Anything unknown keeps the caller's
  // default so partial/corrupt states stay conservative.
  if (
    value === "light" ||
    value === "dark" ||
    isLegacyThemeMode(value)
  ) {
    return migrateThemeMode(value);
  }
  return fallback;
}

function normalizeBadge(value: unknown, fallback: BadgeConfig): BadgeConfig {
  const source = record(value);
  if (!source) return { ...fallback };
  const iconKey: BadgeIconKey = isBadgeIconKey(source.iconKey)
    ? source.iconKey
    : isLegacyBadgeKind(source.kind)
      ? LEGACY_BADGE_KIND_TO_ICON_KEY[source.kind]
      : fallback.iconKey;
  const iconMode = isBadgeIconMode(source.iconMode)
    ? source.iconMode
    : fallback.iconMode;
  const fallbackLabel = badgeLabelForIconKey(iconKey, fallback.label);

  return {
    visible: boolOrDefault(source.visible, fallback.visible),
    iconKey,
    iconMode,
    label: stringOrDefault(source.label, fallbackLabel),
    customIconUrl: stringOrDefault(source.customIconUrl, fallback.customIconUrl),
  };
}

function normalizeBadges(
  value: unknown,
  defaults: BadgeConfig[],
  legacy: { badge1?: unknown; badge2?: unknown },
): BadgeConfig[] {
  if (Array.isArray(value)) {
    return value.map((item, i) =>
      normalizeBadge(item, defaults[i] ?? defaults[defaults.length - 1]),
    );
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

function iconKeyFromLegacySocialKind(kind: SocialKind): BrandIconKey | undefined {
  return kind === "custom" ? undefined : LEGACY_SOCIAL_KIND_TO_ICON_KEY[kind];
}

function normalizeSocialIconKey(
  source: Record<string, unknown>,
  fallback: SocialConfig,
): BrandIconKey | undefined {
  if ("iconKey" in source) {
    return isBrandIconKey(source.iconKey) ? source.iconKey : undefined;
  }

  if (isSocialKind(source.kind)) {
    return iconKeyFromLegacySocialKind(source.kind);
  }

  return fallback.iconKey;
}

function normalizeSocial(
  value: unknown,
  fallback: SocialConfig,
): SocialConfig {
  const source = record(value);
  if (!source) return { ...fallback };
  const iconKey = normalizeSocialIconKey(source, fallback);
  const iconMode = isBrandIconMode(source.iconMode)
    ? source.iconMode
    : fallback.iconMode;

  return {
    visible: boolOrDefault(source.visible, fallback.visible),
    iconKey,
    iconMode,
    label: stringOrDefault(source.label, fallback.label),
    value: stringOrDefault(source.value, fallback.value),
    customColor: stringOrDefault(source.customColor, fallback.customColor),
  };
}

function normalizeSocials(
  value: unknown,
  defaults: SocialConfig[],
  legacy: {
    socialBilibili?: unknown;
    socialBlog?: unknown;
    socialGithub?: unknown;
    socialQQ?: unknown;
  },
): SocialConfig[] {
  if (Array.isArray(value)) {
    return value.map((item, i) =>
      normalizeSocial(item, defaults[i] ?? defaults[defaults.length - 1]),
    );
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
    discord: "",
    wechat: "",
    custom: "",
  };

  return defaults.map((fallback) => {
    const legacyKind = (Object.keys(LEGACY_SOCIAL_KIND_TO_ICON_KEY) as Array<Exclude<SocialKind, "custom">>).find(
      (kind) => LEGACY_SOCIAL_KIND_TO_ICON_KEY[kind] === fallback.iconKey,
    );
    return {
      ...fallback,
      value: legacyKind ? legacyValues[legacyKind] || fallback.value : fallback.value,
    };
  });
}

function normalizeWallpaperPresetId(value: unknown, fallback: WallpaperPresetId = DEFAULT_STATE.wallpaper.previewPresetId): WallpaperPresetId {
  return isWallpaperPresetId(value)
    ? value
    : fallback;
}

function browserStorage(): StorageLike | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function normalizeOverlayState(value: unknown, defaultValue: OverlayState = DEFAULT_STATE): OverlayState {
  const source = record(value);
  const sidebar = record(source?.sidebar);
  const bottomBar = record(source?.bottomBar);
  const mainScreen = record(source?.mainScreen);
  const brand = record(source?.brand);
  const cover = record(source?.cover);
  const liveSession = record(source?.liveSession);
  const stack = record(source?.stack);
  const wallpaper = record(source?.wallpaper);
  const activeTab = source?.activeTab;

  return {
    sidebar: {
      visible: boolOrDefault(sidebar?.visible, defaultValue.sidebar.visible),
      socialVisible: boolOrDefault(
        sidebar?.socialVisible,
        defaultValue.sidebar.socialVisible,
      ),
      activeSection: normalizeActiveSection(
        sidebar?.activeSection,
        defaultValue.sidebar.sections.length,
      ),
      sectionsDone: normalizeBoolGrid(
        sidebar?.sectionsDone,
        defaultValue.sidebar.sectionsDone,
      ),
      sections: normalizeSections(sidebar?.sections, defaultValue.sidebar.sections),
      activeSectionStartedAt: stringOrDefault(
        sidebar?.activeSectionStartedAt,
        defaultValue.sidebar.activeSectionStartedAt,
      ),
    },
    bottomBar: {
      visible: boolOrDefault(
        bottomBar?.visible,
        defaultValue.bottomBar.visible,
      ),
      segments: normalizeSegments(bottomBar?.segments, defaultValue.bottomBar.segments),
    },
    liveSession: {
      startedAt: stringOrDefault(
        liveSession?.startedAt,
        defaultValue.liveSession.startedAt,
      ),
    },
    stack: {
      items: normalizeStackItems(stack?.items, defaultValue.stack.items),
    },
    mainScreen: {
      visible: boolOrDefault(
        mainScreen?.visible,
        defaultValue.mainScreen.visible,
      ),
      cameraVisible: boolOrDefault(
        mainScreen?.cameraVisible,
        defaultValue.mainScreen.cameraVisible,
      ),
    },
    // Added with the lecture layouts; state saved before then has no `brand`.
    brand: {
      logoUrl: stringOrDefault(brand?.logoUrl, defaultValue.brand.logoUrl),
      seriesName: stringOrDefault(brand?.seriesName, defaultValue.brand.seriesName),
      presenterLines: normalizeTextLines(
        brand?.presenterLines,
        defaultValue.brand.presenterLines,
      ),
    },
    cover: {
      title: stringOrDefault(cover?.title, defaultValue.cover.title),
      badges: normalizeBadges(cover?.badges, defaultValue.cover.badges, {
        badge1: cover?.badge1,
        badge2: cover?.badge2,
      }),
      avatarUrl: normalizeCoverAvatarUrl(
        cover?.avatarUrl,
        defaultValue.cover.avatarUrl,
      ),
      avatarVisible: boolOrDefault(
        cover?.avatarVisible,
        defaultValue.cover.avatarVisible,
      ),
      visual: normalizeCoverVisual(cover?.visual, {
        avatarVisible: boolOrDefault(
          cover?.avatarVisible,
          defaultValue.cover.avatarVisible,
        ),
        rawAvatarUrl: cover?.avatarUrl,
      }),
      // Cover scene image: inherit an old custom shared subject so a
      // previously customized scene keeps showing; legacy /avatar.jpg users
      // land on the avatar type instead.
      sceneUrl: stringOrDefault(
        cover?.sceneUrl,
        normalizeCoverAvatarUrl(cover?.avatarUrl, defaultValue.cover.sceneUrl),
      ),
      portraitUrl: stringOrDefault(
        cover?.portraitUrl,
        defaultValue.cover.portraitUrl,
      ),
      todayLabel: stringOrDefault(
        cover?.todayLabel,
        defaultValue.cover.todayLabel,
      ),
      todayTopic: stringOrDefault(
        cover?.todayTopic,
        defaultValue.cover.todayTopic,
      ),
      manifestoVisible: boolOrDefault(
        cover?.manifestoVisible,
        defaultValue.cover.manifestoVisible,
      ),
      manifestoLine1: stringOrDefault(
        cover?.manifestoLine1,
        defaultValue.cover.manifestoLine1,
      ),
      manifestoLine2: stringOrDefault(
        cover?.manifestoLine2,
        defaultValue.cover.manifestoLine2,
      ),
      manifestoLine3: stringOrDefault(
        cover?.manifestoLine3,
        defaultValue.cover.manifestoLine3,
      ),
      hookVisible: boolOrDefault(
        cover?.hookVisible,
        defaultValue.cover.hookVisible,
      ),
      hookText: stringOrDefault(
        cover?.hookText,
        defaultValue.cover.hookText,
      ),
      closingVisible: boolOrDefault(
        cover?.closingVisible,
        defaultValue.cover.closingVisible,
      ),
      closingPrefix: stringOrDefault(
        cover?.closingPrefix,
        defaultValue.cover.closingPrefix,
      ),
      closingStruck: stringOrDefault(
        cover?.closingStruck,
        defaultValue.cover.closingStruck,
      ),
      closingHighlight: stringOrDefault(
        cover?.closingHighlight,
        defaultValue.cover.closingHighlight,
      ),
      closingSuffix: stringOrDefault(
        cover?.closingSuffix,
        defaultValue.cover.closingSuffix,
      ),
      socialVisible: boolOrDefault(
        cover?.socialVisible,
        defaultValue.cover.socialVisible,
      ),
      socials: normalizeSocials(cover?.socials, defaultValue.cover.socials, {
        socialBilibili: cover?.socialBilibili,
        socialBlog: cover?.socialBlog,
        socialGithub: cover?.socialGithub,
        socialQQ: cover?.socialQQ,
      }),
    },
    wallpaper: {
      previewPresetId: normalizeWallpaperPresetId(wallpaper?.previewPresetId, defaultValue.wallpaper.previewPresetId),
      brandLabel: stringOrDefault(
        wallpaper?.brandLabel,
        defaultValue.wallpaper.brandLabel,
      ),
      brandLabelVisible: boolOrDefault(
        wallpaper?.brandLabelVisible,
        defaultValue.wallpaper.brandLabelVisible,
      ),
      slogan: stringOrDefault(
        wallpaper?.slogan,
        defaultValue.wallpaper.slogan,
      ),
      sloganVisible: boolOrDefault(
        wallpaper?.sloganVisible,
        defaultValue.wallpaper.sloganVisible,
      ),
      avatarVisible: boolOrDefault(
        wallpaper?.avatarVisible,
        defaultValue.wallpaper.avatarVisible,
      ),
      badgesVisible: boolOrDefault(
        wallpaper?.badgesVisible,
        defaultValue.wallpaper.badgesVisible,
      ),
      socialVisible: boolOrDefault(
        wallpaper?.socialVisible,
        defaultValue.wallpaper.socialVisible,
      ),
    },
    // States saved under the removed neon/editorial system adopt the matching
    // warm preset for untouched legacy values, while preserving explicit custom
    // colors that differ from the old defaults. States already on light/dark
    // keep any per-key custom colors.
    colors:
      source?.theme === "neon" || source?.theme === "editorial"
        ? normalizeLegacyColors(source?.colors, source.theme)
        : normalizeColors(source?.colors, defaultValue.colors),
    theme: normalizeTheme(source?.theme, defaultValue.theme),
    layout: isLayoutId(source?.layout) ? source.layout : defaultValue.layout,
    activeTab: isAppTab(activeTab) ? activeTab : "overlay",
  };
}

export function loadOverlayState(
  storage: StorageLike | null = browserStorage(),
  defaultValue: OverlayState = DEFAULT_STATE,
): OverlayState {
  if (!storage) return normalizeOverlayState(defaultValue);

  try {
    const raw = storage.getItem(OVERLAY_STATE_STORAGE_KEY);
    return raw
      ? normalizeOverlayState(JSON.parse(raw), defaultValue)
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
    storage.setItem(
      OVERLAY_STATE_STORAGE_KEY,
      JSON.stringify(normalizeOverlayState(state, state)),
    );
  } catch {
    // Ignore quota/private-mode failures; the editor can continue in memory.
  }
}
