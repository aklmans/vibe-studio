import { useEffect, useRef, useState } from "react";
import type { OverlayState } from "../../types";
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
    color: loading ? "#6B7CA8" : "#F4F7FF",
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
          if (!loading) (e.currentTarget as HTMLElement).style.background = "#1F2235";
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
          <span style={{ fontSize: 10, color: "#6B7CA8" }}>{t("export.exporting")}</span>
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
        background: "#1F2235",
        border: "1px solid #2a3060",
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
          color: isCurrentLoading ? "#6B7CA8" : "#F4F7FF",
          fontSize: 12,
          fontWeight: 500,
          cursor: isLoading ? "wait" : "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
      >
        {isCurrentLoading ? t("export.exporting") : t(`export.${state.activeTab}`)}
      </button>
      <div style={{ width: 1, background: "#2a3060", flexShrink: 0 }} />
      <button
        data-testid="btn-export-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "7px 10px",
          background: "transparent",
          border: "none",
          color: "#C7D2FE",
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
            background: "#0F1122",
            border: "1px solid #2a3060",
            borderRadius: 8,
            padding: "4px 0",
            zIndex: 50,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          }}
        >
          {itemRow(t("export.fullOverlay"), onExportOverlay, "overlay", "#8DA8FF")}
          {itemRow(t("export.cover"), onExportCover, "cover", "#FF6FAE")}
          {itemRow(t("export.poster"), onExportPoster, "poster", "#C084FC")}
          {itemRow(
            t("export.wallpaper"),
            onExportWallpaper,
            "wallpaper",
            "#5EEAD4",
          )}
          <div
            style={{ height: 1, background: "#1F2235", margin: "4px 0" }}
            aria-hidden
          />
          {itemRow(t("export.sidebar"), onExportSidebar, "sidebar", "#7DD3FC")}
          {itemRow(
            t("export.bottomBar"),
            onExportBottomBar,
            "bottom-bar",
            "#FFB86B",
          )}
        </div>
      )}
    </div>
  );
}
