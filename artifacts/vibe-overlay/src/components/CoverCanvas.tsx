import { forwardRef } from "react";
import { OverlayState } from "../types";

interface CoverCanvasProps {
  state: OverlayState;
}

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

        {/* Radial glow — left-center biased for editorial feel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 90% 70% at 40% 55%, ${bgPanel}D0 0%, transparent 70%)`,
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
              borderTop: c.borderTop ? `2px solid ${borderColor}35` : undefined,
              borderBottom: c.borderBottom ? `2px solid ${borderColor}35` : undefined,
              borderLeft: c.borderLeft ? `2px solid ${borderColor}35` : undefined,
              borderRight: c.borderRight ? `2px solid ${borderColor}35` : undefined,
              borderRadius: c.radius,
            }}
          />
        ))}

        {/* ── Main content — left-aligned editorial layout ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 160px",
          }}
        >
          {/* Top row: icon badges + LIVE pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 72,
            }}
          >
            {/* Claude badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: `${bgPanel}CC`,
                  border: `1px solid ${borderColor}30`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                }}
              >
                <img
                  src="/icons/claude.svg"
                  alt="Claude"
                  style={{ width: 32, height: 32, objectFit: "contain" }}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: `${mutedText}60`,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                {cover.badge1}
              </span>
            </div>

            <span style={{ color: `${borderColor}35`, fontSize: 18 }}>×</span>

            {/* Codex badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: `${bgPanel}CC`,
                  border: `1px solid ${borderColor}30`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                }}
              >
                <img
                  src="/icons/codex.svg"
                  alt="Codex"
                  style={{ width: 32, height: 32, objectFit: "contain" }}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: `${mutedText}60`,
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
                height: 24,
                background: `${borderColor}25`,
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
                height: 32,
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

          {/* Main title */}
          <h1
            style={{
              fontSize: 100,
              fontWeight: 700,
              color: textColor,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              margin: 0,
              marginBottom: 64,
            }}
          >
            {cover.title}
          </h1>

          {/* Thin divider */}
          <div
            style={{
              width: 48,
              height: 2,
              background: `linear-gradient(90deg, ${borderColor}60, transparent)`,
              marginBottom: 48,
              borderRadius: 1,
            }}
          />

          {/* Manifesto lines */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 36,
            }}
          >
            {[cover.manifestoLine1, cover.manifestoLine2, cover.manifestoLine3].map(
              (line, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                    fontSize: 64,
                    lineHeight: 0.95,
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

          {/* Closing sentence */}
          <div
            style={{
              fontSize: 24,
              color: mutedText,
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: "0 8px",
              lineHeight: 1.5,
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
            <span
              style={{
                color: warmAccent,
                fontWeight: 700,
              }}
            >
              {cover.closingHighlight}
            </span>
            <span style={{ color: `${mutedText}80` }}>{cover.closingSuffix}</span>
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
