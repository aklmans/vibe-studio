import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { currentExportKind, currentExportLabelKey, exportForTab } from "../../lib/export-targets";

type ExportKind =
  | "current"
  | "all"
  | "overlay"
  | "cover"
  | "poster"
  | "wallpaper"
  | "sidebar"
  | "bottom-bar";

interface ExportMenuProps {
  state: OverlayState;
  exporting: string | null;
  onExportAll: () => void;
  onExportOverlay: () => void;
  onExportCover: () => void;
  onExportPoster: () => void;
  onExportWallpaper: () => void;
  onExportSidebar: () => void;
  onExportBottomBar: () => void;
}

const PRIMARY_ACTION_WIDTH = 186;

/**
 * Single-button + dropdown export control. Main button always exports the
 * artifact for the current tab; the chevron opens a menu of every other
 * supported export. Editorial language: a quiet topbar text action with a small
 * line icon — no boxed button group, colored dots, or filled accent rows.
 *
 * The dropdown is rendered in a body portal so it escapes ancestor clipping
 * and any sibling stacking context (the inspector rail
 * used to paint over it). It is positioned against the trigger via fixed
 * coordinates and recomputed on open/scroll/resize.
 */
export default function ExportMenu({
  state,
  exporting,
  onExportAll,
  onExportOverlay,
  onExportCover,
  onExportPoster,
  onExportWallpaper,
  onExportSidebar,
  onExportBottomBar,
}: ExportMenuProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );

  const updatePos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 7,
      right: Math.max(0, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReflow = () => updatePos();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, updatePos]);

  const isLoading = exporting !== null;
  const primaryKind = currentExportKind(state.activeTab);
  const isCurrentLoading = exporting === primaryKind;

  const handlePrimary = exportForTab(state.activeTab, {
    onExportOverlay,
    onExportCover,
    onExportPoster,
    onExportWallpaper,
  });

  const itemRow = (label: string, onClick: () => void, kind: ExportKind) => {
    const loading = exporting === kind;
    return (
      <button
        key={kind}
        data-testid={`export-menu-${kind}`}
        onClick={() => {
          if (isLoading) return;
          setOpen(false);
          onClick();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "7px 14px",
          background: "transparent",
          border: "none",
          color: loading ? UI_COLORS.textMuted : UI_COLORS.textSoft,
          fontFamily: "var(--app-font-mono)",
          fontSize: 12,
          letterSpacing: "0.01em",
          cursor: loading ? "wait" : "pointer",
          textAlign: "left",
          transition: "background 0.12s, color 0.12s",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLElement).style.background =
              UI_COLORS.hoverSurface;
            (e.currentTarget as HTMLElement).style.color = UI_COLORS.text;
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          if (!loading)
            (e.currentTarget as HTMLElement).style.color = UI_COLORS.textSoft;
        }}
      >
        <span>{label}</span>
        {loading && (
          <span style={{ fontSize: 10, color: UI_COLORS.textMuted }}>
            {t("export.exporting")}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        color: UI_COLORS.textSubtle,
        fontFamily: "var(--app-font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <button
        data-testid="btn-export-primary"
        onClick={handlePrimary}
        disabled={isLoading}
        style={{
          width: PRIMARY_ACTION_WIDTH,
          flex: `0 0 ${PRIMARY_ACTION_WIDTH}px`,
          minHeight: 28,
          padding: 0,
          background: "transparent",
          border: "none",
          color: isCurrentLoading ? UI_COLORS.textMuted : "inherit",
          fontFamily: "var(--app-font-mono)",
          fontSize: 11,
          fontWeight: 600,
          cursor: isLoading ? "wait" : "pointer",
          letterSpacing: "0.18em",
          textAlign: "right",
          textTransform: "uppercase",
          transition: "color 0.2s ease, transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isLoading)
            (e.currentTarget as HTMLElement).style.color =
              UI_COLORS.accentText;
        }}
        onMouseLeave={(e) => {
          if (!isCurrentLoading)
            (e.currentTarget as HTMLElement).style.color = "inherit";
        }}
      >
        {isCurrentLoading ? t("export.exporting") : t(currentExportLabelKey(state.activeTab))}
      </button>
      <button
        data-testid="btn-export-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        style={{
          minWidth: 22,
          minHeight: 28,
          padding: 0,
          background: "transparent",
          border: "none",
          color: "inherit",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "var(--app-font-mono)",
          lineHeight: 1,
          transition: "color 0.2s ease, transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.accentText;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "inherit";
        }}
        aria-label={t("export.moreOptions")}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            data-testid="export-menu"
            style={{
              position: "fixed",
              top: menuPos.top,
              right: menuPos.right,
              minWidth: 224,
              background: UI_COLORS.appSurface,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 0,
              padding: "5px 0",
              zIndex: 50,
              boxShadow: UI_COLORS.commandShadow,
            }}
          >
            {itemRow(t("export.all"), onExportAll, "all")}
            <div
              style={{
                height: 1,
                background: UI_COLORS.border,
                margin: "5px 0",
              }}
              aria-hidden
            />
            {itemRow(t("export.fullOverlay"), onExportOverlay, "overlay")}
            {itemRow(t("export.cover"), onExportCover, "cover")}
            {itemRow(t("export.poster"), onExportPoster, "poster")}
            {itemRow(t("export.wallpaper"), onExportWallpaper, "wallpaper")}
            <div
              style={{
                height: 1,
                background: UI_COLORS.border,
                margin: "5px 0",
              }}
              aria-hidden
            />
            {itemRow(t("export.sidebar"), onExportSidebar, "sidebar")}
            {itemRow(t("export.bottomBar"), onExportBottomBar, "bottom-bar")}
          </div>,
          document.body,
        )}
    </div>
  );
}
