import { useState, useRef, useCallback, useEffect } from "react";
import { DEFAULT_STATE, type OverlayState } from "./types";
import OverlayCanvas from "./components/OverlayCanvas";
import CoverCanvas from "./components/CoverCanvas";
import SidebarPanel from "./components/SidebarPanel";
import BottomBarPanel from "./components/BottomBarPanel";
import EditorPanel from "./components/EditorPanel";
import {
  exportFullOverlay,
  exportSidebar,
  exportBottomBar,
  exportCover,
} from "./utils/exportImage";
import { loadOverlayState, saveOverlayState } from "./stateStorage";

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
  const [state, setStateRaw] = useState<OverlayState>(loadOverlayState);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Preview ref (for the visible scaled canvas — not used for export)
  const previewOverlayRef = useRef<HTMLDivElement | null>(null);
  const previewCoverRef = useRef<HTMLDivElement | null>(null);

  // Offscreen export-only refs — always mounted, no transforms
  const exportOverlayRef = useRef<HTMLDivElement | null>(null);
  const exportSidebarRef = useRef<HTMLDivElement | null>(null);
  const exportBottomBarRef = useRef<HTMLDivElement | null>(null);
  const exportCoverRef = useRef<HTMLDivElement | null>(null);

  const setState = useCallback((next: OverlayState) => {
    setStateRaw(next);
  }, []);

  useEffect(() => {
    saveOverlayState(state);
  }, [state]);

  const handleExport = useCallback(
    async (
      type: "overlay" | "sidebar" | "bottom-bar" | "cover",
      fn: () => Promise<void>,
    ) => {
      setExporting(type);
      setExportError(null);
      try {
        await fn();
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "Export failed");
      } finally {
        setExporting(null);
      }
    },
    [],
  );

  const handleExportOverlay = useCallback(() => {
    const el = exportOverlayRef.current;
    if (!el) {
      setExportError("Export node not ready");
      return;
    }
    handleExport("overlay", () => exportFullOverlay(el));
  }, [handleExport]);

  const handleExportSidebar = useCallback(() => {
    const el = exportSidebarRef.current;
    if (!el) {
      setExportError("Export node not ready");
      return;
    }
    handleExport("sidebar", () => exportSidebar(el));
  }, [handleExport]);

  const handleExportBottomBar = useCallback(() => {
    const el = exportBottomBarRef.current;
    if (!el) {
      setExportError("Export node not ready");
      return;
    }
    handleExport("bottom-bar", () => exportBottomBar(el));
  }, [handleExport]);

  const handleExportCover = useCallback(() => {
    const el = exportCoverRef.current;
    if (!el) {
      setExportError("Export node not ready");
      return;
    }
    handleExport("cover", () => exportCover(el));
  }, [handleExport]);

  const handleReset = useCallback(() => {
    setState({ ...DEFAULT_STATE });
  }, [setState]);

  const CANVAS_NATIVE_W = 1920;
  const CANVAS_NATIVE_H = 1080;

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

      {/* ─── Main UI ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#070A12",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
          overflow: "hidden",
        }}
      >
        {/* Left Editor Panel */}
        <EditorPanel
          state={state}
          onChange={setState}
          onExportOverlay={handleExportOverlay}
          onExportSidebar={handleExportSidebar}
          onExportBottomBar={handleExportBottomBar}
          onExportCover={handleExportCover}
          onReset={handleReset}
          exporting={exporting}
        />

        {/* Main Preview Area */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            gap: 16,
            background: "#070A12",
          }}
        >
          {/* Top bar */}
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
                {state.activeTab === "overlay"
                  ? "OVERLAY · 1920×1080"
                  : "COVER · 1920×1080"}
              </div>
              <div style={{ fontSize: 11, color: "#6B7CA8" }}>
                Scaled preview — export at full resolution
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
          <PreviewFrame nativeW={CANVAS_NATIVE_W} nativeH={CANVAS_NATIVE_H}>
            {state.activeTab === "overlay" ? (
              <OverlayCanvas ref={previewOverlayRef} state={state} />
            ) : (
              <CoverCanvas ref={previewCoverRef} state={state} />
            )}
          </PreviewFrame>
        </div>
      </div>
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
