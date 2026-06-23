// App appearance tokens for the editor shell. state.theme currently selects
// app-wide light/dark appearance; state.colors remains the broadcast/export
// asset palette and may be user-customized. If product needs "light app, dark
// export" later, add a separate assetPalette control instead of overloading
// theme.
import { DEFAULT_THEME, type ThemeMode } from "./theme";
import { OVERLAY_STATE_STORAGE_KEY } from "./storage-keys";

type TailwindThemeTokens = {
  background: string;
  foreground: string;
  border: string;
  card: string;
  cardForeground: string;
  cardBorder: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarBorder: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarRing: string;
  popover: string;
  popoverForeground: string;
  popoverBorder: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

export type AppThemeTokens = {
  shellBg: string;
  appSurface: string;
  controlSurface: string;
  hoverSurface: string;
  inputInset: string;
  previewBadgeSurface: string;
  dangerSurface: string;
  border: string;
  rule: string;
  controlBorder: string;
  controlBorderHover: string;
  text: string;
  textSoft: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
  sectionAccent: string;
  sectionAccentAlt: string;
  sectionAccentWarm: string;
  uploadAccent: string;
  previewShadow: string;
  overlayScrim: string;
  commandShadow: string;
  tailwind: TailwindThemeTokens;
};

export const APP_THEME_TOKENS: Record<ThemeMode, AppThemeTokens> = {
  dark: {
    shellBg: "#1a1a1a",
    appSurface: "#20201e",
    controlSurface: "#24231f",
    hoverSurface: "#2c2a24",
    inputInset: "#151412",
    previewBadgeSurface: "#24231f",
    dangerSurface: "#251513",
    border: "#3a3832",
    rule: "#4a463d",
    controlBorder: "#3a3832",
    controlBorderHover: "#4a463d",
    text: "#fafafa",
    textSoft: "#c8c5be",
    textMuted: "#8f8c85",
    textSubtle: "#6b6862",
    accent: "#e8835b",
    accentText: "#ef9a73",
    danger: "#e07070",
    success: "#5ab88a",
    sectionAccent: "#86a39b",
    sectionAccentAlt: "#b59a86",
    sectionAccentWarm: "#e0a766",
    uploadAccent: "#e8835b",
    previewShadow:
      "0 10px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(74,70,61,0.6)",
    overlayScrim: "rgba(0,0,0,0.55)",
    commandShadow: "0 24px 64px rgba(0,0,0,0.6)",
    tailwind: {
      background: "36 6% 10%",
      foreground: "0 0% 98%",
      border: "45 7% 21%",
      card: "48 3% 12%",
      cardForeground: "0 0% 98%",
      cardBorder: "45 7% 21%",
      sidebar: "48 3% 12%",
      sidebarForeground: "0 0% 98%",
      sidebarBorder: "45 7% 21%",
      sidebarPrimary: "17 76% 63%",
      sidebarPrimaryForeground: "36 6% 10%",
      sidebarAccent: "45 7% 16%",
      sidebarAccentForeground: "0 0% 98%",
      sidebarRing: "17 76% 63%",
      popover: "48 3% 12%",
      popoverForeground: "0 0% 98%",
      popoverBorder: "45 7% 21%",
      primary: "17 76% 63%",
      primaryForeground: "36 6% 10%",
      secondary: "45 7% 16%",
      secondaryForeground: "0 0% 98%",
      muted: "45 6% 15%",
      mutedForeground: "42 5% 60%",
      accent: "45 7% 16%",
      accentForeground: "0 0% 98%",
      destructive: "0 64% 66%",
      destructiveForeground: "36 6% 10%",
      input: "45 7% 21%",
      ring: "17 76% 63%",
      chart1: "17 76% 63%",
      chart2: "36 70% 64%",
      chart3: "160 22% 58%",
      chart4: "28 30% 62%",
      chart5: "0 64% 66%",
    },
  },
  light: {
    shellBg: "#f7f4ee",
    appSurface: "#eee8dd",
    controlSurface: "#fbf8f2",
    hoverSurface: "#e5dccf",
    inputInset: "#fffaf2",
    previewBadgeSurface: "#ebe3d6",
    dangerSurface: "#fff0ec",
    border: "#c6c0b6",
    rule: "#a99f91",
    controlBorder: "#c6c0b6",
    controlBorderHover: "#a99f91",
    text: "#1a1a1a",
    textSoft: "#403c36",
    textMuted: "#6c665e",
    textSubtle: "#8b8479",
    accent: "#c95f3d",
    accentText: "#9d432a",
    danger: "#b94f4f",
    success: "#3f8d6a",
    sectionAccent: "#6f8a84",
    sectionAccentAlt: "#9f7663",
    sectionAccentWarm: "#b07f33",
    uploadAccent: "#c95f3d",
    previewShadow:
      "0 12px 34px rgba(58,48,36,0.16), 0 0 0 1px rgba(169,159,145,0.75)",
    overlayScrim: "rgba(26,26,26,0.34)",
    commandShadow: "0 24px 64px rgba(58,48,36,0.24)",
    tailwind: {
      background: "40 36% 95%",
      foreground: "36 6% 10%",
      border: "35 16% 75%",
      card: "39 25% 90%",
      cardForeground: "36 6% 10%",
      cardBorder: "35 16% 75%",
      sidebar: "39 25% 90%",
      sidebarForeground: "36 6% 10%",
      sidebarBorder: "35 16% 75%",
      sidebarPrimary: "15 56% 51%",
      sidebarPrimaryForeground: "40 36% 95%",
      sidebarAccent: "38 24% 89%",
      sidebarAccentForeground: "36 6% 10%",
      sidebarRing: "15 56% 51%",
      popover: "39 25% 90%",
      popoverForeground: "36 6% 10%",
      popoverBorder: "35 16% 75%",
      primary: "15 56% 51%",
      primaryForeground: "40 36% 95%",
      secondary: "38 24% 89%",
      secondaryForeground: "36 6% 10%",
      muted: "38 22% 89%",
      mutedForeground: "35 9% 44%",
      accent: "38 24% 89%",
      accentForeground: "36 6% 10%",
      destructive: "0 43% 52%",
      destructiveForeground: "40 36% 95%",
      input: "35 16% 75%",
      ring: "15 56% 51%",
      chart1: "15 56% 51%",
      chart2: "36 45% 45%",
      chart3: "165 17% 49%",
      chart4: "25 26% 52%",
      chart5: "0 43% 52%",
    },
  },
};

const APP_THEME_VAR_NAMES = {
  shellBg: "--live-shell-bg",
  appSurface: "--live-app-surface",
  controlSurface: "--live-control-surface",
  hoverSurface: "--live-hover-surface",
  inputInset: "--live-input-inset",
  previewBadgeSurface: "--live-preview-badge-surface",
  dangerSurface: "--live-danger-surface",
  border: "--live-border",
  rule: "--live-rule",
  controlBorder: "--live-control-border",
  controlBorderHover: "--live-control-border-hover",
  text: "--live-text",
  textSoft: "--live-text-soft",
  textMuted: "--live-text-muted",
  textSubtle: "--live-text-subtle",
  accent: "--live-accent",
  accentText: "--live-accent-text",
  danger: "--live-danger",
  success: "--live-success",
  sectionAccent: "--live-section-accent",
  sectionAccentAlt: "--live-section-accent-alt",
  sectionAccentWarm: "--live-section-accent-warm",
  uploadAccent: "--live-upload-accent",
  previewShadow: "--live-preview-shadow",
  overlayScrim: "--live-overlay-scrim",
  commandShadow: "--live-command-shadow",
} as const satisfies Record<Exclude<keyof AppThemeTokens, "tailwind">, string>;

const TAILWIND_VAR_NAMES = {
  background: "--background",
  foreground: "--foreground",
  border: "--border",
  card: "--card",
  cardForeground: "--card-foreground",
  cardBorder: "--card-border",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarRing: "--sidebar-ring",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  popoverBorder: "--popover-border",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
} as const satisfies Record<keyof TailwindThemeTokens, string>;

export const APP_THEME_CSS_VARIABLES = Object.fromEntries(
  Object.entries(APP_THEME_VAR_NAMES).map(([key, name]) => [key, `var(${name})`]),
) as Record<Exclude<keyof AppThemeTokens, "tailwind">, string>;

export function getAppThemeTokens(mode: ThemeMode): AppThemeTokens {
  return APP_THEME_TOKENS[mode] ?? APP_THEME_TOKENS[DEFAULT_THEME];
}

export function getAppThemeCssVariables(
  mode: ThemeMode,
): Record<string, string> {
  const tokens = getAppThemeTokens(mode);
  const vars: Record<string, string> = {};

  for (const key of Object.keys(APP_THEME_VAR_NAMES) as Array<
    keyof typeof APP_THEME_VAR_NAMES
  >) {
    vars[APP_THEME_VAR_NAMES[key]] = tokens[key];
  }

  for (const key of Object.keys(TAILWIND_VAR_NAMES) as Array<
    keyof typeof TAILWIND_VAR_NAMES
  >) {
    vars[TAILWIND_VAR_NAMES[key]] = tokens.tailwind[key];
  }

  return vars;
}

interface AppearanceRoot {
  dataset?: Record<string, string | undefined>;
  style: {
    setProperty(name: string, value: string): void;
  };
}

export function applyAppAppearance(
  mode: ThemeMode,
  root?: AppearanceRoot | null,
): void {
  const target =
    root ??
    (typeof document !== "undefined" ? document.documentElement : null);
  if (!target) return;

  if (target.dataset) {
    target.dataset.appearance = mode;
  }

  const cssVars = getAppThemeCssVariables(mode);
  for (const [name, value] of Object.entries(cssVars)) {
    target.style.setProperty(name, value);
  }
}

export function getAppAppearanceBootScript(
  storageKey = OVERLAY_STATE_STORAGE_KEY,
): string {
  const cssVarsByMode = {
    dark: getAppThemeCssVariables("dark"),
    light: getAppThemeCssVariables("light"),
  } satisfies Record<ThemeMode, Record<string, string>>;
  const storageKeyJson = JSON.stringify(storageKey);
  const cssVarsJson = JSON.stringify(cssVarsByMode);

  // The head script must run before the React bundle can import modules, so the
  // layout serializes variables generated from APP_THEME_TOKENS. Tests execute
  // this script and compare every written var with getAppThemeCssVariables().
  return `(function(){
  var varsByMode=${cssVarsJson};
  var appearance="dark";
  try {
    var storage=typeof localStorage==="undefined"?null:localStorage;
    var raw=storage?storage.getItem(${storageKeyJson}):null;
    if (raw) {
      var parsed=JSON.parse(raw);
      var stored=parsed&&parsed.theme;
      if (stored==="light"||stored==="editorial") {
        appearance="light";
      } else if (stored==="dark"||stored==="neon") {
        appearance="dark";
      }
    }
  } catch (error) {
    appearance="dark";
  }
  var root=typeof document==="undefined"?null:document.documentElement;
  if (!root) return;
  root.dataset.appearance=appearance;
  var vars=varsByMode[appearance]||varsByMode.dark;
  for (var name in vars) {
    if (Object.prototype.hasOwnProperty.call(vars,name)) {
      root.style.setProperty(name,vars[name]);
    }
  }
})();`;
}

export function cssAlpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

export const UI_COLORS = {
  ...APP_THEME_CSS_VARIABLES,

  panelSurface: APP_THEME_CSS_VARIABLES.border,
  subtleBorderHover: APP_THEME_CSS_VARIABLES.rule,
  resetBorder: APP_THEME_CSS_VARIABLES.border,
  focus: APP_THEME_CSS_VARIABLES.accent,

  // Deprecated compatibility aliases. New shell code should use sectionAccent,
  // sectionAccentAlt, sectionAccentWarm, or uploadAccent.
  cyan: APP_THEME_CSS_VARIABLES.sectionAccent,
  purple: APP_THEME_CSS_VARIABLES.sectionAccentAlt,
  teal: APP_THEME_CSS_VARIABLES.sectionAccent,
  warm: APP_THEME_CSS_VARIABLES.sectionAccentWarm,
  brandBlue: APP_THEME_CSS_VARIABLES.accentText,
  uploadBlue: APP_THEME_CSS_VARIABLES.uploadAccent,

  // Broadcast constants: retained as real colors for OBS camera chrome and
  // snapshot tests. They are not app-shell appearance tokens.
  appBackground: "#070A12",
  live: "#E62117",
  white: "#fff",
  cameraShell: "#050710",
  cameraStage: "#07090F",
  macRed: "#FF5F57",
  macYellow: "#FEBC2E",
  macGreen: "#28C840",
} as const;

export const UI_BORDERS = {
  panel: `1px solid ${UI_COLORS.border}`,
  control: `1px solid ${UI_COLORS.controlBorder}`,
  hair: `1px solid ${UI_COLORS.border}`,
  danger: `1px solid ${cssAlpha(UI_COLORS.danger, 30)}`,
} as const;
