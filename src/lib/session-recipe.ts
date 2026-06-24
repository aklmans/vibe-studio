import type { OverlayState } from "../types";
import { normalizeStackItems, stackItemsToLabels } from "./stack";
import type { Locale } from "./i18n";
import {
  defaultSocialLabel,
  isSocialKind,
  socialIconKeyFromKind,
  type SocialConfig,
  type SocialKind,
} from "./socials";

export interface SessionRecipeSocial {
  kind: SocialKind;
  label: string;
  value: string;
}

export interface SessionRecipe {
  title: string;
  goal: string;
  tasks: string[];
  stackItems: string[];
  socials: SessionRecipeSocial[];
}

type RecipeSectionKey = "goal" | "tasks" | "stack" | "social";

const LOCALIZED_GOAL_TITLE: Record<Locale, string> = {
  zh: "今日目标",
  en: "Today's Goal",
};

const SECTION_ALIASES: Record<string, RecipeSectionKey> = {
  goal: "goal",
  goals: "goal",
  objective: "goal",
  objectives: "goal",
  "today's goal": "goal",
  今日目标: "goal",
  目标: "goal",
  tasks: "tasks",
  task: "tasks",
  todo: "tasks",
  todos: "tasks",
  plan: "tasks",
  任务: "tasks",
  计划: "tasks",
  stack: "stack",
  tech: "stack",
  "tech stack": "stack",
  tools: "stack",
  技术栈: "stack",
  工具栈: "stack",
  工具: "stack",
  social: "social",
  socials: "social",
  links: "social",
  社交: "social",
  联系方式: "social",
};

export function parseSessionRecipe(
  input: string,
  locale: Locale,
): SessionRecipe {
  const text = input.trim();
  const markdown = parseMarkdownSections(text);
  const title = markdown.title || inferBriefTitle(text) || fallbackTitle(locale);
  const tasks = markdown.tasks.length > 0 ? markdown.tasks : inferBriefTasks(text);
  const stackItems =
    markdown.stackItems.length > 0 ? markdown.stackItems : inferBriefStack(text);

  return {
    title,
    goal: markdown.goal || inferBriefGoal(text, title),
    tasks,
    stackItems,
    socials: markdown.socials,
  };
}

export function applySessionRecipeToOverlayState(
  state: OverlayState,
  recipe: SessionRecipe,
  locale: Locale,
): OverlayState {
  const tasks = recipe.tasks.length > 0
    ? recipe.tasks
    : (state.sidebar.sections[0]?.bullets ?? []);
  const sections = state.sidebar.sections.map((section, index) =>
    index === 0
      ? {
          title: LOCALIZED_GOAL_TITLE[locale],
          bullets: tasks,
        }
      : section,
  );
  const sectionsDone = state.sidebar.sectionsDone.map((sectionDone, index) =>
    index === 0 ? tasks.map(() => false) : sectionDone,
  );
  const socials =
    recipe.socials.length > 0
      ? recipe.socials.map((social) => recipeSocialToConfig(social, locale))
      : state.cover.socials;

  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      activeSection: 0,
      sections,
      sectionsDone,
    },
    stack: {
      ...state.stack,
      items: recipe.stackItems.length > 0
        ? normalizeStackItems(recipe.stackItems, state.stack.items)
        : state.stack.items,
    },
    cover: {
      ...state.cover,
      title: recipe.title || state.cover.title,
      todayTopic: recipe.goal || recipe.title || state.cover.todayTopic,
      socials,
    },
  };
}

export function stateToSessionRecipe(state: OverlayState): SessionRecipe {
  return {
    title: state.cover.title,
    goal: state.cover.todayTopic,
    tasks: state.sidebar.sections[0]?.bullets ?? [],
    stackItems: stackItemsToLabels(state.stack.items),
    socials: state.cover.socials
      .filter((social) => social.visible)
      .map((social) => ({
        kind: socialKindFromIconKey(social.iconKey),
        label: social.label,
        value: social.value,
      })),
  };
}

export function formatSessionRecipeMarkdown(recipe: SessionRecipe): string {
  const lines = [
    `# ${recipe.title}`,
    "",
    "## Goal",
    recipe.goal,
    "",
    "## Tasks",
    ...recipe.tasks.map((task) => `- ${task}`),
    "",
    "## Stack",
    recipe.stackItems.join(", "),
    "",
    "## Social",
    ...recipe.socials.map((social) => `${social.label}: ${social.value}`),
  ];

  return `${lines.join("\n").trim()}\n`;
}

function parseMarkdownSections(text: string): {
  title: string;
  goal: string;
  tasks: string[];
  stackItems: string[];
  socials: SessionRecipeSocial[];
} {
  const lines = text.split(/\r?\n/);
  let title = "";
  let currentSection: RecipeSectionKey | null = null;
  const sections: Record<RecipeSectionKey, string[]> = {
    goal: [],
    tasks: [],
    stack: [],
    social: [],
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      title = h1[1]?.trim() ?? "";
      currentSection = null;
      continue;
    }

    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      currentSection = normalizeSectionName(heading[1] ?? "");
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  return {
    title,
    goal: parseParagraph(sections.goal),
    tasks: parseListItems(sections.tasks),
    stackItems: parseStackItems(sections.stack),
    socials: parseSocialItems(sections.social),
  };
}

