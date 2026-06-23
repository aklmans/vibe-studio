import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { produceState } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import { APP_TABS } from "../../lib/tabs";
import ExportMenu from "./ExportMenu";

interface TopBarProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  exporting: string | null;
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
  onExportOverlay,
  onExportSidebar,
  onExportBottomBar,
  onExportCover,
  onExportPoster,
  onExportWallpaper,
  onOpenSettings,
  onOpenCommandPalette,
}: TopBarProps) {
  const { t } = useLocale();
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const Mod = isMac ? "⌘" : "Ctrl";
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
                color: active ? UI_COLORS.text : UI_COLORS.textMuted,
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

      {/* Command palette trigger — discoverable surface for ⌘K */}
      <button
        data-testid="btn-open-cmdk"
        onClick={onOpenCommandPalette}
        title={t("topbar.commandPalette") + " (" + Mod + "K)"}
        aria-label={t("topbar.commandPalette")}
        style={{
          height: 32,
          padding: "0 9px 0 11px",
          borderRadius: 6,
          border: `1px solid ${UI_COLORS.controlBorder}`,
          background: "transparent",
          color: UI_COLORS.textMuted,
          cursor: "pointer",
          fontFamily: "var(--app-font-mono)",
          fontSize: 11,
          letterSpacing: "0.02em",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          transition: "color 0.12s, border-color 0.12s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = UI_COLORS.rule;
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textSoft;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            UI_COLORS.controlBorder;
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textMuted;
        }}
      >
        <span aria-hidden style={{ fontSize: 13 }}>
          ⌕
        </span>
        <span>{t("topbar.search")}</span>
        <span
          style={{
            fontFamily: "var(--app-font-mono)",
            fontSize: 10,
            padding: "1px 5px",
            borderRadius: 3,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            background: UI_COLORS.inputInset,
            color: UI_COLORS.accentText,
            letterSpacing: "0.04em",
          }}
        >
          {Mod}K
        </span>
      </button>

      {/* Settings — same quiet button language */}
      <button
        data-testid="btn-open-settings"
        onClick={onOpenSettings}
        title={t("topbar.settings")}
        aria-label={t("topbar.settings")}
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          border: `1px solid ${UI_COLORS.controlBorder}`,
          background: "transparent",
          color: UI_COLORS.textMuted,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "color 0.12s, border-color 0.12s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = UI_COLORS.rule;
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textSoft;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            UI_COLORS.controlBorder;
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textMuted;
        }}
      >
        ⚙
      </button>

      {/* Export */}
      <ExportMenu
        state={state}
        exporting={exporting}
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
