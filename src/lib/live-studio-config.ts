import type { CoverVisual, OverlayState } from "../types";
import { createBadge } from "./badge-editor";
import {
  badgeLabelForIconKey,
  CONFIG_BADGE_ICON_KEY_LIST,
  isGenericBadgePlaceholder,
  isBadgeIconKey,
  normalizeBadgeIconKey,
  type BadgeIconKey,
} from "./badges";
import {
  isBrandIconKey,
  type BrandIconKey,
} from "./brand-icons";
import { isPrivateImageValuePlaceholder, privateSocialValuePlaceholderIndex } from "./config-privacy";
import { createStackItem } from "./stack";
import type { SocialConfig } from "./socials";

export interface LiveStudioConfigSection {
  title: string;
  bullets: string[];
  /** Planned duration in minutes — agenda timing for lecture-style streams. */
  minutes?: number;
}

/** Positive whole minutes, capped at a sane ceiling; anything else is absent. */
function cleanMinutes(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const minutes = Math.floor(value);
  return minutes >= 1 && minutes <= 999 ? minutes : undefined;
}

export interface LiveStudioConfigSocial {
  icon?: BrandIconKey;
  label: string;
  value: string;
  color?: string;
}

export interface LiveStudioConfigCover {
  visual?: CoverVisual;
  portraitUrl?: string;
  sceneUrl?: string;
}

export interface LiveStudioConfigProfile {
  avatarUrl?: string;
  avatarVisible?: boolean;
}

export interface LiveStudioConfig {
  version: 1;
  title: string;
  subtitle: string;
  author?: string;
  profile?: LiveStudioConfigProfile;
  cover?: LiveStudioConfigCover;
  badges: BadgeIconKey[];
  stack: string[];
  socials: LiveStudioConfigSocial[];
  sections: LiveStudioConfigSection[];
}

