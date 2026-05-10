import { forwardRef } from "react";
import { OverlayState } from "../types";
import { useLocale } from "../hooks/useLocale";
import SidebarSections from "./SidebarSections";
import SocialList from "./SocialList";

interface SidebarPanelProps {
  state: OverlayState;
}

const SidebarPanel = forwardRef<HTMLDivElement, SidebarPanelProps>(
  ({ state }, ref) => {
    const { t } = useLocale();
    const { sidebar, cover, colors } = state;
    const { bgDark, bgPanel, borderColor, cyanAccent, pinkAccent } = colors;

    const hasVisibleSocial = cover.socials.some(
      (s) => s.visible && s.value.trim().length > 0,
    );
    const hasSocial = sidebar.socialVisible && hasVisibleSocial;

    return (
      <div
        ref={ref}
        data-testid="export-sidebar-panel"
        style={{
          width: 470,
          height: 760,
          background: `${bgPanel}F0`,
          border: `1.5px solid ${borderColor}45`,
          borderRadius: 0,
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

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <SidebarSections state={state} />
        </div>

        {/* Social footer */}
        {hasSocial && (
          <div
            style={{
              borderTop: `1px solid ${borderColor}25`,
              padding: "14px 24px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flexShrink: 0,
              background: `${bgDark}60`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: pinkAccent,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 2,
              }}
            >
              <div style={{ width: 3, height: 10, borderRadius: 2, background: pinkAccent, flexShrink: 0 }} />
              {t("canvas.followMe")}
            </div>
            <SocialList state={state} size="small" />
          </div>
        )}
      </div>
    );
  }
);

SidebarPanel.displayName = "SidebarPanel";
export default SidebarPanel;
