import { forwardRef } from "react";
import { OverlayState } from "../types";

interface BottomBarPanelProps {
  state: OverlayState;
}

const BottomBarPanel = forwardRef<HTMLDivElement, BottomBarPanelProps>(
  ({ state }, ref) => {
    const { bottomBar, colors } = state;
    const { bgPanel, borderColor, textColor, cyanAccent, pinkAccent, warmAccent } = colors;

    return (
      <div
        ref={ref}
        data-testid="export-bottom-bar-panel"
        style={{
          width: 1856,
          height: 180,
          background: `${bgPanel}F0`,
          border: `1.5px solid ${borderColor}45`,
          borderRadius: 12,
          display: "flex",
          overflow: "hidden",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        {bottomBar.segments.map((seg, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              padding: "20px 32px",
              borderRight:
                idx < bottomBar.segments.length - 1
                  ? `1px solid ${borderColor}25`
                  : "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: idx === 0 ? cyanAccent : idx === 1 ? warmAccent : pinkAccent,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 10,
                  borderRadius: 2,
                  background: idx === 0 ? cyanAccent : idx === 1 ? warmAccent : pinkAccent,
                  flexShrink: 0,
                }}
              />
              {seg.title}
            </div>
            {/* Middle segment gets the LIVE pill inline */}
            {idx === 1 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#E62117",
                    borderRadius: 999,
                    padding: "0 14px",
                    height: 32,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.9)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.08em",
                    }}
                  >
                    LIVE
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: textColor,
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {seg.text}
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 22,
                  color: textColor,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                {seg.text}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
);

BottomBarPanel.displayName = "BottomBarPanel";
export default BottomBarPanel;
