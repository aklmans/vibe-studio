import { forwardRef, useRef, useImperativeHandle } from "react";
import { OverlayState } from "../types";

interface OverlayCanvasProps {
  state: OverlayState;
  sidebarRef?: React.RefObject<HTMLDivElement | null>;
  bottomBarRef?: React.RefObject<HTMLDivElement | null>;
}

const OverlayCanvas = forwardRef<HTMLDivElement, OverlayCanvasProps>(
  ({ state, sidebarRef, bottomBarRef }, ref) => {
    const { sidebar, bottomBar, mainScreen, colors } = state;
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
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "#FF5F57",
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "#FEBC2E",
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "#28C840",
                    opacity: 0.7,
                  }}
                />
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
              <div
                style={{
                  fontSize: 18,
                  color: `${mutedText}40`,
                  letterSpacing: "0.05em",
                  fontWeight: 300,
                  textTransform: "uppercase",
                }}
              >
                Main Screen Capture
              </div>
              <div
                style={{
                  width: 40,
                  height: 1,
                  background: `${borderColor}30`,
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  color: `${mutedText}25`,
                  letterSpacing: "0.08em",
                }}
              >
                1920 × 1080
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
                {/* Section title */}
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

                {/* Bullets */}
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
