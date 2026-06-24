// Social link model shown in Sidebar / Overlay sidebar / Poster footer.
// Current model is icon-backed: each row owns an optional registry icon plus
// the user's label/value. Legacy `kind` values are accepted only as migration
// input so older localStorage/session recipes keep working.

import {
  BRAND_ICON_REGISTRY,
  searchBrandIcons,
  type BrandIconKey,
  type BrandIconMeta,
  type BrandIconMode,
} from "./brand-icons";
import type { Locale } from "./i18n";
import { dict } from "./i18n";
import type { ColorTokens } from "./theme";

export type SocialKind =
  | "bilibili"
  | "blog"
  | "github"
  | "qq"
  | "x"
  | "youtube"
  | "discord"
  | "wechat"
  | "custom";

export interface SocialConfig {
  visible: boolean;
  iconKey?: BrandIconKey;
  iconMode: BrandIconMode;
  label: string;
  value: string;
  customColor: string;
}

export interface SocialStyle {
  color: string;
  background: string;
  border: string;
}

export interface SocialIconOption {
  iconKey: BrandIconKey;
  label: string;
}

export function compactSocialValue(value: string, maxLength = 46): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const compact = trimmed
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/i, "");

  if (compact.length <= maxLength) return compact;

  const available = Math.max(8, maxLength - 1);
  const headLength = Math.ceil(available * 0.58);
  const tailLength = available - headLength;
  return `${compact.slice(0, headLength)}…${compact.slice(-tailLength)}`;
}

export const SOCIAL_KIND_VALUES: SocialKind[] = [
  "bilibili",
  "blog",
  "github",
  "qq",
  "x",
  "youtube",
  "discord",
  "wechat",
  "custom",
];

export const LEGACY_SOCIAL_KIND_TO_ICON_KEY: Record<Exclude<SocialKind, "custom">, BrandIconKey> = {
  bilibili: "bilibili",
  blog: "website",
  github: "github",
  qq: "qq",
  x: "x",
  youtube: "youtube",
  discord: "discord",
  wechat: "wechat",
};

const SOCIAL_ICON_KEYS: BrandIconKey[] = [
  "youtube",
  "bilibili",
  "website",
  "github",
  "qq",
  "wechat",
  "x",
  "discord",
  "telegram",
];

function t(locale: Locale, key: string): string {
  return dict[locale][key as keyof typeof dict.zh] ?? key;
}

export function socialIconLabel(iconKey: BrandIconKey, locale: Locale = "zh"): string {
  switch (iconKey) {
    case "bilibili":
      return t(locale, "social.bilibili");
    case "website":
      return t(locale, "social.blog");
    case "github":
      return t(locale, "social.github");
    case "qq":
      return t(locale, "social.qq");
    case "x":
      return t(locale, "social.x");
    case "youtube":
      return t(locale, "social.youtube");
    case "discord":
      return t(locale, "social.discord");
    case "wechat":
      return t(locale, "social.wechat");
    default:
      return BRAND_ICON_REGISTRY[iconKey].label;
  }
}

export function socialIconKeyFromKind(kind: SocialKind): BrandIconKey | undefined {
  return kind === "custom" ? undefined : LEGACY_SOCIAL_KIND_TO_ICON_KEY[kind];
}

export function getSocialIconOptions(locale: Locale): SocialIconOption[] {
  return SOCIAL_ICON_KEYS.map((iconKey) => ({
    iconKey,
    label: socialIconLabel(iconKey, locale),
  }));
}

function optionFromMeta(meta: BrandIconMeta, locale: Locale): SocialIconOption {
  return {
    iconKey: meta.iconKey,
    label: socialIconLabel(meta.iconKey, locale),
  };
}

export function searchSocialIconOptions(
  query: string,
  locale: Locale,
): SocialIconOption[] {
  const normalized = query.trim().toLowerCase();
  const common = getSocialIconOptions(locale);
  const source = normalized
    ? searchBrandIcons(query).filter((meta) =>
        meta.category === "social" || meta.category === "streaming" || meta.iconKey === "github",
      ).map((meta) => optionFromMeta(meta, locale))
    : common;

  const merged = [...common, ...source];
  const seen = new Set<BrandIconKey>();
  return merged.filter((option) => {
    const haystack = `${option.iconKey} ${option.label}`.toLowerCase();
    if (normalized && !haystack.includes(normalized)) {
      const meta = BRAND_ICON_REGISTRY[option.iconKey];
      const aliasText = meta.aliases.join(" ").toLowerCase();
      if (!aliasText.includes(normalized)) return false;
    }
    if (seen.has(option.iconKey)) return false;
    seen.add(option.iconKey);
    return true;
  });
}

export function defaultSocialLabel(kind: SocialKind, locale: Locale = "zh"): string {
  const iconKey = socialIconKeyFromKind(kind);
  return iconKey ? socialIconLabel(iconKey, locale) : "";
}

/**
 * Resolve the quiet label style for a social row. Editorial direction: social
 * links read as metadata, not filled platform tags. A custom link may keep a
 * restrained outline in the user's chosen color.
 */
export function socialStyle(
  social: SocialConfig,
  colors: ColorTokens,
): SocialStyle {
  if (!social.iconKey && social.customColor) {
    return {
      color: social.customColor,
      background: "transparent",
      border: `1px solid ${social.customColor}66`,
    };
  }
  return {
    color: colors.subtleText,
    background: "transparent",
    border: `1px solid ${colors.borderColor}66`,
  };
}

export function isSocialKind(value: unknown): value is SocialKind {
  return (
    typeof value === "string" && (SOCIAL_KIND_VALUES as string[]).includes(value)
  );
}
