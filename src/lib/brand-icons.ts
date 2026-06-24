import type { SimpleIcon } from "simple-icons";
import {
  siAndroidstudio,
  siAnthropic,
  siApple,
  siBilibili,
  siBun,
  siClaude,
  siClaudecode,
  siCursor,
  siDeno,
  siDiscord,
  siDocker,
  siFigma,
  siGit,
  siGithub,
  siGithubcopilot,
  siGo,
  siIndieweb,
  siGoogle,
  siGooglegemini,
  siJetbrains,
  siJavascript,
  siLinux,
  siLmstudio,
  siMarkdown,
  siMinimax,
  siModelcontextprotocol,
  siModelscope,
  siMoonshotai,
  siNextdotjs,
  siNodedotjs,
  siNotion,
  siNpm,
  siObsstudio,
  siOpencode,
  siOpenapiinitiative,
  siOpenrouter,
  siPnpm,
  siPostgresql,
  siPython,
  siQq,
  siReact,
  siRust,
  siSwift,
  siTailwindcss,
  siTelegram,
  siTypescript,
  siVercel,
  siVite,
  siWechat,
  siWindsurf,
  siX,
  siYoutube,
  siYoutubestudio,
  siZedindustries,
} from "simple-icons";

export type BrandIconMode = "mono" | "brand";
export type BrandIconCategory =
  | "ai"
  | "coding"
  | "framework"
  | "streaming"
  | "social"
  | "platform"
  | "infra";

const ICONS = {
  claude: siClaude,
  anthropic: siAnthropic,
  "claude-code": siClaudecode,
  cursor: siCursor,
  "github-copilot": siGithubcopilot,
  gemini: siGooglegemini,
  openrouter: siOpenrouter,
  moonshot: siMoonshotai,
  minimax: siMinimax,
  opencode: siOpencode,
  zed: siZedindustries,
  mcp: siModelcontextprotocol,
  modelscope: siModelscope,
  "lm-studio": siLmstudio,
  windsurf: siWindsurf,
  github: siGithub,
  website: siIndieweb,
  qq: siQq,
  git: siGit,
  react: siReact,
  nextdotjs: siNextdotjs,
  vite: siVite,
  typescript: siTypescript,
  javascript: siJavascript,
  tailwindcss: siTailwindcss,
  obs: siObsstudio,
  youtube: siYoutube,
  "youtube-studio": siYoutubestudio,
  bilibili: siBilibili,
  wechat: siWechat,
  x: siX,
  discord: siDiscord,
  telegram: siTelegram,
  figma: siFigma,
  notion: siNotion,
  docker: siDocker,
  postgresql: siPostgresql,
  vercel: siVercel,
  npm: siNpm,
  pnpm: siPnpm,
  bun: siBun,
  nodejs: siNodedotjs,
  deno: siDeno,
  python: siPython,
  go: siGo,
  rust: siRust,
  swift: siSwift,
  apple: siApple,
  linux: siLinux,
  markdown: siMarkdown,
  androidstudio: siAndroidstudio,
  jetbrains: siJetbrains,
  google: siGoogle,
  openapi: siOpenapiinitiative,
} as const satisfies Record<string, SimpleIcon>;

export type BrandIconKey = keyof typeof ICONS;

export interface BrandIconMeta {
  iconKey: BrandIconKey;
  label: string;
  aliases: string[];
  category: BrandIconCategory;
  recommended?: boolean;
  icon: SimpleIcon;
}

function meta(
  iconKey: BrandIconKey,
  options: Omit<BrandIconMeta, "iconKey" | "icon">,
): BrandIconMeta {
  return {
    iconKey,
    icon: ICONS[iconKey],
    ...options,
  };
}

