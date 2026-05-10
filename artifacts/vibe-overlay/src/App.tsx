import { useState, useRef, useCallback, useEffect } from "react";
import { DEFAULT_STATE_BY_LOCALE, type OverlayState } from "./types";
import OverlayCanvas from "./components/OverlayCanvas";
import CoverCanvas from "./components/CoverCanvas";
import PosterCanvas from "./components/PosterCanvas";
import WallpaperCanvas from "./components/WallpaperCanvas";
import SidebarPanel from "./components/SidebarPanel";
import BottomBarPanel from "./components/BottomBarPanel";
import TopBar from "./components/topbar/TopBar";
import Inspector from "./components/inspector/Inspector";
import SettingsDrawer from "./components/SettingsDrawer";
import CommandPalette from "./components/CommandPalette";
import {
  exportFullOverlay,
  exportSidebar,
  exportBottomBar,
  exportCover,
  exportPoster,
  exportWallpaper,
} from "./utils/exportImage";
import { loadOverlayState, saveOverlayState } from "./stateStorage";
import {
  WALLPAPER_PRESETS,
  getWallpaperPreset,
  getPresetLabels,
} from "./lib/wallpaper";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useLocale, loadLocale } from "./hooks/useLocale";

// Offscreen export stage styles — rendered at native resolution, invisible to user
const exportStageStyle: React.CSSProperties = {
  position: "fixed",
  left: -10000,
  top: 0,
  pointerEvents: "none",
  opacity: 1,
  zIndex: -1,
};

