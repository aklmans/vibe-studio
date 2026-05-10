import { useEffect, useRef, useState } from "react";
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
 * supported export so users never need to scroll a side panel to find them.
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

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const primaryKind = PRIMARY_KIND[state.activeTab];
  const isLoading = exporting !== null;
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

  const itemStyle = (loading: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 12px",
    background: "transparent",
    border: "none",
    color: loading ? UI_COLORS.textMuted : UI_COLORS.text,
    fontSize: 13,
    fontFamily: "inherit",
    cursor: loading ? "wait" : "pointer",
    textAlign: "left",
  });

  const itemRow = (
    label: string,
    onClick: () => void,
    kind: ExportKind,
    accent: string,
  ) => {
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
        style={itemStyle(loading)}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLElement).style.background = UI_COLORS.panelSurface;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent,
              flexShrink: 0,
            }}
          />
          {label}
        </span>
        {loading && (
          <span style={{ fontSize: 10, color: UI_COLORS.textMuted }}>{t("export.exporting")}</span>
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
        background: UI_COLORS.panelSurface,
        border: `1px solid ${UI_COLORS.controlBorder}`,
        borderRadius: 7,
        overflow: "hidden",
      }}
    >
      <button
        data-testid="btn-export-primary"
        onClick={handlePrimary}
        disabled={isLoading}
        style={{
          padding: "7px 14px",
          background: "transparent",
          border: "none",
          color: isCurrentLoading ? UI_COLORS.textMuted : UI_COLORS.text,
          fontSize: 12,
          fontWeight: 500,
          cursor: isLoading ? "wait" : "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
      >
        {isCurrentLoading ? t("export.exporting") : t(`export.${state.activeTab}`)}
      </button>
      <div style={{ width: 1, background: UI_COLORS.controlBorder, flexShrink: 0 }} />
      <button
        data-testid="btn-export-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "7px 10px",
          background: "transparent",
          border: "none",
          color: UI_COLORS.textSoft,
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        aria-label={t("export.moreOptions")}
      >
        ▾
      </button>
      {open && (
        <div
          data-testid="export-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 220,
            background: UI_COLORS.controlSurface,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            borderRadius: 8,
            padding: "4px 0",
            zIndex: 50,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          }}
        >
          {itemRow(t("export.fullOverlay"), onExportOverlay, "overlay", UI_COLORS.focus)}
          {itemRow(t("export.cover"), onExportCover, "cover", UI_COLORS.danger)}
          {itemRow(t("export.poster"), onExportPoster, "poster", UI_COLORS.purple)}
          {itemRow(
            t("export.wallpaper"),
            onExportWallpaper,
            "wallpaper",
            UI_COLORS.teal,
          )}
          <div
            style={{ height: 1, background: UI_COLORS.panelSurface, margin: "4px 0" }}
            aria-hidden
          />
          {itemRow(t("export.sidebar"), onExportSidebar, "sidebar", UI_COLORS.cyan)}
          {itemRow(
            t("export.bottomBar"),
            onExportBottomBar,
            "bottom-bar",
            UI_COLORS.warm,
          )}
        </div>
      )}
    </div>
  );
}
