import { forwardRef } from "react";
import { OverlayState } from "../types";

interface CoverCanvasProps {
  state: OverlayState;
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

const CoverCanvas = forwardRef<HTMLDivElement, CoverCanvasProps>(
  ({ state }, ref) => {
    const { cover, colors } = state;
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
    const hasOptionalContent =
      cover.manifestoVisible || cover.hookVisible || cover.closingVisible;

    return (
      <div
        ref={ref}
        data-testid="cover-canvas"
        style={{
          width: 1920,
          height: 1080,
          position: "relative",
          background: bgDark,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(${borderColor}06 1px, transparent 1px),
              linear-gradient(90deg, ${borderColor}06 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            pointerEvents: "none",
          }}
        />

        {/* Left-biased radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 90% at 35% 50%, ${bgPanel}F0 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* Right glow behind avatar */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 55% 65% at 80% 45%, ${borderColor}0A 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${cyanAccent}50 0%, ${borderColor}90 45%, ${pinkAccent}50 80%, transparent 100%)`,
          }}
        />

        {/* Corner marks */}
        {(
          [
            { top: 48, left: 48, borderTop: true, borderLeft: true },
            { top: 48, right: 48, borderTop: true, borderRight: true },
            { bottom: 48, left: 48, borderBottom: true, borderLeft: true },
            { bottom: 48, right: 48, borderBottom: true, borderRight: true },
          ] as const
        ).map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: c.top,
              left: c.left,
              bottom: c.bottom,
              right: c.right,
              width: 56,
              height: 56,
              borderTop: c.borderTop ? `1.5px solid ${borderColor}28` : undefined,
              borderBottom: c.borderBottom ? `1.5px solid ${borderColor}28` : undefined,
              borderLeft: c.borderLeft ? `1.5px solid ${borderColor}28` : undefined,
              borderRight: c.borderRight ? `1.5px solid ${borderColor}28` : undefined,
            }}
          />
        ))}

        {/* Vertical column divider */}
        <div
          style={{
            position: "absolute",
            top: 140,
            bottom: 140,
            left: 1120,
            width: 1,
            background: `linear-gradient(180deg, transparent, ${borderColor}20 30%, ${borderColor}30 50%, ${borderColor}20 70%, transparent)`,
          }}
        />

        {/* ── LEFT COLUMN ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1120,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 96px 0 160px",
          }}
        >
          {/* Badge row + LIVE pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: hasOptionalContent ? 44 : 52,
            }}
          >
            {[
              { src: "/icons/claude.svg", alt: "Claude", label: cover.badge1 },
              { src: "/icons/codex.svg", alt: "Codex", label: cover.badge2 },
            ].map((badge, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                {i > 0 && (
                  <span style={{ color: `${borderColor}28`, fontSize: 15, marginRight: 2 }}>
                    ×
                  </span>
                )}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: `${bgPanel}BB`,
                    border: `1px solid ${borderColor}22`,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 5,
                  }}
                >
                  <img
                    src={badge.src}
                    alt={badge.alt}
                    style={{ width: 28, height: 28, objectFit: "contain" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: `${mutedText}50`,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  {badge.label}
                </span>
              </div>
            ))}

            <div
              style={{
                width: 1,
                height: 20,
                background: `${borderColor}18`,
                margin: "0 2px",
              }}
            />

            {/* LIVE pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#E62117",
                borderRadius: 999,
                padding: "0 13px",
                height: 28,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.1em",
                }}
              >
                LIVE
              </span>
            </div>
          </div>

          {/* Main title */}
          <h1
            style={{
              fontSize: hasOptionalContent ? 86 : 96,
              fontWeight: 700,
              color: textColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 40,
            }}
          >
            {cover.title}
          </h1>

          {/* Today's topic card — always visible */}
          <div
            style={{
              background: `${bgPanel}D0`,
              border: `1px solid ${borderColor}20`,
              borderRadius: 14,
              padding: "22px 28px",
              position: "relative",
              overflow: "hidden",
              marginBottom: hasOptionalContent ? 36 : 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, ${warmAccent}70, ${cyanAccent}40, transparent)`,
              }}
            />
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: warmAccent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 10,
                opacity: 0.9,
              }}
            >
              {cover.todayLabel}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: textColor,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              {cover.todayTopic}
            </div>
          </div>