export default function App() {
  const { t, locale } = useLocale();
  const [state, setStateRaw] = useState<OverlayState>(() => loadOverlayState(undefined, DEFAULT_STATE_BY_LOCALE[loadLocale()]));
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const prevLocaleRef = useRef(locale);

  useEffect(() => {
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
setState({ ...DEFAULT_STATE_BY_LOCALE[locale], activeTab: state.activeTab });
    }
  }, [locale]);

  // Preview ref (for the visible scaled canvas — not used for export)
  const previewOverlayRef = useRef<HTMLDivElement | null>(null);
  const previewCoverRef = useRef<HTMLDivElement | null>(null);
  const previewPosterRef = useRef<HTMLDivElement | null>(null);

  // Offscreen export-only refs — always mounted, no transforms
  const exportOverlayRef = useRef<HTMLDivElement | null>(null);
  const exportSidebarRef = useRef<HTMLDivElement | null>(null);
  const exportBottomBarRef = useRef<HTMLDivElement | null>(null);
  const exportCoverRef = useRef<HTMLDivElement | null>(null);
  const exportPosterRef = useRef<HTMLDivElement | null>(null);
  const exportWallpaperRefs = useRef<Map<string, HTMLDivElement | null>>(
    new Map(),
  );

  const setState = useCallback((next: OverlayState) => {
    setStateRaw(next);
  }, []);

  useEffect(() => {
    saveOverlayState(state);
  }, [state]);

  const handleExport = useCallback(
    async (
      type: "overlay" | "sidebar" | "bottom-bar" | "cover" | "poster" | "wallpaper",
      fn: () => Promise<void>,
    ) => {
      setExporting(type);
      setExportError(null);
      try {
        await fn();
      } catch (err) {
        setExportError(err instanceof Error ? err.message : t("export.failed"));
      } finally {
        setExporting(null);
      }
    },
    [t],
  );

  const handleExportOverlay = useCallback(() => {
    const el = exportOverlayRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    handleExport("overlay", () => exportFullOverlay(el));
  }, [handleExport, t]);

  const handleExportSidebar = useCallback(() => {
    const el = exportSidebarRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    handleExport("sidebar", () => exportSidebar(el));
  }, [handleExport, t]);

  const handleExportBottomBar = useCallback(() => {
    const el = exportBottomBarRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    handleExport("bottom-bar", () => exportBottomBar(el));
  }, [handleExport, t]);

  const handleExportCover = useCallback(() => {
    const el = exportCoverRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    handleExport("cover", () => exportCover(el));
  }, [handleExport, t]);

  const handleExportPoster = useCallback(() => {
    const el = exportPosterRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    handleExport("poster", () => exportPoster(el));
  }, [handleExport, t]);

  const handleExportWallpaper = useCallback(() => {
    handleExport("wallpaper", async () => {
      for (const preset of WALLPAPER_PRESETS) {
        const el = exportWallpaperRefs.current.get(preset.id);
        if (!el) {
          throw new Error(`Wallpaper export node missing: ${preset.id}`);
        }
        await exportWallpaper(
          el,
          `vibe-coding-wallpaper-${preset.id}.png`,
          preset.width,
          preset.height,
        );
      }
    });
  }, [handleExport]);

  const handleReset = useCallback(() => {
    setState({ ...DEFAULT_STATE_BY_LOCALE[locale] });
  }, [setState, locale]);

  const handleExportCurrent = useCallback(() => {
    switch (state.activeTab) {
      case "overlay":
        handleExportOverlay();
        break;
      case "cover":
        handleExportCover();
        break;
      case "poster":
        handleExportPoster();
        break;
      case "wallpaper":
        handleExportWallpaper();
        break;
    }
  }, [
    state.activeTab,
    handleExportOverlay,
    handleExportCover,
    handleExportPoster,
    handleExportWallpaper,
  ]);

  const TAB_ORDER: OverlayState["activeTab"][] = [
    "overlay",
    "cover",
    "poster",
    "wallpaper",
  ];

  useKeyboardShortcuts({
    onCommandPalette: () => setCmdkOpen((v) => !v),
    onSwitchTab: (idx) => {
      const tab = TAB_ORDER[idx];
      if (tab) setState({ ...state, activeTab: tab });
    },
    onExportCurrent: handleExportCurrent,
    onOpenSettings: () => setSettingsOpen(true),
  });

  const CANVAS_NATIVE_W = 1920;
  const CANVAS_NATIVE_H = 1080;

  const wallpaperPreset = getWallpaperPreset(state.wallpaper.previewPresetId);
  const isWallpaperTab = state.activeTab === "wallpaper";
  const previewW = isWallpaperTab ? wallpaperPreset.width : CANVAS_NATIVE_W;
  const previewH = isWallpaperTab ? wallpaperPreset.height : CANVAS_NATIVE_H;

  const tabBadge = (() => {
    switch (state.activeTab) {
      case "overlay":
        return t("tabBadge.overlay");
      case "cover":
        return t("tabBadge.cover");
      case "poster":
        return t("tabBadge.poster");
      case "wallpaper":
        return `${t("tab.wallpaper").toUpperCase()} · ${getPresetLabels(locale)[wallpaperPreset.id].label} · ${wallpaperPreset.width}×${wallpaperPreset.height}`;
    }
  })();

  return (
    <>
      {/* ─── Offscreen export-only nodes ────────────────────────────────────
          Always mounted. Positioned far off-screen so they are painted by the
          browser (opacity:1, no display:none) but never seen by the user.
          No CSS transform or scaling — native resolution only.
      ─────────────────────────────────────────────────────────────────────── */}

      {/* Full 1920×1080 overlay export */}
      <div style={exportStageStyle}>
        <OverlayCanvas ref={exportOverlayRef} state={state} />
      </div>

      {/* Sidebar-only export — 470×760 */}
      <div style={exportStageStyle}>
        <SidebarPanel ref={exportSidebarRef} state={state} />
      </div>

      {/* Bottom bar-only export — 1856×180 */}
      <div style={exportStageStyle}>
        <BottomBarPanel ref={exportBottomBarRef} state={state} />
      </div>

      {/* Cover export — always mounted regardless of active tab */}
      <div style={exportStageStyle}>
        <CoverCanvas ref={exportCoverRef} state={state} />
      </div>

      {/* Poster export */}
      <div style={exportStageStyle}>
        <PosterCanvas ref={exportPosterRef} state={state} />
      </div>

      {/* Wallpaper exports — one offscreen node per preset (4K / QHD / Mobile) */}
      {WALLPAPER_PRESETS.map((preset) => (
        <div key={preset.id} style={exportStageStyle}>
          <WallpaperCanvas
            ref={(node) => {
              if (node) exportWallpaperRefs.current.set(preset.id, node);
              else exportWallpaperRefs.current.delete(preset.id);
            }}
            state={state}
            preset={preset}
          />
        </div>
      ))}

      {/* ─── Main UI ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#070A12",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
          overflow: "hidden",
        }}
      >
        <TopBar
          state={state}
          onChange={setState}
          exporting={exporting}
          onExportOverlay={handleExportOverlay}
          onExportSidebar={handleExportSidebar}
          onExportBottomBar={handleExportBottomBar}
          onExportCover={handleExportCover}
          onExportPoster={handleExportPoster}
          onExportWallpaper={handleExportWallpaper}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenCommandPalette={() => setCmdkOpen(true)}
        />

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
          }}
        >
          {/* Main Preview Area */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px 24px",
              gap: 12,
              background: "#070A12",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#8DA8FF",
                    background: "#1A1C2E",
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #2a3060",
                    letterSpacing: "0.04em",
                  }}
                >
                  {tabBadge}
                </div>
                <div style={{ fontSize: 11, color: "#6B7CA8" }}>
                  {t("app.previewHint")}
                </div>
              </div>

              {exportError && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#FF6FAE",
                    background: "#1A0A12",
                    border: "1px solid #FF6FAE30",
                    borderRadius: 6,
                    padding: "4px 12px",
                  }}
                >
                  {exportError}
                </div>
              )}
            </div>

            {/* Scaled Canvas Preview */}
            <PreviewFrame nativeW={previewW} nativeH={previewH}>
              {state.activeTab === "overlay" ? (
                <OverlayCanvas ref={previewOverlayRef} state={state} onChange={setState} />
              ) : state.activeTab === "cover" ? (
                <CoverCanvas
                  ref={previewCoverRef}
                  state={state}
                  editable
                  onChange={setState}
                />
              ) : state.activeTab === "poster" ? (
                <PosterCanvas
                  ref={previewPosterRef}
                  state={state}
                  editable
                  onChange={setState}
                />
              ) : (
                <WallpaperCanvas
                  state={state}
                  preset={wallpaperPreset}
                  editable
                  onChange={setState}
                />
              )}
            </PreviewFrame>
          </div>

          <Inspector state={state} onChange={setState} />
        </div>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        state={state}
        onChange={setState}
        onReset={handleReset}
      />

      <CommandPalette
        open={cmdkOpen}
        onClose={() => setCmdkOpen(false)}
        state={state}
        onChange={setState}
        onExportOverlay={handleExportOverlay}
        onExportCover={handleExportCover}
        onExportPoster={handleExportPoster}
        onExportWallpaper={handleExportWallpaper}
        onExportSidebar={handleExportSidebar}
        onExportBottomBar={handleExportBottomBar}
        onOpenSettings={() => setSettingsOpen(true)}
        onReset={handleReset}
      />
    </>
  );
}

