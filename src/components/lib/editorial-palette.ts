import type { ColorTokens } from "../../lib/theme";

// Warm editorial palette derived from the active theme tokens (state.colors).
// Single source of truth for broadcast-asset surfaces, lines, and accent marks
// so Overlay / Cover / Poster / Wallpaper read as one system in both Light and
// Dark. The accent is a *mark*, never a large fill; lines are warm hairlines,
// never white-alpha (which disappears on the Light paper surface).
//
// This adapter also gives the three legacy persisted accent fields warm,
// intent-revealing names. The persisted `OverlayState.colors` shape is kept
// as-is for backward compatibility (`cyanAccent` / `pinkAccent` / `warmAccent`),
// but render code should reach for the *Mark tokens below — not the old
// neon-era field names directly.
export interface EditorialPalette {
  bg1: string; // base background
  bg2: string; // elevated surface
  bg3: string; // deepest layer (subtle separation)
  text: string;
  muted: string;
  subtle: string;
  accent: string; // warm accent — used only as a small mark (=== primaryMark)
  accentSoft: string; // accent at low alpha for tints / fills
  lineStrong: string; // outer frame / major panel boundary
  line: string; // section rule / stable divider
  lineSoft: string; // inner hairline / low-emphasis aid
  activeRule: string; // current-state mark, never a large fill (=== primaryMark)
  hairline: string; // thin warm divider
  rule: string; // slightly stronger rule / border
  glassBorder: string; // legacy alias === rule (kept for existing callers)

  // ── Semantic accent marks (wrap the persisted accent fields) ─────────────
  primaryMark: string; // warm primary accent — active / current / Follow Me
  supportMark: string; // low-chroma support accent (sidebar section 1)
  amberMark: string; // warm amber accent (section 3, warm chips)
}

export function editorialPalette(colors: ColorTokens): EditorialPalette {
  return {
    bg1: colors.bgDark,
    bg2: colors.bgPanel,
    bg3: colors.bgDark,
    text: colors.textColor,
    muted: colors.mutedText,
    subtle: colors.subtleText,
    accent: colors.pinkAccent,
    accentSoft: `${colors.pinkAccent}1f`,
    lineStrong: `${colors.borderColor}8f`,
    line: `${colors.borderColor}66`,
    lineSoft: `${colors.borderColor}33`,
    activeRule: colors.pinkAccent,
    hairline: `${colors.borderColor}33`,
    rule: `${colors.borderColor}66`,
    glassBorder: `${colors.borderColor}66`,

    primaryMark: colors.pinkAccent,
    supportMark: colors.cyanAccent,
    amberMark: colors.warmAccent,
  };
}

export const EDITORIAL_PALETTE: EditorialPalette = {
  bg1: "#1a1a1a",
  bg2: "#221f1a",
  bg3: "#171615",
  text: "#fafafa",
  muted: "#b8b8b8",
  subtle: "#85827c",
  accent: "#e0815c",
  accentSoft: "#e0815c1f",
  lineStrong: "#4a463d8f",
  line: "#4a463d66",
  lineSoft: "#4a463d33",
  activeRule: "#e0815c",
  hairline: "#4a463d33",
  rule: "#4a463d66",
  glassBorder: "#4a463d66",

  primaryMark: "#e0815c",
  supportMark: "#9fb1a8",
  amberMark: "#e8b97a",
};