          {/* ── Optional section divider ── */}
          {hasOptionalContent && (
            <div
              style={{
                width: 36,
                height: 1.5,
                background: `linear-gradient(90deg, ${borderColor}45, transparent)`,
                marginBottom: 28,
                borderRadius: 1,
              }}
            />
          )}

          {/* Manifesto — optional */}
          {cover.manifestoVisible && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                marginBottom: cover.hookVisible || cover.closingVisible ? 28 : 0,
              }}
            >
              {[cover.manifestoLine1, cover.manifestoLine2, cover.manifestoLine3].map(
                (line, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                      fontSize: 48,
                      lineHeight: 1,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: textColor,
                    }}
                  >
                    {line}
                  </div>
                )
              )}
            </div>
          )}

          {/* Hook text — optional */}
          {cover.hookVisible && cover.hookText && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: cyanAccent,
                letterSpacing: "0.01em",
                marginBottom: cover.closingVisible ? 16 : 0,
                opacity: 0.9,
              }}
            >
              {cover.hookText}
            </div>
          )}

          {/* Closing sentence — optional */}
          {cover.closingVisible && (
            <div
              style={{
                fontSize: 20,
                color: mutedText,
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: "0 6px",
                lineHeight: 1.6,
                opacity: 0.85,
              }}
            >
              <span>{cover.closingPrefix}</span>
              <span
                style={{
                  textDecoration: "line-through",
                  textDecorationColor: pinkAccent,
                  textDecorationThickness: 2,
                  color: "#9CA3AF",
                }}
              >
                {cover.closingStruck}
              </span>
              <span style={{ color: warmAccent, fontWeight: 600 }}>
                {cover.closingHighlight}
              </span>
              <span style={{ color: `${mutedText}55` }}>{cover.closingSuffix}</span>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN — avatar + optional social info ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 800,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          {/* Avatar */}
          {cover.avatarVisible && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  background: `conic-gradient(from 180deg, ${borderColor}45, ${cyanAccent}35, ${pinkAccent}25, ${borderColor}45)`,
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  background: bgDark,
                  zIndex: 1,
                }}
              />
              <img
                src={avatarSrc}
                alt="Avatar"
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}

          {/* Social info block */}
          {cover.socialVisible && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                alignItems: "flex-start",
                padding: "24px 32px",
                background: `${bgPanel}A0`,
                border: `1px solid ${borderColor}18`,
                borderRadius: 14,
                minWidth: 320,
              }}
            >
              {cover.socialBilibili && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 20,
                      background: "#E62117",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.01em" }}>
                      B站
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 20,
                      color: mutedText,
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {cover.socialBilibili}
                  </span>
                </div>
              )}
              {cover.socialBlog && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 20,
                      background: `${cyanAccent}25`,
                      border: `1px solid ${cyanAccent}40`,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 13, color: cyanAccent }}>⊕</span>
                  </div>
                  <span
                    style={{
                      fontSize: 20,
                      color: mutedText,
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {cover.socialBlog}
                  </span>
                </div>
              )}
              {cover.socialGithub && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 20,
                      background: `${borderColor}18`,
                      border: `1px solid ${borderColor}30`,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: mutedText, letterSpacing: "0.01em" }}>
                      GH
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 20,
                      color: mutedText,
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {cover.socialGithub}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${cyanAccent}30 25%, ${borderColor}55 50%, ${pinkAccent}20 75%, transparent 100%)`,
          }}
        />
      </div>
    );
  }
);

CoverCanvas.displayName = "CoverCanvas";
export default CoverCanvas;