function PreviewFrame({
  nativeW,
  nativeH,
  children,
}: {
  nativeW: number;
  nativeH: number;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const s = Math.min(cw / nativeW, ch / nativeH);
      setScale(s);
      setContainerSize({ w: cw, h: ch });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nativeW, nativeH]);

  const scaledW = Math.round(nativeW * scale);
  const scaledH = Math.round(nativeH * scale);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Outer wrapper sized to scaled dimensions */}
      <div
        data-testid="canvas-scale-wrapper"
        style={{
          width: scaledW,
          height: scaledH,
          position: "relative",
          flexShrink: 0,
          boxShadow:
            "0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(141,168,255,0.1)",
          borderRadius: 12,
        }}
      >
        {/* Inner canvas at native resolution, scaled top-left */}
        <div
          style={{
            width: nativeW,
            height: nativeH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>

      {/* Debug readout */}
      <div
        data-testid="preview-debug"
        style={{
          position: "absolute",
          bottom: 8,
          right: 12,
          fontSize: 10,
          color: "#3a4060",
          fontFamily: "monospace",
          lineHeight: 1.6,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        container {containerSize.w}×{containerSize.h} · scale {scale.toFixed(4)}{" "}
        · canvas {scaledW}×{scaledH}
      </div>
    </div>
  );
}
