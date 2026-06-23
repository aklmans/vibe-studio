// Asset palette presets and color/border token helpers shared across canvases.
//
// Two app appearances ship, both inside the same warm editorial design language:
//   - dark   — warm black surfaces, grey-white text, warm-orange accent marks
//   - light  — warm paper surfaces, near-black ink, warm-orange accent marks
//
// The app shell reads appearance tokens from design-tokens.ts. state.colors is
// the broadcast/export asset palette and may diverge when users override
// individual asset colors from Settings. The theme switch loads the matching
// app appearance and resets state.colors to the corresponding asset preset.
// Do not use theme to model an independent export palette; split out an
// assetPalette control if the app needs light UI with dark exported assets.
//
// Migration: the legacy "neon"/"editorial" modes were removed in Phase 1.5.
// Stored states are mapped on load — neon → dark, editorial → light (see
// migrateThemeMode + stateStorage.normalizeOverlayState). The mapping keeps the
// old default (neon was the dark-ish default) on dark, and routes the warmer
// editorial palette to the new paper/light theme.

export type ThemeMode = "light" | "dark";

export interface ColorTokens {
  bgDark: string;
  bgPanel: string;
  textColor: string;
  mutedText: string;
  subtleText: string;
  borderColor: string;
  cyanAccent: string;
  pinkAccent: string;
  warmAccent: string;
}

// Warm editorial dark: warm black background, warm grey panel, grey-white text.
// Accents are desaturated to warm/neutral marks — no blue-purple neon, no glow.
export const DARK_PRESET: ColorTokens = {
  bgDark: "#1a1a1a",
  bgPanel: "#221f1a",
  textColor: "#fafafa",
  mutedText: "#b8b8b8",
  subtleText: "#85827c",
  borderColor: "#4a463d",
  cyanAccent: "#9fb1a8",
  pinkAccent: "#e0815c",
  warmAccent: "#e8b97a",
};

// Warm editorial light: warm paper background (never harsh pure white),
// near-black ink, warm grey hairline, warm accent marks.
export const LIGHT_PRESET: ColorTokens = {
  bgDark: "#f7f4ee",
  bgPanel: "#eee8dd",
  textColor: "#1a1a1a",
  mutedText: "#55514b",
  subtleText: "#857f74",
  borderColor: "#c6c0b6",
  cyanAccent: "#6f8a84",
  pinkAccent: "#c95f3d",
  warmAccent: "#b07f33",
};

export const THEME_PRESETS: Record<ThemeMode, ColorTokens> = {
  dark: DARK_PRESET,
  light: LIGHT_PRESET,
};

export const DEFAULT_THEME: ThemeMode = "dark";

// Map any stored/legacy theme value to a current ThemeMode. Legacy "neon" maps
// to "dark" and "editorial" to "light"; anything unknown falls back to dark.
export function migrateThemeMode(value: unknown): ThemeMode {
  if (value === "light" || value === "dark") return value;
  if (value === "editorial") return "light";
  if (value === "neon") return "dark";
  return DEFAULT_THEME;
}

// True when the stored value used the removed neon/editorial theme system, so
// callers can snap stale neon/editorial colors onto the new warm preset.
export function isLegacyThemeMode(value: unknown): boolean {
  return value === "neon" || value === "editorial";
}

// 8-bit alpha suffixes appended to a #RRGGBB color to form #RRGGBBAA.
// Use these instead of inline alpha math so the visual weight of borders is
// consistent across all canvases.
export const borderAlpha = {
  strong: "4D",
  regular: "2E",
  hair: "1A",
} as const;

export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

export const borderStrong = (color: string): string =>
  withAlpha(color, borderAlpha.strong);
export const borderRegular = (color: string): string =>
  withAlpha(color, borderAlpha.regular);
export const borderHair = (color: string): string =>
  withAlpha(color, borderAlpha.hair);
