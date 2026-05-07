import { forwardRef } from "react";
import { OverlayState } from "../types";

interface SidebarPanelProps {
  state: OverlayState;
}

const SidebarPanel = forwardRef<HTMLDivElement, SidebarPanelProps>(
  ({ state }, ref) => {
    const { sidebar, colors } = state;
    const { bgPanel, borderColor, textColor, cyanAccent, pinkAccent, warmAccent } = colors;

    return (
      <div
        ref={ref}
        data-testid="export-sidebar-panel"
        style={{
          width: 470,
          height: 760,
          background: `${bgPanel}F0`,
          border: `1.5px solid ${borderColor}45`,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        {/* Header accent bar */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${cyanAccent}80 0%, ${borderColor}60 50%, ${pinkAccent}40 100%)`,
            flexShrink: 0,
          }}
        />

        {sidebar.sections.map((section, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px",
              borderBottom:
                idx < sidebar.sections.length - 1
                  ? `1px solid ${borderColor}25`
                  : "none",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: idx === 0 ? cyanAccent : idx === 1 ? pinkAccent : warmAccent,
                marginBottom: 14,
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
                  background: idx === 0 ? cyanAccent : idx === 1 ? pinkAccent : warmAccent,
                  flexShrink: 0,
                }}
              />
              {section.title}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {section.bullets.map((bullet, bIdx) => (
                <div
                  key={bIdx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: 14,
                    color: textColor,
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: `${borderColor}80`,
                      marginTop: 7,
                      flexShrink: 0,
                    }}
                  />
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

SidebarPanel.displayName = "SidebarPanel";
export default SidebarPanel;
