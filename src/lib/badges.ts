// Badge presets shown on the Cover toolbar and Poster left column.
// "kind" identifies the icon source — built-in presets use a bundled SVG,
// "custom" lets the user point at their own URL.

export type BadgeKind = "claude" | "codex" | "gemini" | "grok" | "custom";

export interface BadgePreset {
  kind: BadgeKind;
  label: string;
  iconUrl: string;
}

export const BADGE_PRESETS: Record<Exclude<BadgeKind, "custom">, BadgePreset> = {
  claude: { kind: "claude", label: "Claude", iconUrl: "/icons/claude.svg" },
  codex: { kind: "codex", label: "Codex", iconUrl: "/icons/codex.svg" },
  gemini: { kind: "gemini", label: "Gemini", iconUrl: "/icons/gemini.svg" },
  grok: { kind: "grok", label: "Grok", iconUrl: "/icons/grok.svg" },
};

export interface BadgeConfig {
  visible: boolean;
  kind: BadgeKind;
  label: string;
  customIconUrl: string;
}

export function badgeIconUrl(badge: BadgeConfig): string {
  if (badge.kind === "custom") return badge.customIconUrl;
  return BADGE_PRESETS[badge.kind].iconUrl;
}
