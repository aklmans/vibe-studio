import type { CSSProperties } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { produceState } from "../../lib/state";
import { THEME_PRESETS, type ThemeMode } from "../../lib/theme";
import { useLocale } from "../../hooks/useLocale";
import type { Locale } from "../../lib/i18n";
import { APP_TABS } from "../../lib/tabs";
import ExportMenu from "./ExportMenu";

interface TopBarProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  exporting: string | null;
  onExportAll: () => void;
  onExportOverlay: () => void;
  onExportSidebar: () => void;
  onExportBottomBar: () => void;
  onExportCover: () => void;
  onExportPoster: () => void;
  onExportWallpaper: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
}

const TABS = APP_TABS;
const TAB_WIDTHS: Record<(typeof TABS)[number], number> = {
  overlay: 88,
  live: 98,
  cover: 72,
  poster: 74,
  wallpaper: 104,
};

const headerToolsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 16,
  flexShrink: 0,
  color: UI_COLORS.textSubtle,
  fontFamily: "var(--app-font-mono)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const toolButtonStyle: CSSProperties = {
  position: "relative",
  minWidth: 28,
  minHeight: 28,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--app-font-mono)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  lineHeight: 1,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  transition: "color 0.2s ease, transform 0.2s ease",
};

const searchButtonStyle: CSSProperties = {
  ...toolButtonStyle,
  minWidth: 22,
  minHeight: 22,
  letterSpacing: "0.12em",
};

const languageButtonStyle: CSSProperties = {
  ...toolButtonStyle,
  width: 42,
  flex: "0 0 42px",
};

const iconStyle: CSSProperties = {
  width: 16,
  height: 16,
  flex: "0 0 auto",
  strokeWidth: 1.9,
};

const kbdStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "currentColor",
  font: "inherit",
  letterSpacing: "0.1em",
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden style={iconStyle}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden style={{ ...iconStyle, width: 18, height: 18 }}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ ...iconStyle, width: 18, height: 18 }}
    >
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden style={{ ...iconStyle, width: 18, height: 18 }}>
      <path d="M20.5 14.5A7.5 7.5 0 0 1 9.5 3.5a8 8 0 1 0 11 11Z" />
    </svg>
  );
}

/**
 * Top application bar. Editorial shell header: a serif text wordmark (no logo
 * mark), hairline-underline tabs with mono labels, and a single quiet button
 * language shared by the command-palette trigger, settings, and export
 * controls. Height and the bottom hairline match the inspector header.
 */
export default function TopBar({
  state,
  onChange,
  exporting,
  onExportAll,
  onExportOverlay,
  onExportSidebar,
  onExportBottomBar,
  onExportCover,
  onExportPoster,
  onExportWallpaper,
  onOpenSettings,
  onOpenCommandPalette,
}: TopBarProps) {
  const { t, locale, setLocale } = useLocale();
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const Mod = isMac ? "⌘" : "Ctrl";
  const nextTheme: ThemeMode = state.theme === "dark" ? "light" : "dark";
  const nextLocale: Locale = locale === "zh" ? "en" : "zh";
  const languageLabel = locale === "zh" ? "EN" : "中文";

  const applyTheme = (mode: ThemeMode) => {
    onChange(
      produceState(state, (draft) => {
        draft.theme = mode;
        draft.colors = { ...THEME_PRESETS[mode] };
      }),
    );
  };

  const enterTool = (el: HTMLElement) => {
    el.style.color = UI_COLORS.accentText;
  };
  const leaveTool = (el: HTMLElement) => {
    el.style.color = "inherit";
  };

  return (
    <header
      data-testid="topbar"
      style={{
        height: 56,
        flexShrink: 0,
        background: UI_COLORS.appSurface,
        borderBottom: `1px solid ${UI_COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 18px",
      }}
    >
      {/* Brand — serif text wordmark with a small accent mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--app-font-serif)",
            fontSize: 16,
            fontWeight: 600,
            color: UI_COLORS.text,
            letterSpacing: "0.01em",
          }}
        >
          {t("app.brand")}
        </span>
        <span
          aria-hidden
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: UI_COLORS.accent,
          }}
        />
      </div>

      {/* Tabs — editorial hairline underline, mono labels */}
      <nav
        style={{
          display: "flex",
          alignSelf: "stretch",
          alignItems: "stretch",
          gap: 2,
        }}
      >
        {TABS.map((tab) => {
          const active = state.activeTab === tab;
          return (
            <button
              key={tab}
              data-testid={`tab-${tab}`}
              onClick={() =>
                onChange(
                  produceState(state, (draft) => {
                    draft.activeTab = tab;
                  }),
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: TAB_WIDTHS[tab],
                flex: `0 0 ${TAB_WIDTHS[tab]}px`,
                padding: "0 10px",
                marginBottom: -1,
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${active ? UI_COLORS.accent : "transparent"}`,
                fontFamily: "var(--app-font-mono)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: active ? UI_COLORS.accentText : UI_COLORS.textMuted,
                cursor: "pointer",
                transition: "color 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.color =
                    UI_COLORS.accentText;
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.color =
                    UI_COLORS.textMuted;
              }}
            >
              {t(`tab.${tab}`)}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div data-testid="topbar-tools" aria-label={t("topbar.quickTools")} style={headerToolsStyle}>
        <button
          data-testid="btn-open-cmdk"
          onClick={onOpenCommandPalette}
          title={t("topbar.commandPalette") + " (" + Mod + "K)"}
          aria-label={t("topbar.commandPalette")}
          aria-keyshortcuts="Meta+K Control+K"
          style={searchButtonStyle}
          onMouseEnter={(e) => enterTool(e.currentTarget)}
          onMouseLeave={(e) => leaveTool(e.currentTarget)}
        >
          <SearchIcon />
          <kbd aria-hidden style={kbdStyle}>
            {Mod}K
          </kbd>
        </button>

        <button
          data-testid="btn-toggle-locale"
          onClick={() => setLocale(nextLocale)}
          title={nextLocale === "en" ? t("cmdk.locale.en") : t("cmdk.locale.zh")}
          aria-label={nextLocale === "en" ? t("cmdk.locale.en") : t("cmdk.locale.zh")}
          style={languageButtonStyle}
          onMouseEnter={(e) => enterTool(e.currentTarget)}
          onMouseLeave={(e) => leaveTool(e.currentTarget)}
        >
          {languageLabel}
        </button>

        <button
          data-testid="btn-toggle-theme"
          onClick={() => applyTheme(nextTheme)}
          title={state.theme === "dark" ? t("theme.light") : t("theme.dark")}
          aria-label={t("topbar.themeToggle")}
          aria-pressed={state.theme === "dark"}
          data-theme={state.theme}
          style={toolButtonStyle}
          onMouseEnter={(e) => enterTool(e.currentTarget)}
          onMouseLeave={(e) => leaveTool(e.currentTarget)}
        >
          {state.theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </button>

        <button
          data-testid="btn-open-settings"
          onClick={onOpenSettings}
          title={t("topbar.settings")}
          aria-label={t("topbar.settings")}
          style={toolButtonStyle}
          onMouseEnter={(e) => enterTool(e.currentTarget)}
          onMouseLeave={(e) => leaveTool(e.currentTarget)}
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Export */}
      <ExportMenu
        state={state}
        exporting={exporting}
        onExportAll={onExportAll}
        onExportOverlay={onExportOverlay}
        onExportCover={onExportCover}
        onExportPoster={onExportPoster}
        onExportWallpaper={onExportWallpaper}
        onExportSidebar={onExportSidebar}
        onExportBottomBar={onExportBottomBar}
      />
    </header>
  );
}
