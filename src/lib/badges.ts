// Badge identity model. Runtime badges are registry-backed by `iconKey` and
// rendered as inline SVGs, so exported canvases do not depend on remote icon
// URLs. The old `kind` field is accepted only in stateStorage migration.

export type LegacyBadgeKind =
  | "claude"
  | "codex"
  | "gemini"
  | "grok"
  | "custom";

export type BadgeIconKey =
  | "claude"
  | "claude-code"
  | "anthropic"
  | "codex"
  | "openai"
  | "gemini"
  | "gemini-cli"
  | "cursor"
  | "github-copilot"
  | "copilot"
  | "deepseek"
  | "grok"
  | "qwen"
  | "doubao"
  | "cline"
  | "kimi"
  | "moonshot"
  | "z-ai"
  | "junie"
  | "minimax"
  | "opencode"
  | "antigravity"
  | "chatgpt"
  | "custom";

export type BadgeIconMode = "mono" | "brand";
export type BadgeIconCategory = "recommended" | "model" | "coding" | "provider";

export interface BadgeIconMeta {
  iconKey: Exclude<BadgeIconKey, "custom">;
  label: string;
  aliases: string[];
  category: BadgeIconCategory;
  recommended?: boolean;
}

export const BADGE_ICON_REGISTRY: Record<
  Exclude<BadgeIconKey, "custom">,
  BadgeIconMeta
> = {
  claude: {
    iconKey: "claude",
    label: "Claude",
    aliases: ["anthropic", "opus", "sonnet", "haiku"],
    category: "recommended",
    recommended: true,
  },
  "claude-code": {
    iconKey: "claude-code",
    label: "Claude Code",
    aliases: ["claude cli", "anthropic code"],
    category: "coding",
    recommended: true,
  },
  anthropic: {
    iconKey: "anthropic",
    label: "Anthropic",
    aliases: ["claude company"],
    category: "provider",
  },
  codex: {
    iconKey: "codex",
    label: "Codex",
    aliases: ["openai codex", "code agent"],
    category: "recommended",
    recommended: true,
  },
  openai: {
    iconKey: "openai",
    label: "OpenAI",
    aliases: ["gpt", "chatgpt"],
    category: "provider",
  },
  gemini: {
    iconKey: "gemini",
    label: "Gemini",
    aliases: ["google"],
    category: "model",
  },
  "gemini-cli": {
    iconKey: "gemini-cli",
    label: "Gemini CLI",
    aliases: ["google cli", "gemini code"],
    category: "coding",
  },
  cursor: {
    iconKey: "cursor",
    label: "Cursor",
    aliases: ["editor"],
    category: "coding",
  },
  "github-copilot": {
    iconKey: "github-copilot",
    label: "GitHub Copilot",
    aliases: ["copilot", "github"],
    category: "coding",
  },
  copilot: {
    iconKey: "copilot",
    label: "Copilot",
    aliases: ["microsoft"],
    category: "coding",
  },
  deepseek: {
    iconKey: "deepseek",
    label: "DeepSeek",
    aliases: ["deep seek"],
    category: "model",
  },
  grok: {
    iconKey: "grok",
    label: "Grok",
    aliases: ["xai", "x ai"],
    category: "model",
  },
  qwen: {
    iconKey: "qwen",
    label: "Qwen",
    aliases: ["通义", "alibaba"],
    category: "model",
  },
  doubao: {
    iconKey: "doubao",
    label: "Doubao",
    aliases: ["豆包", "bytedance"],
    category: "model",
  },
  cline: {
    iconKey: "cline",
    label: "Cline",
    aliases: ["vscode agent"],
    category: "coding",
  },
  kimi: {
    iconKey: "kimi",
    label: "Kimi",
    aliases: ["moonshot kimi", "月之暗面"],
    category: "model",
    recommended: true,
  },
  moonshot: {
    iconKey: "moonshot",
    label: "Moonshot",
    aliases: ["moonshot ai", "kimi provider", "月之暗面"],
    category: "provider",
  },
  "z-ai": {
    iconKey: "z-ai",
    label: "Z.ai",
    aliases: ["zai", "z ai", "glm", "chatglm", "智谱"],
    category: "model",
  },
  junie: {
    iconKey: "junie",
    label: "Junie",
    aliases: ["jetbrains", "coding agent"],
    category: "coding",
  },
  minimax: {
    iconKey: "minimax",
    label: "MiniMax",
    aliases: ["minimx", "mini max", "海螺"],
    category: "model",
  },
  opencode: {
    iconKey: "opencode",
    label: "OpenCode",
    aliases: ["open code", "code agent", "terminal agent"],
    category: "coding",
  },
  antigravity: {
    iconKey: "antigravity",
    label: "Antigravity",
    aliases: ["google antigravity", "google agent"],
    category: "coding",
  },
  chatgpt: {
    iconKey: "chatgpt",
    label: "ChatGPT",
    aliases: ["openai chatgpt", "gpt", "gpt-5"],
    category: "model",
    recommended: true,
  },
};

