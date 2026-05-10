import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { produceState } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
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

const TABS: OverlayState["activeTab"][] = [
  "overlay",
  "cover",
  "poster",
  "wallpaper",
];

/**
 * Top application bar — replaces the legacy 280px left rail's header. Holds
 * brand mark, tab segmented control, primary export action + dropdown, and
 * the settings drawer trigger. Heights and spacing match the Inspector header
 * for visual continuity.
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
        borderBottom: `1px solid ${UI_COLORS.panelSurface}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 16px",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background:
              `linear-gradient(135deg, ${UI_COLORS.brandBlue} 0%, ${UI_COLORS.purple} 50%, ${UI_COLORS.danger} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: UI_COLORS.appSurface,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "-0.02em",
          }}
        >
          V
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: UI_COLORS.text,
            letterSpacing: "0.01em",
          }}
        >
          {t("app.brand")}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          background: UI_COLORS.controlSurface,
          padding: 3,
          borderRadius: 8,
          border: `1px solid ${UI_COLORS.panelSurface}`,
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
                padding: "6px 14px",
                background: active ? UI_COLORS.panelSurface : "transparent",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                color: active ? UI_COLORS.text : UI_COLORS.textMuted,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.02em",
                transition: "all 0.15s",
              }}
            >
              {t(`tab.${tab}`)}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Command palette trigger — discoverable surface for ⌘K */}
      <button
        data-testid="btn-open-cmdk"
        onClick={onOpenCommandPalette}
        title={t("topbar.commandPalette") + " (" + Mod + "K)"}
        aria-label={t("topbar.commandPalette")}
        style={{
          height: 32,
          padding: "0 10px 0 12px",
          borderRadius: 7,
          border: `1px solid ${UI_COLORS.controlBorder}`,
          background: UI_COLORS.controlSurface,
          color: UI_COLORS.textMuted,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = UI_COLORS.controlBorderHover;
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textSoft;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = UI_COLORS.controlBorder;
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textMuted;
        }}
      >
        <span aria-hidden>⌕</span>
        <span>{t("topbar.search")}</span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            padding: "1px 6px",
            borderRadius: 4,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            background: UI_COLORS.appSurface,
            color: UI_COLORS.focus,
            letterSpacing: "0.04em",
          }}
        >
          {Mod}K
        </span>
      </button>

      {/* Settings */}
      <button
        data-testid="btn-open-settings"
        onClick={onOpenSettings}
        title={t("topbar.settings")}
        aria-label={t("topbar.settings")}
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          border: `1px solid ${UI_COLORS.controlBorder}`,
          background: "transparent",
          color: UI_COLORS.textSoft,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = UI_COLORS.panelSurface;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
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
