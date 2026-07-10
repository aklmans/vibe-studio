import type { OverlayState } from "../types";
import type { SocialConfig } from "./socials";
import { DARK_PRESET, type ColorTokens, type ThemeMode } from "./theme";

export const STUDIO_PROFILE_STORAGE_KEY = "vibe-studio-profile";

/**
 * The reusable **Brand layer** — the identity + look a host sets once and reuses
 * every stream: author, avatar, socials, and (v2+) the theme + color palette.
 * It is persisted separately from per-stream content, re-applied on load/reset,
 * and never touched by the AI agent. Write once, use many; cleared only on an
 * explicit reset.
 */
export interface StudioProfile {
  /** v1 = identity; v2 adds the palette; v3 adds the lecture header + presenter. */
  version: 1 | 2 | 3;
  author: string;
  avatarUrl: string;
  avatarVisible: boolean;
  socialVisible: boolean;
  socials: SocialConfig[];
  /** Brand palette (v2+). Optional so legacy v1 profiles still load. */
  theme?: ThemeMode;
  colors?: ColorTokens;
  /** Lecture header + presenter card (v3+). Optional for v1/v2 profiles. */
  logoUrl?: string;
  seriesName?: string;
  presenterLines?: string[];
}

const COLOR_TOKEN_KEYS = Object.keys(DARK_PRESET) as (keyof ColorTokens)[];

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "dark" || value === "light";
}

function isColorTokens(value: unknown): value is ColorTokens {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return COLOR_TOKEN_KEYS.every((key) => typeof record[key] === "string");
}

function cloneColors(colors: ColorTokens): ColorTokens {
  return { ...colors };
}

type ProfileStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storageOrWindow(storage?: ProfileStorage): ProfileStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function cloneSocial(social: SocialConfig): SocialConfig {
  return {
    visible: Boolean(social.visible),
    iconKey: social.iconKey,
    iconMode: social.iconMode === "brand" ? "brand" : "mono",
    label: typeof social.label === "string" ? social.label : "",
    value: typeof social.value === "string" ? social.value : "",
    customColor: typeof social.customColor === "string" ? social.customColor : "",
  };
}

function isSocialConfig(value: unknown): value is SocialConfig {
  if (!value || typeof value !== "object") return false;
  const social = value as Partial<SocialConfig>;
  return (
    typeof social.visible === "boolean" &&
    (social.iconKey === undefined || typeof social.iconKey === "string") &&
    (social.iconMode === "mono" || social.iconMode === "brand") &&
    typeof social.label === "string" &&
    typeof social.value === "string" &&
    typeof social.customColor === "string"
  );
}

function isTextLines(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((line) => typeof line === "string");
}

function normalizeProfile(value: unknown): StudioProfile | null {
  if (!value || typeof value !== "object") return null;
  const profile = value as Partial<StudioProfile>;
  if (profile.version !== 1 && profile.version !== 2 && profile.version !== 3) return null;
  if (typeof profile.author !== "string") return null;
  if (typeof profile.avatarUrl !== "string") return null;
  if (typeof profile.avatarVisible !== "boolean") return null;
  if (typeof profile.socialVisible !== "boolean") return null;
  if (!Array.isArray(profile.socials) || !profile.socials.every(isSocialConfig)) return null;
  // Always normalize forward to v3. Optional groups are included only when a
  // saved profile actually carries them, so legacy v1/v2 profiles simply omit.
  const normalized: StudioProfile = {
    version: 3,
    author: profile.author,
    avatarUrl: profile.avatarUrl,
    avatarVisible: profile.avatarVisible,
    socialVisible: profile.socialVisible,
    socials: profile.socials.map(cloneSocial),
  };
  if (isThemeMode(profile.theme)) normalized.theme = profile.theme;
  if (isColorTokens(profile.colors)) normalized.colors = cloneColors(profile.colors);
  if (typeof profile.logoUrl === "string") normalized.logoUrl = profile.logoUrl;
  if (typeof profile.seriesName === "string") normalized.seriesName = profile.seriesName;
  if (isTextLines(profile.presenterLines)) {
    normalized.presenterLines = [...profile.presenterLines];
  }
  return normalized;
}

export function loadStudioProfile(storage?: ProfileStorage): StudioProfile | null {
  const target = storageOrWindow(storage);
  if (!target) return null;
  try {
    const raw = target.getItem(STUDIO_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStudioProfile(profile: StudioProfile, storage?: ProfileStorage): void {
  const target = storageOrWindow(storage);
  if (!target) return;
  const normalized = normalizeProfile(profile);
  if (!normalized) return;
  target.setItem(STUDIO_PROFILE_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearStudioProfile(storage?: ProfileStorage): void {
  storageOrWindow(storage)?.removeItem(STUDIO_PROFILE_STORAGE_KEY);
}

function authorFromHookText(hookText: string): string {
  return hookText.replace(/^with\s+/i, "").trim();
}

function hookTextFromAuthor(author: string): string {
  const trimmed = author.trim();
  return trimmed ? `with ${trimmed}` : "";
}

export function profileFromState(state: OverlayState): StudioProfile {
  return {
    version: 3,
    author: authorFromHookText(state.cover.hookText),
    avatarUrl: state.cover.avatarUrl,
    avatarVisible: state.cover.avatarVisible,
    socialVisible: state.cover.socialVisible,
    socials: state.cover.socials.map(cloneSocial),
    theme: state.theme,
    colors: cloneColors(state.colors),
    logoUrl: state.brand.logoUrl,
    seriesName: state.brand.seriesName,
    presenterLines: [...state.brand.presenterLines],
  };
}

export function applyStudioProfileToState(
  state: OverlayState,
  profile: StudioProfile | null,
): OverlayState {
  if (!profile) return state;
  const normalized = normalizeProfile(profile);
  if (!normalized) return state;
  return {
    ...state,
    // Optional groups are applied only when the profile carries them, so a
    // legacy identity-only profile leaves theme/colors and brand untouched.
    ...(normalized.theme ? { theme: normalized.theme } : {}),
    ...(normalized.colors ? { colors: cloneColors(normalized.colors) } : {}),
    brand: {
      logoUrl: normalized.logoUrl ?? state.brand.logoUrl,
      seriesName: normalized.seriesName ?? state.brand.seriesName,
      presenterLines: normalized.presenterLines
        ? [...normalized.presenterLines]
        : [...state.brand.presenterLines],
    },
    cover: {
      ...state.cover,
      avatarUrl: normalized.avatarUrl,
      avatarVisible: normalized.avatarVisible,
      hookText: hookTextFromAuthor(normalized.author),
      socialVisible: normalized.socialVisible,
      socials: normalized.socials.map(cloneSocial),
    },
    wallpaper: {
      ...state.wallpaper,
      avatarVisible: normalized.avatarVisible,
      socialVisible: normalized.socialVisible,
    },
  };
}
