// Theme presets and color/border token helpers shared across all canvases.
//
// Two themes ship by default:
//   - neon       — current direct-stream palette (cool blue/cyan/pink/warm)
//   - editorial  — warm orange editorial palette used by the cover/poster
//
// Both presets share the same ColorTokens shape so any component can reference
// state.colors without caring which preset is active. Users can override any
// individual token from the editor; the theme switch just loads a preset.

export type ThemeMode = "editorial" | "neon";

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

export const NEON_PRESET: ColorTokens = {
  bgDark: "#10111D",
  bgPanel: "#191A2A",
  textColor: "#F4F7FF",
  mutedText: "#C7D2FE",
  subtleText: "#6B7CA8",
  borderColor: "#8DA8FF",
  cyanAccent: "#7DD3FC",
  pinkAccent: "#FF6FAE",
  warmAccent: "#FFB86B",
};

export const EDITORIAL_PRESET: ColorTokens = {
  bgDark: "#0B1020",
  bgPanel: "#111827",
  textColor: "#F5F5F2",
  mutedText: "#C7C9D1",
  subtleText: "#5A6178",
  borderColor: "#5A6178",
  cyanAccent: "#9CB3D9",
  pinkAccent: "#DA7756",
  warmAccent: "#E8B97A",
};

export const THEME_PRESETS: Record<ThemeMode, ColorTokens> = {
  neon: NEON_PRESET,
  editorial: EDITORIAL_PRESET,
};

export const DEFAULT_THEME: ThemeMode = "neon";

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
