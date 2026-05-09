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
        {/* Grid pattern background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(${borderColor}07 1px, transparent 1px),
              linear-gradient(90deg, ${borderColor}07 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />

        {/* Radial glow — left-center biased */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 75% 80% at 38% 55%, ${bgPanel}E0 0%, transparent 68%)`,
            pointerEvents: "none",
          }}
        />

        {/* Right-side subtle glow for avatar area */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 50% 60% at 78% 42%, ${borderColor}08 0%, transparent 60%)`,
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
            background: `linear-gradient(90deg, transparent 0%, ${cyanAccent}60 20%, ${borderColor}80 50%, ${pinkAccent}50 80%, transparent 100%)`,
          }}
        />

        {/* Corner decorations */}
        {[
          { top: 40, left: 40, borderTop: true, borderLeft: true, radius: "2px 0 0 0" },
          { top: 40, right: 40, borderTop: true, borderRight: true, radius: "0 2px 0 0" },
          { bottom: 40, left: 40, borderBottom: true, borderLeft: true, radius: "0 0 0 2px" },
          { bottom: 40, right: 40, borderBottom: true, borderRight: true, radius: "0 0 2px 0" },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: c.top,
              left: c.left,
              bottom: c.bottom,
              right: c.right,
              width: 60,
              height: 60,
              borderTop: c.borderTop ? `2px solid ${borderColor}30` : undefined,
              borderBottom: c.borderBottom ? `2px solid ${borderColor}30` : undefined,
              borderLeft: c.borderLeft ? `2px solid ${borderColor}30` : undefined,
              borderRight: c.borderRight ? `2px solid ${borderColor}30` : undefined,
              borderRadius: c.radius,
            }}
          />
        ))}

        {/* Vertical divider between columns */}
        <div
          style={{
            position: "absolute",
            top: 120,
            bottom: 120,
            left: 1100,
            width: 1,
            background: `linear-gradient(180deg, transparent 0%, ${borderColor}18 25%, ${borderColor}25 50%, ${borderColor}18 75%, transparent 100%)`,
          }}
        />

        {/* ── LEFT COLUMN — editorial content ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1100,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px 0 160px",
          }}
        >
          {/* Top row: icon badges + LIVE pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 56,
            }}
          >
            {/* Claude badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: `${bgPanel}CC`,
                  border: `1px solid ${borderColor}28`,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 5,
                }}
              >
                <img
                  src="/icons/claude.svg"
                  alt="Claude"
                  style={{ width: 30, height: 30, objectFit: "contain" }}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: `${mutedText}55`,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                {cover.badge1}
              </span>
            </div>

            <span style={{ color: `${borderColor}30`, fontSize: 16 }}>×</span>

            {/* Codex badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: `${bgPanel}CC`,
                  border: `1px solid ${borderColor}28`,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 5,
                }}
              >
                <img
                  src="/icons/codex.svg"
                  alt="Codex"
                  style={{ width: 30, height: 30, objectFit: "contain" }}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: `${mutedText}55`,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                {cover.badge2}
              </span>
            </div>

            {/* Separator */}
            <div
              style={{
                width: 1,
                height: 22,
                background: `${borderColor}20`,
                margin: "0 4px",
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
                padding: "0 14px",
                height: 30,
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
          </div>

          {/* Main title — level 1: 92px */}
          <h1
            style={{
              fontSize: 92,
              fontWeight: 700,
              color: textColor,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              margin: 0,
              marginBottom: 48,
            }}
          >
            {cover.title}
          </h1>

          {/* Thin divider */}
          <div
            style={{
              width: 40,
              height: 2,
              background: `linear-gradient(90deg, ${borderColor}55, transparent)`,
              marginBottom: 36,
              borderRadius: 1,
            }}
          />

          {/* Manifesto lines — level 2: 52px serif */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: 36,
            }}
          >
            {[cover.manifestoLine1, cover.manifestoLine2, cover.manifestoLine3].map(
              (line, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                    fontSize: 52,
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

          {/* Chinese hook text — level 3: 24px */}
          {cover.hookText && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: cyanAccent,
                letterSpacing: "0.02em",
                marginBottom: 20,
                opacity: 0.9,
              }}
            >
              {cover.hookText}
            </div>
          )}

          {/* Closing sentence — level 4: 20px */}
          <div
            style={{
              fontSize: 20,
              color: mutedText,
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: "0 6px",
              lineHeight: 1.6,
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
            <span style={{ color: `${mutedText}60` }}>{cover.closingSuffix}</span>
          </div>
        </div>

        {/* ── RIGHT COLUMN — avatar + today's topic ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 820,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 100px",
            gap: 52,
          }}
        >
          {/* Avatar */}
          {cover.avatarVisible && (
            <div style={{ position: "relative" }}>
              {/* Outer glow ring */}
              <div
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  background: `conic-gradient(from 0deg, ${borderColor}50, ${cyanAccent}40, ${pinkAccent}30, ${borderColor}50)`,
                  zIndex: 0,
                }}
              />
              {/* Inner border ring */}
              <div
                style={{
                  position: "absolute",
                  inset: -2,
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
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}

          {/* Today's topic card */}
          <div
            style={{
              width: "100%",
              background: `${bgPanel}CC`,
              border: `1px solid ${borderColor}22`,
              borderRadius: 16,
              padding: "28px 32px",
              backdropFilter: "blur(8px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Card top accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, ${warmAccent}60, ${cyanAccent}40, transparent)`,
                borderRadius: "16px 16px 0 0",
              }}
            />
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: warmAccent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 14,
                opacity: 0.9,
              }}
            >
              {cover.todayLabel}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: textColor,
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
              }}
            >
              {cover.todayTopic}
            </div>
          </div>
        </div>

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

CoverCanvas.displayName = "CoverCanvas";
export default CoverCanvas;