export const BRAND_ICON_REGISTRY: Record<BrandIconKey, BrandIconMeta> = {
  claude: meta("claude", {
    label: "Claude",
    aliases: ["anthropic", "opus", "sonnet", "haiku"],
    category: "ai",
    recommended: true,
  }),
  anthropic: meta("anthropic", {
    label: "Anthropic",
    aliases: ["claude company"],
    category: "ai",
  }),
  "claude-code": meta("claude-code", {
    label: "Claude Code",
    aliases: ["claude cli", "anthropic code", "coding agent"],
    category: "coding",
    recommended: true,
  }),
  cursor: meta("cursor", {
    label: "Cursor",
    aliases: ["editor", "ai editor"],
    category: "coding",
    recommended: true,
  }),
  "github-copilot": meta("github-copilot", {
    label: "GitHub Copilot",
    aliases: ["copilot", "github"],
    category: "coding",
  }),
  gemini: meta("gemini", {
    label: "Gemini",
    aliases: ["google gemini", "google ai"],
    category: "ai",
    recommended: true,
  }),
  openrouter: meta("openrouter", {
    label: "OpenRouter",
    aliases: ["router", "model router"],
    category: "ai",
  }),
  moonshot: meta("moonshot", {
    label: "Moonshot AI",
    aliases: ["kimi", "moonshotai", "月之暗面"],
    category: "ai",
  }),
  minimax: meta("minimax", {
    label: "MiniMax",
    aliases: ["minimx", "mini max", "海螺"],
    category: "ai",
  }),
  opencode: meta("opencode", {
    label: "OpenCode",
    aliases: ["open code", "terminal agent"],
    category: "coding",
  }),
  zed: meta("zed", {
    label: "Zed",
    aliases: ["zed industries", "editor"],
    category: "coding",
  }),
  mcp: meta("mcp", {
    label: "MCP",
    aliases: ["model context protocol", "context protocol"],
    category: "ai",
  }),
  modelscope: meta("modelscope", {
    label: "ModelScope",
    aliases: ["model scope"],
    category: "ai",
  }),
  "lm-studio": meta("lm-studio", {
    label: "LM Studio",
    aliases: ["local model", "llm studio"],
    category: "ai",
  }),
  windsurf: meta("windsurf", {
    label: "Windsurf",
    aliases: ["codeium", "ai editor"],
    category: "coding",
  }),
  github: meta("github", {
    label: "GitHub",
    aliases: ["repo", "repository"],
    category: "coding",
  }),
  website: meta("website", {
    label: "Website",
    aliases: ["blog", "site", "homepage", "indieweb", "personal website", "个人网站", "博客"],
    category: "social",
  }),
  qq: meta("qq", {
    label: "QQ",
    aliases: ["qq group", "qq群", "qq 群"],
    category: "social",
  }),
  git: meta("git", {
    label: "Git",
    aliases: ["version control"],
    category: "coding",
  }),
  react: meta("react", {
    label: "React",
    aliases: ["reactjs", "react.js"],
    category: "framework",
    recommended: true,
  }),
  nextdotjs: meta("nextdotjs", {
    label: "Next.js",
    aliases: ["next", "nextjs"],
    category: "framework",
    recommended: true,
  }),
  vite: meta("vite", {
    label: "Vite",
    aliases: ["build tool"],
    category: "framework",
    recommended: true,
  }),
  typescript: meta("typescript", {
    label: "TypeScript",
    aliases: ["ts"],
    category: "framework",
  }),
  javascript: meta("javascript", {
    label: "JavaScript",
    aliases: ["js"],
    category: "framework",
  }),
  tailwindcss: meta("tailwindcss", {
    label: "Tailwind CSS",
    aliases: ["tailwind"],
    category: "framework",
  }),
  obs: meta("obs", {
    label: "OBS Studio",
    aliases: ["obs", "stream", "broadcast"],
    category: "streaming",
    recommended: true,
  }),
  youtube: meta("youtube", {
    label: "YouTube",
    aliases: ["yt"],
    category: "streaming",
  }),
  "youtube-studio": meta("youtube-studio", {
    label: "YouTube Studio",
    aliases: ["yt studio"],
    category: "streaming",
  }),
  bilibili: meta("bilibili", {
    label: "Bilibili",
    aliases: ["b站", "哔哩哔哩"],
    category: "streaming",
  }),
  wechat: meta("wechat", {
    label: "WeChat",
    aliases: ["微信"],
    category: "social",
  }),
  x: meta("x", {
    label: "X",
    aliases: ["twitter"],
    category: "social",
  }),
  discord: meta("discord", {
    label: "Discord",
    aliases: ["community"],
    category: "social",
  }),
  telegram: meta("telegram", {
    label: "Telegram",
    aliases: ["tg"],
    category: "social",
  }),
  figma: meta("figma", {
    label: "Figma",
    aliases: ["design"],
    category: "coding",
  }),
  notion: meta("notion", {
    label: "Notion",
    aliases: ["notes", "docs"],
    category: "platform",
  }),
  docker: meta("docker", {
    label: "Docker",
    aliases: ["container"],
    category: "infra",
  }),
  postgresql: meta("postgresql", {
    label: "PostgreSQL",
    aliases: ["postgres", "database", "db"],
    category: "infra",
  }),
  vercel: meta("vercel", {
    label: "Vercel",
    aliases: ["deploy", "hosting"],
    category: "infra",
  }),
  npm: meta("npm", {
    label: "npm",
    aliases: ["package manager"],
    category: "infra",
  }),
  pnpm: meta("pnpm", {
    label: "pnpm",
    aliases: ["package manager"],
    category: "infra",
  }),
  bun: meta("bun", {
    label: "Bun",
    aliases: ["runtime"],
    category: "infra",
  }),
  nodejs: meta("nodejs", {
    label: "Node.js",
    aliases: ["node", "runtime"],
    category: "infra",
  }),
  deno: meta("deno", {
    label: "Deno",
    aliases: ["runtime"],
    category: "infra",
  }),
  python: meta("python", {
    label: "Python",
    aliases: ["py"],
    category: "coding",
  }),
  go: meta("go", {
    label: "Go",
    aliases: ["golang"],
    category: "coding",
  }),
  rust: meta("rust", {
    label: "Rust",
    aliases: ["cargo"],
    category: "coding",
  }),
  swift: meta("swift", {
    label: "Swift",
    aliases: ["ios"],
    category: "coding",
  }),
  apple: meta("apple", {
    label: "Apple",
    aliases: ["mac", "macos"],
    category: "platform",
  }),
  linux: meta("linux", {
    label: "Linux",
    aliases: ["server"],
    category: "platform",
  }),
  markdown: meta("markdown", {
    label: "Markdown",
    aliases: ["md", "writing"],
    category: "platform",
  }),
  androidstudio: meta("androidstudio", {
    label: "Android Studio",
    aliases: ["android"],
    category: "coding",
  }),
  jetbrains: meta("jetbrains", {
    label: "JetBrains",
    aliases: ["junie", "intellij"],
    category: "coding",
  }),
  google: meta("google", {
    label: "Google",
    aliases: ["search"],
    category: "platform",
  }),
  openapi: meta("openapi", {
    label: "OpenAPI",
    aliases: ["swagger", "api"],
    category: "infra",
  }),
};

