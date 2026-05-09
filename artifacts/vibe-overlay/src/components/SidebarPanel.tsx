import { forwardRef } from "react";
import { OverlayState } from "../types";
import SidebarSections from "./SidebarSections";

interface SidebarPanelProps {
  state: OverlayState;
}

const SidebarPanel = forwardRef<HTMLDivElement, SidebarPanelProps>(
  ({ state }, ref) => {
    const { sidebar, cover, colors } = state;
    const { bgDark, bgPanel, borderColor, textColor, mutedText, cyanAccent, pinkAccent, warmAccent } = colors;

    const hasSocial =
      sidebar.socialVisible &&
      (cover.socialBilibili || cover.socialBlog || cover.socialGithub || cover.socialQQ);

    // Small-card label baseline (Sidebar export slice).
    // All labels carry a 1px border so heights match even when colors differ.
    const labelBase = {
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 4,
      padding: "3px 8px",
      flexShrink: 0,
      minWidth: 76,
      textAlign: "center" as const,
      boxSizing: "border-box" as const,
      letterSpacing: "0.04em",
      border: "1px solid transparent",
    };

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
              关注我
            </div>
            {cover.socialBilibili && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...labelBase, color: "#fff", background: "#E62117", border: "1px solid #E62117" }}>B站</span>
                <span style={{ fontSize: 14, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialBilibili}</span>
              </div>
            )}
            {cover.socialBlog && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...labelBase, color: cyanAccent, background: `${cyanAccent}18`, border: `1px solid ${cyanAccent}40` }}>博客</span>
                <span style={{ fontSize: 14, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialBlog}</span>
              </div>
            )}
            {cover.socialGithub && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...labelBase, color: mutedText, background: `${borderColor}15`, border: `1px solid ${borderColor}30` }}>GitHub</span>
                <span style={{ fontSize: 14, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialGithub}</span>
              </div>
            )}
            {cover.socialQQ && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...labelBase, color: warmAccent, background: `${warmAccent}15`, border: `1px solid ${warmAccent}35` }}>QQ群</span>
                <span style={{ fontSize: 14, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialQQ}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SidebarPanel.displayName = "SidebarPanel";
export default SidebarPanel;
