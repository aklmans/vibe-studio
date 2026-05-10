import type { OverlayState } from "../../types";
import { useLocale } from "../../hooks/useLocale";
import OverlayInspector from "./groups/OverlayInspector";
import CoverInspector from "./groups/CoverInspector";
import PosterInspector from "./groups/PosterInspector";
import WallpaperInspector from "./groups/WallpaperInspector";

interface InspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * Right-hand inspector. Sole left-rail-replacement: shows a header and a
 * stack of context-aware accordion groups for the current tab. Container
 * width is owned by App.tsx.
 */
export default function Inspector({ state, onChange }: InspectorProps) {
  const { t } = useLocale();
  return (
    <aside
      data-testid="inspector"
      style={{
        width: 320,
        minWidth: 320,
        background: "#0D0E1C",
        borderLeft: "1px solid #1F2235",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #1F2235",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#F4F7FF",
            letterSpacing: "0.02em",
          }}
        >
          {t(`tab.${state.activeTab}`)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#6B7CA8",
            marginTop: 2,
          }}
        >
          {t(`inspector.${state.activeTab}.hint`)}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {state.activeTab === "overlay" && (
          <OverlayInspector state={state} onChange={onChange} />
        )}
        {state.activeTab === "cover" && (
          <CoverInspector state={state} onChange={onChange} />
        )}
        {state.activeTab === "poster" && (
          <PosterInspector state={state} onChange={onChange} />
        )}
        {state.activeTab === "wallpaper" && (
          <WallpaperInspector state={state} onChange={onChange} />
        )}
      </div>
    </aside>
  );
}
