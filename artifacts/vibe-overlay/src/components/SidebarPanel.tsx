import { forwardRef } from "react";
import { OverlayState } from "../types";

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

    return (
      <div
        ref={ref}
        data-testid="export-sidebar-panel"
        style={{
          width: 400,
          height: 684,
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

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {sidebar.sections.map((section, idx) => {
            const sectionAccent = idx === 0 ? cyanAccent : idx === 1 ? pinkAccent : warmAccent;
            const doneBullets = sidebar.sectionsDone?.[idx] ?? [];
            const doneCount = doneBullets.filter(Boolean).length;
            const totalCount = section.bullets.length;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "16px 24px",
                  borderBottom:
                    idx < sidebar.sections.length - 1
                      ? `1px solid ${borderColor}25`
                      : "none",
                  overflow: "hidden",
                }}
              >
                {/* Title + progress badge */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: sectionAccent,
                    marginBottom: 10,
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
                      background: sectionAccent,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{section.title}</span>
                  {doneCount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: sectionAccent,
                        background: `${sectionAccent}18`,
                        border: `1px solid ${sectionAccent}30`,
                        borderRadius: 10,
                        padding: "1px 7px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {doneCount}/{totalCount}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {doneCount > 0 && (
                  <div
                    style={{
                      height: 2,
                      background: `${sectionAccent}15`,
                      borderRadius: 1,
                      marginBottom: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(doneCount / totalCount) * 100}%`,
                        background: `linear-gradient(90deg, ${sectionAccent}90, ${sectionAccent}50)`,
                        borderRadius: 1,
                      }}
                    />
                  </div>
                )}

                {/* Bullets */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {section.bullets.map((bullet, bIdx) => {
                    const done = doneBullets[bIdx] ?? false;
                    return (
                      <div
                        key={bIdx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          fontSize: 14,
                          color: done ? `${textColor}55` : textColor,
                          lineHeight: 1.5,
                        }}
                      >
                        {done ? (
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: `${sectionAccent}25`,
                              border: `1px solid ${sectionAccent}60`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 3,
                              flexShrink: 0,
                            }}
                          >
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke={sectionAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ) : (
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
                        )}
                        <span style={{ textDecoration: done ? "line-through" : "none" }}>
                          {bullet}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#E62117", borderRadius: 4, padding: "3px 8px", flexShrink: 0, minWidth: 52, textAlign: "center" as const, boxSizing: "border-box" as const }}>B站</span>
                <span style={{ fontSize: 14, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialBilibili}</span>
              </div>
            )}
            {cover.socialBlog && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: cyanAccent, background: `${cyanAccent}18`, border: `1px solid ${cyanAccent}40`, borderRadius: 4, padding: "3px 8px", flexShrink: 0, minWidth: 52, textAlign: "center" as const, boxSizing: "border-box" as const }}>博客</span>
                <span style={{ fontSize: 14, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialBlog}</span>
              </div>
            )}
            {cover.socialGithub && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: mutedText, background: `${borderColor}15`, border: `1px solid ${borderColor}30`, borderRadius: 4, padding: "3px 8px", flexShrink: 0, minWidth: 52, textAlign: "center" as const, boxSizing: "border-box" as const }}>GitHub</span>
                <span style={{ fontSize: 14, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialGithub}</span>
              </div>
            )}
            {cover.socialQQ && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: warmAccent, background: `${warmAccent}15`, border: `1px solid ${warmAccent}35`, borderRadius: 4, padding: "3px 8px", flexShrink: 0, minWidth: 52, textAlign: "center" as const, boxSizing: "border-box" as const }}>QQ群</span>
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
