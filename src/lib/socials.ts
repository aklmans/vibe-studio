// Social link presets shown in Sidebar / Overlay sidebar / Poster footer.
// Each preset hard-codes the visual treatment (background + border + text)
// so styling stays consistent regardless of which canvas renders it.
//
// "kind: 'custom'" lets the user invent their own label and color when none
// of the presets match the platform they want to show.

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
  kind: SocialKind;
  label: string;
  value: string;
  customColor: string;
}

export interface SocialStyle {
  color: string;
  background: string;
  border: string;
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

export function getSocialKindOptions(locale: Locale): { value: SocialKind; label: string }[] {
  const t = (key: string) => dict[locale][key as keyof typeof dict.zh] ?? key;
  return [
    { value: "bilibili", label: t("social.bilibili") },
    { value: "blog", label: t("social.blog") },
    { value: "github", label: t("social.github") },
    { value: "qq", label: t("social.qq") },
    { value: "x", label: t("social.x") },
    { value: "youtube", label: t("social.youtube") },
    { value: "discord", label: t("social.discord") },
    { value: "wechat", label: t("social.wechat") },
    { value: "custom", label: t("social.custom") },
  ];
}

export function defaultSocialLabel(kind: SocialKind, locale: Locale = "zh"): string {
  const t = (key: string) => dict[locale][key as keyof typeof dict.zh] ?? key;
  switch (kind) {
    case "bilibili":
      return t("social.bilibili");
    case "blog":
      return t("social.blog");
    case "github":
      return t("social.github");
    case "qq":
      return t("social.qq");
    case "x":
      return t("social.x");
    case "youtube":
      return t("social.youtube");
    case "discord":
      return t("social.discord");
    case "wechat":
      return t("social.wechat");
    case "custom":
      return "";
  }
}

/**
 * Resolve the visual style for a social label. Editorial direction (Phase 2):
 * social links read as quiet metadata, not colored platform tags. Every preset
 * uses the same theme-derived hairline chip — the label text carries the brand
 * — so the footer stays calm and repaints correctly between Light and Dark. A
 * custom link may keep a restrained outline in the user's chosen color.
 */
export function socialStyle(
  badge: SocialConfig,
  colors: ColorTokens,
): SocialStyle {
  if (badge.kind === "custom" && badge.customColor) {
    return {
      color: badge.customColor,
      background: "transparent",
      border: `1px solid ${badge.customColor}66`,
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
