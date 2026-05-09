import { forwardRef } from "react";
import { OverlayState } from "../types";

interface OverlayCanvasProps {
  state: OverlayState;
  sidebarRef?: React.RefObject<HTMLDivElement | null>;
  bottomBarRef?: React.RefObject<HTMLDivElement | null>;
}

const AVATAR_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B4FD8"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#g)"/>
  <text x="100" y="118" text-anchor="middle" font-family="system-ui,sans-serif"
    font-size="68" font-weight="700" fill="rgba(255,255,255,0.9)">VC</text>
</svg>
`)}`;

const OverlayCanvas = forwardRef<HTMLDivElement, OverlayCanvasProps>(
  ({ state, sidebarRef, bottomBarRef }, ref) => {
    const { sidebar, bottomBar, mainScreen, cover, colors } = state;
    const {
      bgDark,
      bgPanel,
      borderColor,
      textColor,
      mutedText,
      cyanAccent,
      pinkAccent,
      warmAccent,
    } = colors;

    const avatarSrc = cover.avatarUrl || AVATAR_PLACEHOLDER;
    const hasSocial =
      sidebar.socialVisible &&
      (cover.socialBilibili || cover.socialBlog || cover.socialGithub || cover.socialQQ);

    return (
      <div
        ref={ref}
        data-testid="overlay-canvas"
        style={{
          width: 1920,
          height: 1080,
          position: "relative",
          background: `${bgDark}`,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Dot pattern background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle, ${borderColor}18 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />

        {/* Subtle top gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 120% 60% at 50% 0%, ${bgPanel}80 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Main Screen Placeholder */}
        {mainScreen.visible && (
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 48,
              width: 1360,
              height: 760,
              background: "#070A12",
              border: `1.5px solid ${borderColor}50`,
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* macOS-style titlebar */}
            <div
              style={{
                height: 36,
                background: `${bgPanel}CC`,
                borderBottom: `1px solid ${borderColor}30`,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57", opacity: 0.7 }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E", opacity: 0.7 }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840", opacity: 0.7 }} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  color: `${mutedText}60`,
                  letterSpacing: "0.02em",
                }}
              >
                Screen Capture
              </div>
            </div>

            {/* Main content area */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 18, color: `${mutedText}40`, letterSpacing: "0.05em", fontWeight: 300, textTransform: "uppercase" }}>
                Main Screen Capture
              </div>
              <div style={{ width: 40, height: 1, background: `${borderColor}30` }} />
              <div style={{ fontSize: 12, color: `${mutedText}25`, letterSpacing: "0.08em" }}>1920 × 1080</div>
            </div>
          </div>
        )}

        {/* Camera Frame — macOS style, bottom-left of main screen area */}
        {mainScreen.cameraVisible && (
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 567,
              width: 300,
              height: 225,
              background: "#050710",
              border: `1.5px solid ${borderColor}55`,
              borderRadius: 12,
              overflow: "hidden",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${bgPanel}`,
            }}
          >
            {/* Camera titlebar */}
            <div
              style={{
                height: 28,
                background: `${bgPanel}EE`,
                borderBottom: `1px solid ${borderColor}25`,
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F57", opacity: 0.7 }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FEBC2E", opacity: 0.7 }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#28C840", opacity: 0.7 }} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 10,
                  color: `${mutedText}50`,
                  letterSpacing: "0.06em",
                }}
              >
                Camera
              </div>
            </div>

            {/* Camera content — avatar or placeholder */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#07090F",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={avatarSrc}
                alt="Camera"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Subtle vignette */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)",
                  pointerEvents: "none",
                }}
              />
              {/* Live indicator */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(0,0,0,0.55)",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#FF5F57",
                    boxShadow: "0 0 4px #FF5F57",
                  }}
                />
                <span style={{ fontSize: 9, color: "#fff", fontWeight: 600, letterSpacing: "0.08em" }}>LIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar */}
        {sidebar.visible && (
          <div
            ref={sidebarRef}
            data-testid="overlay-sidebar"
            style={{
              position: "absolute",
              left: 1410,
              top: 48,
              width: 470,
              height: 760,
              background: `${bgPanel}F0`,
              border: `1.5px solid ${borderColor}45`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Sidebar header accent */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${cyanAccent}80 0%, ${borderColor}60 50%, ${pinkAccent}40 100%)`,
                flexShrink: 0,
              }}
            />

            {/* Sections — flex so they fill available space above social footer */}
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
                    {/* Section title + progress badge */}
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
                      {/* Progress pill — only show when at least one done */}
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

                    {/* Progress bar — only render when any done */}
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
                            transition: "width 0.3s ease",
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
                              /* ✓ checkmark */
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
                  borderTop: `1px solid ${borderColor}20`,
                  padding: "12px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  flexShrink: 0,
                  background: `${bgDark}60`,
                }}
              >
                {cover.socialBilibili && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "#E62117", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>B站</span>
                    <span style={{ fontSize: 12, color: `${mutedText}BB`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialBilibili}</span>
                  </div>
                )}
                {cover.socialBlog && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: cyanAccent, background: `${cyanAccent}18`, border: `1px solid ${cyanAccent}30`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>博客</span>
                    <span style={{ fontSize: 12, color: `${mutedText}BB`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialBlog}</span>
                  </div>
                )}
                {cover.socialGithub && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: mutedText, background: `${borderColor}15`, border: `1px solid ${borderColor}25`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>GH</span>
                    <span style={{ fontSize: 12, color: `${mutedText}BB`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialGithub}</span>
                  </div>
                )}
                {cover.socialQQ && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: warmAccent, background: `${warmAccent}15`, border: `1px solid ${warmAccent}28`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>QQ</span>
                    <span style={{ fontSize: 12, color: `${mutedText}BB`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cover.socialQQ}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Status Bar */}
        {bottomBar.visible && (
          <div
            ref={bottomBarRef}
            data-testid="overlay-bottom-bar"
            style={{
              position: "absolute",
              left: 24,
              top: 840,
              width: 1856,
              height: 180,
              background: `${bgPanel}F0`,
              border: `1.5px solid ${borderColor}45`,
              borderRadius: 12,
              display: "flex",
              overflow: "hidden",
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
            ))}
          </div>
        )}

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${cyanAccent}30 30%, ${borderColor}50 50%, ${pinkAccent}20 80%, transparent 100%)`,
          }}
        />
      </div>
    );
  }
);

OverlayCanvas.displayName = "OverlayCanvas";
export default OverlayCanvas;