function normalizeSectionName(value: string): RecipeSectionKey | null {
  const normalized = value.trim().toLowerCase();
  return SECTION_ALIASES[normalized] ?? null;
}

function parseParagraph(lines: string[]): string {
  return lines
    .map((line) => stripListMarker(line))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function parseListItems(lines: string[]): string[] {
  if (lines.some((line) => /^[-*]\s+/.test(line.trim()) || /^\d+[.)、]\s*/.test(line.trim()))) {
    return lines.map((line) => cleanValue(stripListMarker(line))).filter(Boolean);
  }

  return lines
    .flatMap((line) => splitInlineItems(stripListMarker(line)))
    .map(cleanValue)
    .filter(Boolean);
}

function parseStackItems(lines: string[]): string[] {
  return splitInlineItems(
    lines.map((line) => stripListMarker(line)).join(", "),
  ).filter(Boolean);
}

function parseSocialItems(lines: string[]): SessionRecipeSocial[] {
  return lines
    .map((line) => stripListMarker(line))
    .map((line) => {
      const match = line.match(/^([^:：]+)[:：]\s*(.+)$/);
      if (!match) {
        return null;
      }
      const label = cleanValue(match[1] ?? "");
      const value = cleanValue(match[2] ?? "");
      if (!label || !value) {
        return null;
      }
      return {
        kind: socialKindFromLabel(label),
        label,
        value,
      };
    })
    .filter((item): item is SessionRecipeSocial => Boolean(item));
}

function inferBriefTitle(text: string): string {
  const patterns = [
    /(?:今天|今晚)?直播\s*([^。；;]+?)(?:。|；|;|，任务|, tasks| tasks|$)/i,
    /(?:标题|title)[:：]\s*([^。；;\n]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = cleanValue(match?.[1] ?? "");
    if (value) {
      return value;
    }
  }
  return cleanValue(text.split(/\r?\n/)[0] ?? "");
}

function inferBriefGoal(text: string, title: string): string {
  const match = text.match(/(?:目标|goal)[:：]\s*([^。；;\n]+)/i);
  return cleanValue(match?.[1] ?? "") || title;
}

function inferBriefTasks(text: string): string[] {
  const match = text.match(/(?:任务(?:是)?|tasks?)[:：]\s*([^。；;\n]+)/i);
  return splitInlineItems(match?.[1] ?? "");
}

function inferBriefStack(text: string): string[] {
  const match = text.match(/(?:技术栈(?:显示|是)?|工具栈|stack|tools)[:：]?\s*([^。；;\n]+)/i);
  return splitInlineItems(match?.[1] ?? "");
}

function splitInlineItems(value: string): string[] {
  return value
    .split(/[,，、/|]+/)
    .map(cleanValue)
    .filter(Boolean);
}

function stripListMarker(value: string): string {
  return value.replace(/^[-*]\s+/, "").replace(/^\d+[.)、]\s*/, "").trim();
}

function cleanValue(value: string): string {
  return value.trim().replace(/^["'“”]+|["'“”。；;]+$/g, "").trim();
}

function recipeSocialToConfig(
  social: SessionRecipeSocial,
  locale: Locale,
): SocialConfig {
  const iconKey = socialIconKeyFromKind(social.kind);
  return {
    visible: true,
    iconKey,
    iconMode: "mono",
    label: social.label || defaultSocialLabel(social.kind, locale),
    value: social.value,
    customColor: iconKey ? "" : "#e0815c",
  };
}

function socialKindFromIconKey(iconKey: SocialConfig["iconKey"]): SocialKind {
  switch (iconKey) {
    case "bilibili":
      return "bilibili";
    case "website":
      return "blog";
    case "github":
      return "github";
    case "qq":
      return "qq";
    case "x":
      return "x";
    case "youtube":
      return "youtube";
    case "discord":
      return "discord";
    case "wechat":
      return "wechat";
    default:
      return "custom";
  }
}

function socialKindFromLabel(label: string): SocialKind {
  const normalized = label.trim().toLowerCase();
  if (isSocialKind(normalized)) {
    return normalized;
  }

  if (["b站", "bilibili", "哔哩哔哩"].includes(normalized)) {
    return "bilibili";
  }
  if (["website", "site", "blog", "个人网站", "博客"].includes(normalized)) {
    return "blog";
  }
  if (["qq", "qq group", "qq群", "qq 群"].includes(normalized)) {
    return "qq";
  }
  if (["wechat", "微信"].includes(normalized)) {
    return "wechat";
  }
  if (["youtube", "yt"].includes(normalized)) {
    return "youtube";
  }

  return "custom";
}

function fallbackTitle(locale: Locale): string {
  return locale === "zh" ? "今天直播" : "Today's Stream";
}
