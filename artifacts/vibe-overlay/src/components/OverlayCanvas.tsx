import { forwardRef } from "react";
import { OverlayState } from "../types";
import SidebarSections from "./SidebarSections";

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
            backgroundSize: "32px 32px",
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
              width: 1448,
              height: 822,
              background: "#070A12",
              border: `1.5px solid ${borderColor}50`,
              borderRadius: 0,
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
              {/* LIVE pill — always visible while overlay is on air */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#E62117",
                  borderRadius: 999,
                  padding: "0 10px",
                  height: 20,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.95)",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.12em",
                  }}
                >
                  LIVE
                </span>
              </div>
            </div>

            {/* Main content area — large idle watermark */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 120,
                  fontWeight: 700,
                  color: mutedText,
                  opacity: 0.05,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                VIBE CODING
              </div>
            </div>
          </div>
        )}

        {/* Camera Frame — macOS style, bottom-right column (below sidebar) */}
        {mainScreen.cameraVisible && (
          <div
            style={{
              position: "absolute",
              left: 1496,
              top: 720,
              width: 400,
              height: 300,
              background: "#050710",
              border: `1.5px solid ${borderColor}55`,
              borderRadius: 0,
              overflow: "hidden",
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
              left: 1496,
              top: 48,
              width: 400,
              height: 660,
              background: `${bgPanel}F0`,
              border: `1.5px solid ${borderColor}45`,
              borderRadius: 0,
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
                {/* Social section title — same style as section headings */}
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
        )}

        {/* Bottom Status Bar */}
        {bottomBar.visible && (
          <div
            ref={bottomBarRef}
            data-testid="overlay-bottom-bar"
            style={{
              position: "absolute",
              left: 24,
              top: 894,
              width: 1448,
              height: 162,
              background: `${bgPanel}F0`,
              border: `1.5px solid ${borderColor}45`,
              borderRadius: 0,
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
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {/* Soft fade-out divider, top->bottom transparent gradient */}
                {idx < bottomBar.segments.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 16,
                      bottom: 16,
                      width: 1,
                      background: `linear-gradient(180deg, transparent 0%, ${borderColor}40 50%, transparent 100%)`,
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 12,
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
                      height: 12,
                      borderRadius: 2,
                      background: idx === 0 ? cyanAccent : idx === 1 ? warmAccent : pinkAccent,
                      flexShrink: 0,
                    }}
                  />
                  {seg.title}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: textColor,
                    fontWeight: 500,
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