export const BRAND_ICON_OPTIONS = Object.values(BRAND_ICON_REGISTRY);

export function isBrandIconKey(value: unknown): value is BrandIconKey {
  return typeof value === "string" && value in BRAND_ICON_REGISTRY;
}

export function isBrandIconMode(value: unknown): value is BrandIconMode {
  return value === "mono" || value === "brand";
}

export function brandIconLabel(iconKey: BrandIconKey): string {
  return BRAND_ICON_REGISTRY[iconKey].label;
}

export function brandIconColor(iconKey: BrandIconKey): string {
  return `#${BRAND_ICON_REGISTRY[iconKey].icon.hex}`;
}

function normalizeQuery(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

function matches(meta: BrandIconMeta, normalized: string): boolean {
  const haystack = [meta.label, meta.iconKey, meta.category, ...meta.aliases]
    .map(normalizeQuery)
    .join(" ");
  return haystack.includes(normalized);
}

export function searchBrandIcons(query: string): BrandIconMeta[] {
  const normalized = normalizeQuery(query);
  const options = normalized
    ? BRAND_ICON_OPTIONS.filter((meta) => matches(meta, normalized))
    : BRAND_ICON_OPTIONS;

  return [...options].sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

export function inferBrandIconKey(label: string): BrandIconKey | undefined {
  const normalized = normalizeQuery(label);
  if (!normalized) return undefined;

  // Prefer exact/alias tokens first, then fall back to broad search. This keeps
  // compound labels like "React + Vite" anchored by the first recognizable tool.
  for (const meta of BRAND_ICON_OPTIONS) {
    const names = [meta.label, meta.iconKey, ...meta.aliases].map(normalizeQuery);
    if (names.some((name) => normalized === name || normalized.includes(name))) {
      return meta.iconKey;
    }
  }

  return searchBrandIcons(label)[0]?.iconKey;
}
