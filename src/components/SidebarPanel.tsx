import { forwardRef } from "react";
import { OverlayState } from "../types";
import { fontFamilies } from "../lib/typography";
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
    const { bgDark, bgPanel, borderColor, mutedText, pinkAccent } = colors;
    const accent = pinkAccent;

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
          border: `1px solid ${borderColor}45`,
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        {/* Header accent — single quiet mark */}
        <div
          style={{
            height: 2,
            width: 56,
            background: accent,
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
                fontFamily: fontFamilies.mono,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: mutedText,
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginBottom: 2,
              }}
            >
              <div style={{ width: 2, height: 11, background: accent, flexShrink: 0 }} />
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
