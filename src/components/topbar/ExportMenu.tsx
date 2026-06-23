import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";

type ExportKind =
  | "current"
  | "overlay"
  | "cover"
  | "poster"
  | "wallpaper"
  | "sidebar"
  | "bottom-bar";

interface ExportMenuProps {
  state: OverlayState;
  exporting: string | null;
  onExportOverlay: () => void;
  onExportCover: () => void;
  onExportPoster: () => void;
  onExportWallpaper: () => void;
  onExportSidebar: () => void;
  onExportBottomBar: () => void;
}

const PRIMARY_KIND: Record<OverlayState["activeTab"], ExportKind> = {
  overlay: "overlay",
  live: "overlay",
  cover: "cover",
  poster: "poster",
  wallpaper: "wallpaper",
};

/**
 * Single-button + dropdown export control. Main button always exports the
 * artifact for the current tab; the chevron opens a menu of every other
 * supported export. Editorial language: a quiet bordered button group with mono
 * export names and thin separators — no colored dots or filled accent rows.
 *
 * The dropdown is rendered in a body portal so it escapes the button group's
 * `overflow: hidden` clip and any sibling stacking context (the inspector rail
 * used to paint over it). It is positioned against the trigger via fixed
 * coordinates and recomputed on open/scroll/resize.
 */
export default function ExportMenu({
  state,
  exporting,
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
  const primaryKind = PRIMARY_KIND[state.activeTab];
  const isCurrentLoading =
    exporting === primaryKind ||
    (primaryKind === "wallpaper" && exporting === "wallpaper");

  const handlePrimary = () => {
    switch (state.activeTab) {
      case "overlay":
      case "live":
        onExportOverlay();
        break;
      case "cover":
        onExportCover();
        break;
      case "poster":
        onExportPoster();
        break;
      case "wallpaper":
        onExportWallpaper();
        break;
    }
  };

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
        display: "flex",
        alignItems: "stretch",
        background: UI_COLORS.controlSurface,
        border: `1px solid ${UI_COLORS.controlBorder}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <button
        data-testid="btn-export-primary"
        onClick={handlePrimary}
        disabled={isLoading}
        style={{
          padding: "7px 15px",
          background: "transparent",
          border: "none",
          color: isCurrentLoading ? UI_COLORS.textMuted : UI_COLORS.text,
          fontFamily: "var(--app-font-mono)",
          fontSize: 11,
          fontWeight: 500,
          cursor: isLoading ? "wait" : "pointer",
          letterSpacing: "0.04em",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => {
          if (!isLoading)
            (e.currentTarget as HTMLElement).style.background =
              UI_COLORS.hoverSurface;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        {isCurrentLoading
          ? t("export.exporting")
          : t(
              state.activeTab === "live"
                ? "export.overlay"
                : `export.${state.activeTab}`,
            )}
      </button>
      <div style={{ width: 1, background: UI_COLORS.border, flexShrink: 0 }} />
      <button
        data-testid="btn-export-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "7px 10px",
          background: "transparent",
          border: "none",
          color: UI_COLORS.textMuted,
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "color 0.12s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textSoft;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = UI_COLORS.textMuted;
        }}
        aria-label={t("export.moreOptions")}
      >
        ▾
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
              borderRadius: 4,
              padding: "5px 0",
              zIndex: 50,
              boxShadow: UI_COLORS.commandShadow,
            }}
          >
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