export interface LiveStudioConfigValidation {
  valid: boolean;
  issues: string[];
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function isCoverVisual(value: unknown): value is CoverVisual {
  return value === "avatar" || value === "scene" || value === "title";
}

function normalizeProfile(value: unknown): LiveStudioConfigProfile | undefined {
  const source = record(value);
  if (!source) return undefined;
  const avatarUrl = cleanString(source.avatarUrl);
  const avatarVisible = typeof source.avatarVisible === "boolean" ? source.avatarVisible : undefined;
  return {
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(typeof avatarVisible === "boolean" ? { avatarVisible } : {}),
  };
}

function normalizeCover(value: unknown): LiveStudioConfigCover | undefined {
  const source = record(value);
  if (!source) return undefined;
  const visual = isCoverVisual(source.visual) ? source.visual : undefined;
  const portraitUrl = cleanString(source.portraitUrl);
  const sceneUrl = cleanString(source.sceneUrl);
  return {
    ...(visual ? { visual } : {}),
    ...(portraitUrl ? { portraitUrl } : {}),
    ...(sceneUrl ? { sceneUrl } : {}),
  };
}

function normalizeBadgeKeys(value: unknown): BadgeIconKey[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<BadgeIconKey>();
  return value.reduce<BadgeIconKey[]>((keys, item) => {
    const key = normalizeBadgeIconKey(item);
    if (!key || seen.has(key)) return keys;
    seen.add(key);
    keys.push(key);
    return keys;
  }, []);
}

function normalizeSocials(value: unknown): LiveStudioConfigSocial[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<LiveStudioConfigSocial[]>((items, item) => {
    const source = record(item);
    if (!source) return items;
    const label = cleanString(source.label);
    const value = cleanString(source.value);
    if (!label || !value) return items;
    const icon = isBrandIconKey(source.icon) ? source.icon : undefined;
    const color = cleanString(source.color);
    items.push({
      ...(icon ? { icon } : {}),
      label,
      value,
      ...(color ? { color } : {}),
    });
    return items;
  }, []);
}

function normalizeSections(value: unknown): LiveStudioConfigSection[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<LiveStudioConfigSection[]>((sections, item) => {
    const source = record(item);
    if (!source) return sections;
    const title = cleanString(source.title);
    const bullets = cleanStringArray(source.bullets).slice(0, 6);
    // Bullets are optional: a pure agenda item is a title (+ planned minutes).
    if (!title) return sections;
    const minutes = cleanMinutes(source.minutes);
    sections.push({ title, bullets, ...(minutes !== undefined ? { minutes } : {}) });
    return sections;
  }, []);
}

function normalizeConfig(value: unknown): LiveStudioConfig | null {
  const source = record(value);
  if (!source) return null;
  return {
    version: 1,
    title: cleanString(source.title),
    subtitle: cleanString(source.subtitle),
    author: cleanString(source.author) || undefined,
    profile: normalizeProfile(source.profile),
    cover: normalizeCover(source.cover),
    badges: normalizeBadgeKeys(source.badges),
    stack: cleanStringArray(source.stack).slice(0, 8),
    socials: normalizeSocials(source.socials).slice(0, 8),
    sections: normalizeSections(source.sections).slice(0, 12),
  };
}

function validateOptionalStringArray(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value === "undefined") return;
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array.`);
    return;
  }
  value.forEach((item, index) => {
    if (!cleanString(item)) issues.push(`${path}[${index}] must be a non-empty string.`);
  });
}

function validateProfile(value: unknown, issues: string[]): void {
  if (typeof value === "undefined") return;
  const source = record(value);
  if (!source) {
    issues.push("profile must be an object.");
    return;
  }
  if ("avatarUrl" in source && typeof source.avatarUrl !== "string") {
    issues.push("profile.avatarUrl must be a string.");
  }
  if ("avatarVisible" in source && typeof source.avatarVisible !== "boolean") {
    issues.push("profile.avatarVisible must be a boolean.");
  }
}

function validateCover(value: unknown, issues: string[]): void {
  if (typeof value === "undefined") return;
  const source = record(value);
  if (!source) {
    issues.push("cover must be an object.");
    return;
  }
  if ("visual" in source && !isCoverVisual(source.visual)) {
    issues.push("cover.visual must be avatar, scene, or title.");
  }
  if ("portraitUrl" in source && typeof source.portraitUrl !== "string") {
    issues.push("cover.portraitUrl must be a string.");
  }
  if ("sceneUrl" in source && typeof source.sceneUrl !== "string") {
    issues.push("cover.sceneUrl must be a string.");
  }
}

function validateBadges(value: unknown, issues: string[]): void {
  if (typeof value === "undefined") return;
  if (!Array.isArray(value)) {
    issues.push("badges must be an array.");
    return;
  }
  value.forEach((item, index) => {
    const key = cleanString(item);
    if (!key) {
      issues.push(`badges[${index}] must be a non-empty string.`);
      return;
    }
    if (isGenericBadgePlaceholder(key)) return;
    if (!normalizeBadgeIconKey(key)) {
      issues.push(
        `badges[${index}] is not supported. Allowed badge keys: ${CONFIG_BADGE_ICON_KEY_LIST}. Use exact keys; generic AI/LLM labels are ignored.`,
      );
    }
  });
}

function validateSocials(value: unknown, issues: string[]): void {
  if (typeof value === "undefined") return;
  if (!Array.isArray(value)) {
    issues.push("socials must be an array.");
    return;
  }
  value.forEach((item, index) => {
    const source = record(item);
    if (!source) {
      issues.push(`socials[${index}] must be an object.`);
      return;
    }
    if (!cleanString(source.label)) issues.push(`socials[${index}].label is required.`);
    if (!cleanString(source.value)) issues.push(`socials[${index}].value is required.`);
    if ("icon" in source && source.icon !== undefined && source.icon !== null) {
      const icon = cleanString(source.icon);
      if ((typeof source.icon !== "string" && typeof source.icon !== "undefined") || (icon && !isBrandIconKey(icon))) {
        issues.push(`socials[${index}].icon is not supported.`);
      }
    }
  });
}

function validateSections(value: unknown, issues: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push("sections must include at least one section.");
    return;
  }
  value.forEach((item, index) => {
    const source = record(item);
    if (!source) {
      issues.push(`sections[${index}] must be an object.`);
      return;
    }
    if (!cleanString(source.title)) issues.push(`sections[${index}].title is required.`);
    if ("minutes" in source && source.minutes !== undefined && cleanMinutes(source.minutes) === undefined) {
      issues.push(`sections[${index}].minutes must be a whole number of minutes (1-999).`);
    }
    // Bullets are optional (a pure agenda item is title + minutes); when
    // present they must be an array of strings.
    if ("bullets" in source && source.bullets !== undefined && !Array.isArray(source.bullets)) {
      issues.push(`sections[${index}].bullets must be an array of strings.`);
    }
  });
}

export function validateLiveStudioConfig(input: unknown): LiveStudioConfigValidation {
  const source = record(input);
  const config = normalizeConfig(input);
  const issues: string[] = [];
  if (!source || !config) {
    return { valid: false, issues: ["Config must be a JSON object."] };
  }
  if (source.version !== 1) issues.push("version must be 1.");
  if (!config.title) issues.push("title is required.");
  if (!config.subtitle) issues.push("subtitle is required.");
  validateProfile(source.profile, issues);
  validateCover(source.cover, issues);
  validateBadges(source.badges, issues);
  validateOptionalStringArray(source.stack, "stack", issues);
  validateSocials(source.socials, issues);
  validateSections(source.sections, issues);
  return { valid: issues.length === 0, issues };
}

export function parseLiveStudioConfigJson(input: string): LiveStudioConfig | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!validateLiveStudioConfig(parsed).valid) return null;
    const config = normalizeConfig(parsed);
    if (!config) return null;
    return config;
  } catch {
    return null;
  }
}

/**
 * Resolve an incoming config image against current state: an omitted or
 * privacy-redacted (`__PRIVATE_IMAGE_*__`) value keeps the existing image, so a
 * handoff round-trip that carries placeholders never wipes an uploaded photo.
 */
function resolveConfigImage(incoming: string | undefined, fallback: string): string {
  if (incoming === undefined) return fallback;
  if (isPrivateImageValuePlaceholder(incoming)) return fallback;
  return incoming;
}

function authorToHook(author: string | undefined, fallback: string): string {
  if (!author) return fallback;
  const clean = author.trim();
  if (!clean) return fallback;
  return /^with\s+/i.test(clean) ? clean : `with ${clean}`;
}

function configSocialToState(
  social: LiveStudioConfigSocial,
  fallback?: SocialConfig,
): SocialConfig {
  const privateIndex = privateSocialValuePlaceholderIndex(social.value);
  return {
    visible: true,
    iconKey: social.icon,
    iconMode: "mono",
    label: social.label,
    value: privateIndex === null ? social.value : fallback?.value ?? social.value,
    customColor: social.color ?? "",
  };
}

// Applying a v1 config resets every bar profile to its default set — the
// config carries fresh content, so each layout's bar starts from its baseline.
function liveStudioBottomBarSegments(): OverlayState["bottomBar"]["segments"] {
  return {
    workbench: [{ kind: "live" }, { kind: "progress", sectionIndex: 0 }, { kind: "stack" }],
    lecture: [{ kind: "live" }, { kind: "agenda" }, { kind: "social" }],
    mobile: [{ kind: "live" }, { kind: "agenda" }, { kind: "social" }],
  };
}

export function configToOverlayState(
  state: OverlayState,
  config: LiveStudioConfig,
): OverlayState {
  const sections = config.sections.map((section) => ({
    title: section.title,
    bullets: [...section.bullets],
    ...(section.minutes !== undefined ? { minutes: section.minutes } : {}),
  }));
  const avatarVisible = config.profile?.avatarVisible;

  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      activeSection: 0,
      // Fresh agenda: the section timer restarts on the first drive.
      activeSectionStartedAt: "",
      sections,
      sectionsDone: sections.map((section) => section.bullets.map(() => false)),
    },
    stack: {
      ...state.stack,
      items: config.stack.length > 0
        ? config.stack.map((label) => createStackItem(label))
        : state.stack.items,
    },
    bottomBar: {
      ...state.bottomBar,
      visible: true,
      segments: liveStudioBottomBarSegments(),
    },
    cover: {
      ...state.cover,
      title: config.title || state.cover.title,
      todayTopic: config.subtitle || state.cover.todayTopic,
      hookText: authorToHook(config.author, state.cover.hookText),
      avatarUrl: resolveConfigImage(config.profile?.avatarUrl, state.cover.avatarUrl),
      avatarVisible: typeof avatarVisible === "boolean" ? avatarVisible : state.cover.avatarVisible,
      visual: config.cover?.visual ?? state.cover.visual,
      portraitUrl: resolveConfigImage(config.cover?.portraitUrl, state.cover.portraitUrl),
      sceneUrl: resolveConfigImage(config.cover?.sceneUrl, state.cover.sceneUrl),
      badges: config.badges.map((key) => createBadge(key)),
      socials: config.socials.length > 0
        ? config.socials.map((social, index) => configSocialToState(social, state.cover.socials[index]))
        : state.cover.socials,
    },
    wallpaper: {
      ...state.wallpaper,
      avatarVisible: typeof avatarVisible === "boolean" ? avatarVisible : state.wallpaper.avatarVisible,
    },
  };
}

function hookToAuthor(hook: string): string | undefined {
  const clean = hook.trim();
  if (!clean) return undefined;
  return clean.replace(/^with\s+/i, "").trim() || undefined;
}

function stateSocialToConfig(social: SocialConfig): LiveStudioConfigSocial | null {
  if (!social.visible || !social.label.trim() || !social.value.trim()) return null;
  return {
    ...(social.iconKey ? { icon: social.iconKey } : {}),
    label: social.label.trim(),
    value: social.value.trim(),
    ...(social.customColor ? { color: social.customColor } : {}),
  };
}

export function overlayStateToConfig(state: OverlayState): LiveStudioConfig {
  const badges = state.cover.badges
    .filter((badge) => badge.visible)
    .map((badge) => badge.iconKey)
    .filter(isBadgeIconKey);

  return {
    version: 1,
    title: state.cover.title,
    subtitle: state.cover.todayTopic,
    author: hookToAuthor(state.cover.hookText),
    profile: {
      avatarUrl: state.cover.avatarUrl,
      avatarVisible: state.cover.avatarVisible,
    },
    cover: {
      visual: state.cover.visual,
      portraitUrl: state.cover.portraitUrl,
      sceneUrl: state.cover.sceneUrl,
    },
    badges,
    stack: state.stack.items.map((item) => item.label).filter(Boolean),
    socials: state.cover.socials
      .map(stateSocialToConfig)
      .filter((social): social is LiveStudioConfigSocial => Boolean(social)),
    sections: state.sidebar.sections.map((section) => ({
      title: section.title,
      bullets: [...section.bullets],
      ...(cleanMinutes(section.minutes) !== undefined ? { minutes: cleanMinutes(section.minutes) } : {}),
    })),
  };
}

export function formatLiveStudioConfigJson(config: LiveStudioConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function summarizeLiveStudioConfig(config: LiveStudioConfig): string[] {
  return [
    `${config.sections.length} sections`,
    `${config.stack.length} stack items`,
    `${config.badges.length} badges`,
    `${config.socials.length} socials`,
  ];
}
