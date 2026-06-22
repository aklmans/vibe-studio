import type { ColorTokens } from "../../lib/theme";

// Warm editorial palette derived from the active theme tokens (state.colors).
// Single source of truth for broadcast-asset surfaces, lines, and accent marks
// so Overlay / Cover / Poster / Wallpaper read as one system in both Light and
// Dark. The accent is a *mark*, never a large fill; lines are warm hairlines,
// never white-alpha (which disappears on the Light paper surface).
export interface EditorialPalette {
  bg1: string; // base background
  bg2: string; // elevated surface
  bg3: string; // deepest layer (subtle separation)
  text: string;
  muted: string;
  subtle: string;
  accent: string; // warm accent — used only as a small mark
  accentSoft: string; // accent at low alpha for tints / fills
  hairline: string; // thin warm divider
  rule: string; // slightly stronger rule / border
  glassBorder: string; // legacy alias === rule (kept for existing callers)
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
    hairline: `${colors.borderColor}33`,
    rule: `${colors.borderColor}59`,
    glassBorder: `${colors.borderColor}59`,
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
  hairline: "#4a463d33",
  rule: "#4a463d59",
  glassBorder: "#4a463d59",
};
