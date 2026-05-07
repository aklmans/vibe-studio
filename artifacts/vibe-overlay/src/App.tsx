import { useState, useRef, useCallback, useEffect } from "react";
import { OverlayState, DEFAULT_STATE } from "./types";
import OverlayCanvas from "./components/OverlayCanvas";
import CoverCanvas from "./components/CoverCanvas";
import EditorPanel from "./components/EditorPanel";
import {
  exportFullOverlay,
  exportSidebar,
  exportBottomBar,
  exportCover,
} from "./utils/exportImage";

const STORAGE_KEY = "vibe-overlay-state";

function loadState(): OverlayState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OverlayState;
      return { ...DEFAULT_STATE, ...parsed, colors: { ...DEFAULT_STATE.colors, ...parsed.colors } };
    }
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

function saveState(state: OverlayState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function App() {
  const [state, setStateRaw] = useState<OverlayState>(loadState);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);
  const coverRef = useRef<HTMLDivElement | null>(null);

  const setState = useCallback((next: OverlayState) => {
    setStateRaw(next);
    saveState(next);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleExport = useCallback(
    async (
      type: "overlay" | "sidebar" | "bottom-bar" | "cover",
      fn: () => Promise<void>
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
    []
  );

  const handleExportOverlay = useCallback(() => {
    if (!overlayRef.current) return;
    const el = overlayRef.current;
    handleExport("overlay", () => exportFullOverlay(el));
  }, [handleExport]);

  const handleExportSidebar = useCallback(() => {
    if (!sidebarRef.current) return;
    const el = sidebarRef.current;
    handleExport("sidebar", () => exportSidebar(el));
  }, [handleExport]);

  const handleExportBottomBar = useCallback(() => {
    if (!bottomBarRef.current) return;
    const el = bottomBarRef.current;
    handleExport("bottom-bar", () => exportBottomBar(el));
  }, [handleExport]);

  const handleExportCover = useCallback(() => {
    if (!coverRef.current) return;
    const el = coverRef.current;
    handleExport("cover", () => exportCover(el));
  }, [handleExport]);

  const handleReset = useCallback(() => {
    setState({ ...DEFAULT_STATE });
  }, [setState]);

  const CANVAS_NATIVE_W = 1920;
  const CANVAS_NATIVE_H = 1080;

  return (
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
          overflow: "auto",
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
              {state.activeTab === "overlay" ? "OVERLAY · 1920×1080" : "COVER · 1920×1080"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6B7CA8",
              }}
            >
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

        {/* Scaled Canvas Container */}
        <PreviewFrame
          nativeW={CANVAS_NATIVE_W}
          nativeH={CANVAS_NATIVE_H}
        >
          {state.activeTab === "overlay" ? (
            <OverlayCanvas
              ref={overlayRef}
              state={state}
              sidebarRef={sidebarRef}
              bottomBarRef={bottomBarRef}
            />
          ) : (
            <CoverCanvas ref={coverRef} state={state} />
          )}
        </PreviewFrame>
      </div>
    </div>
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
      }}
    >
      {/* Outer wrapper sized to the scaled dimensions — no overflow clipping */}
      <div
        data-testid="canvas-scale-wrapper"
        style={{
          width: scaledW,
          height: scaledH,
          position: "relative",
          flexShrink: 0,
          boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(141,168,255,0.1)",
          borderRadius: 12,
        }}
      >
        {/* Inner canvas at native resolution, scaled from top-left */}
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

      {/* Debug info */}
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
        container {containerSize.w}×{containerSize.h} · scale {scale.toFixed(4)} · canvas {scaledW}×{scaledH}
      </div>
    </div>
  );
}
