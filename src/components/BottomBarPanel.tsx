import { forwardRef } from "react";
import { OverlayState } from "../types";
import BottomBarSegments from "./BottomBarSegments";
import { editorialPalette } from "./lib/editorial-palette";

interface BottomBarPanelProps {
  state: OverlayState;
}

const BottomBarPanel = forwardRef<HTMLDivElement, BottomBarPanelProps>(
  ({ state }, ref) => {
    const { bgPanel } = state.colors;
    const E = editorialPalette(state.colors);

    return (
      <div
        ref={ref}
        data-testid="export-bottom-bar-panel"
        style={{
          width: 1856,
          height: 180,
          background: `${bgPanel}F0`,
          border: `1px solid ${E.lineStrong}`,
          borderRadius: 0,
          display: "flex",
          overflow: "hidden",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        <BottomBarSegments state={state} size="large" />
      </div>
    );
  }
);

BottomBarPanel.displayName = "BottomBarPanel";
export default BottomBarPanel;
