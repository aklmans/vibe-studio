import {
  badgeLabelForIconKey,
  type BadgeConfig,
  type BadgeIconKey,
} from "./badges";

export type BadgePreset = {
  id: string;
  label: string;
  keys: readonly BadgeIconKey[];
};

export const BADGE_PRESETS: readonly BadgePreset[] = [
  { id: "claude-codex", label: "Claude + Codex", keys: ["claude", "codex"] },
  { id: "chatgpt-kimi", label: "ChatGPT + Kimi", keys: ["chatgpt", "kimi"] },
  { id: "opencode-z-ai", label: "OpenCode + Z.ai", keys: ["opencode", "z-ai"] },
  {
    id: "claude-code-cursor",
    label: "Claude Code + Cursor",
    keys: ["claude-code", "cursor"],
  },
] as const;

function visibleBadgeIndexes(badges: readonly BadgeConfig[]) {
  return badges.reduce<number[]>((indexes, badge, index) => {
    if (badge.visible) indexes.push(index);
    return indexes;
  }, []);
}

export function createBadge(iconKey: BadgeIconKey): BadgeConfig {
  return {
    visible: true,
    iconKey,
    iconMode: "brand",
    label: badgeLabelForIconKey(iconKey),
    customIconUrl: "",
  };
}

export function moveVisibleBadge(
  badges: readonly BadgeConfig[],
  visibleIndex: number,
  direction: -1 | 1,
): BadgeConfig[] {
  const visibleIndexes = visibleBadgeIndexes(badges);
  const targetVisibleIndex = visibleIndex + direction;
  if (
    visibleIndex < 0 ||
    visibleIndex >= visibleIndexes.length ||
    targetVisibleIndex < 0 ||
    targetVisibleIndex >= visibleIndexes.length
  ) {
    return [...badges];
  }

  const next = [...badges];
  const from = visibleIndexes[visibleIndex];
  const to = visibleIndexes[targetVisibleIndex];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function addBadgePreset(
  badges: readonly BadgeConfig[],
  keys: readonly BadgeIconKey[],
): BadgeConfig[] {
  const visibleKeys = new Set(
    badges.filter((badge) => badge.visible).map((badge) => badge.iconKey),
  );
  const additions = keys
    .filter((key) => !visibleKeys.has(key))
    .map((key) => createBadge(key));

  if (additions.length === 0) return [...badges];
  return [...badges, ...additions];
}
