import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import OverlayInspector from "./groups/OverlayInspector";
import CoverInspector from "./groups/CoverInspector";
import PosterInspector from "./groups/PosterInspector";
import WallpaperInspector from "./groups/WallpaperInspector";

interface InspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  /** Public demo: hides local-only control surfaces (OBS composition). */
  demoMode?: boolean;
}

/**
 * Right-hand inspector. Sole left-rail-replacement: shows a header and a
 * stack of context-aware accordion groups for the current tab. Container
 * width is owned by App.tsx.
 */
export default function Inspector({ state, onChange, demoMode = false }: InspectorProps) {
  const { t } = useLocale();
  return (
    <aside
      data-testid="inspector"
      style={{
        width: 320,
        minWidth: 320,
        background: UI_COLORS.appSurface,
        borderLeft: `1px solid ${UI_COLORS.border}`,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "15px 16px",
          borderBottom: `1px solid ${UI_COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--app-font-mono)",
            fontSize: 11,
            fontWeight: 600,
            color: UI_COLORS.text,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {t(`tab.${state.activeTab}`)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: UI_COLORS.textMuted,
            marginTop: 4,
            lineHeight: 1.4,
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
          <OverlayInspector state={state} onChange={onChange} demoMode={demoMode} />
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