export const BADGE_ICON_OPTIONS = Object.values(BADGE_ICON_REGISTRY);
export type ConfigBadgeIconKey = Exclude<BadgeIconKey, "custom">;
export const CONFIG_BADGE_ICON_KEYS = BADGE_ICON_OPTIONS.map(
  (meta) => meta.iconKey,
) as ConfigBadgeIconKey[];
export const CONFIG_BADGE_ICON_KEY_LIST = CONFIG_BADGE_ICON_KEYS.join(", ");
export const CONFIG_BADGE_PROMPT_RULE = [
  `Allowed badge keys: ${CONFIG_BADGE_ICON_KEY_LIST}.`,
  "Use exact badge keys only; these are the curated @lobehub/icons AI/LLM model, provider, and coding-agent icons supported by this app.",
  "Badges are optional. Only include badge keys when a listed AI/LLM/provider/coding-agent clearly matches the stream topic, featured tool, or provider. If there is no clear match, use an empty badges array; never invent or force a badge.",
  "Do not use generic labels such as AI, LLM, or AI/LLM, and do not put framework/tool-stack labels such as React or Next.js in badges.",
].join(" ");

const GENERIC_BADGE_PLACEHOLDERS = new Set([
  "ai",
  "llm",
  "ai/llm",
  "ai-llm",
  "ai llm",
  "ai model",
  "llm model",
  "model",
  "models",
  "agent",
  "agents",
]);

export const LEGACY_BADGE_KIND_TO_ICON_KEY: Record<LegacyBadgeKind, BadgeIconKey> = {
  claude: "claude",
  codex: "codex",
  gemini: "gemini",
  grok: "grok",
  custom: "custom",
};

export interface BadgeConfig {
  visible: boolean;
  iconKey: BadgeIconKey;
  iconMode: BadgeIconMode;
  label: string;
  /** Legacy/custom compatibility only. Registry-backed badges do not read it. */
  customIconUrl: string;
}

export function isBadgeIconKey(value: unknown): value is BadgeIconKey {
  return (
    value === "custom" ||
    (typeof value === "string" && value in BADGE_ICON_REGISTRY)
  );
}

function normalizeBadgeLookupValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._]+/g, "-")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ");
}

function slugBadgeLookupValue(value: string): string {
  return normalizeBadgeLookupValue(value).replace(/\s+/g, "-");
}

export function isGenericBadgePlaceholder(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = normalizeBadgeLookupValue(value);
  const slug = slugBadgeLookupValue(value);
  return (
    GENERIC_BADGE_PLACEHOLDERS.has(normalized) ||
    GENERIC_BADGE_PLACEHOLDERS.has(slug)
  );
}

export function normalizeBadgeIconKey(value: unknown): ConfigBadgeIconKey | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  if (!clean || isGenericBadgePlaceholder(clean)) return null;

  const normalized = normalizeBadgeLookupValue(clean);
  const slug = slugBadgeLookupValue(clean);

  for (const meta of BADGE_ICON_OPTIONS) {
    if (meta.iconKey === clean || meta.iconKey === slug) return meta.iconKey;
  }

  for (const meta of BADGE_ICON_OPTIONS) {
    const normalizedLabel = normalizeBadgeLookupValue(meta.label);
    if (
      normalizedLabel === normalized ||
      slugBadgeLookupValue(meta.label) === slug
    ) {
      return meta.iconKey;
    }
  }

  for (const meta of BADGE_ICON_OPTIONS) {
    if (
      meta.aliases.some((alias) => {
        const normalizedAlias = normalizeBadgeLookupValue(alias);
        return normalizedAlias === normalized || slugBadgeLookupValue(alias) === slug;
      })
    ) {
      return meta.iconKey;
    }
  }

  return null;
}

export function isLegacyBadgeKind(value: unknown): value is LegacyBadgeKind {
  return (
    value === "claude" ||
    value === "codex" ||
    value === "gemini" ||
    value === "grok" ||
    value === "custom"
  );
}

export function isBadgeIconMode(value: unknown): value is BadgeIconMode {
  return value === "mono" || value === "brand";
}

export function badgeLabelForIconKey(iconKey: BadgeIconKey, fallback = "Badge"): string {
  if (iconKey === "custom") return fallback;
  return BADGE_ICON_REGISTRY[iconKey].label;
}

export function searchBadgeIcons(query: string): BadgeIconMeta[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...BADGE_ICON_OPTIONS].sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  }

  return BADGE_ICON_OPTIONS.filter((meta) => {
    const haystack = [meta.label, meta.iconKey, meta.category, ...meta.aliases]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
