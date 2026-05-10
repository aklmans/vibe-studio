import { forwardRef } from "react";
import { OverlayState } from "../types";
import BottomBarSegments from "./BottomBarSegments";

interface BottomBarPanelProps {
  state: OverlayState;
}

const BottomBarPanel = forwardRef<HTMLDivElement, BottomBarPanelProps>(
  ({ state }, ref) => {
    const { bgPanel, borderColor } = state.colors;

    return (
      <div
        ref={ref}
        data-testid="export-bottom-bar-panel"
        style={{
          width: 1856,
          height: 180,
          background: `${bgPanel}F0`,
          border: `1.5px solid ${borderColor}45`,
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
