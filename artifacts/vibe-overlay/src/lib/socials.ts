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

interface BrandPreset {
  label: string;
  style: SocialStyle;
}

const BRAND_PRESETS: Record<
  Exclude<SocialKind, "blog" | "github" | "qq" | "custom">,
  BrandPreset
> = {
  bilibili: {
    label: "B站",
    style: {
      color: "#ffffff",
      background: "#E62117",
      border: "1px solid #E62117",
    },
  },
  x: {
    label: "X",
    style: {
      color: "#ffffff",
      background: "#000000",
      border: "1px solid #1f1f1f",
    },
  },
  youtube: {
    label: "YouTube",
    style: {
      color: "#ffffff",
      background: "#FF0000",
      border: "1px solid #FF0000",
    },
  },
  wechat: {
    label: "微信",
    style: {
      color: "#ffffff",
      background: "#07C160",
      border: "1px solid #07C160",
    },
  },
};

export const SOCIAL_KIND_VALUES: SocialKind[] = [
  "bilibili",
  "blog",
  "github",
  "qq",
  "x",
  "youtube",
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
    case "wechat":
      return t("social.wechat");
    case "custom":
      return "";
  }
}

/**
 * Resolve the visual style for a social label. Token-bound presets (blog /
 * github / qq) follow the active theme so a Neon -> Editorial swap repaints
 * them automatically; brand presets keep their fixed brand color.
 */
export function socialStyle(
  badge: SocialConfig,
  colors: ColorTokens,
): SocialStyle {
  switch (badge.kind) {
    case "bilibili":
    case "x":
    case "youtube":
    case "wechat":
      return BRAND_PRESETS[badge.kind].style;
    case "blog":
      return {
        color: colors.cyanAccent,
        background: `${colors.cyanAccent}18`,
        border: `1px solid ${colors.cyanAccent}40`,
      };
    case "github":
      return {
        color: colors.mutedText,
        background: `${colors.borderColor}15`,
        border: `1px solid ${colors.borderColor}30`,
      };
    case "qq":
      return {
        color: colors.warmAccent,
        background: `${colors.warmAccent}15`,
        border: `1px solid ${colors.warmAccent}35`,
      };
    case "custom": {
      const c = badge.customColor || colors.borderColor;
      return {
        color: c,
        background: `${c}18`,
        border: `1px solid ${c}40`,
      };
    }
  }
}

export function isSocialKind(value: unknown): value is SocialKind {
  return (
    typeof value === "string" && (SOCIAL_KIND_VALUES as string[]).includes(value)
  );
}
