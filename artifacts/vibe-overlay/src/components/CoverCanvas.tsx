import { forwardRef } from "react";
import { OverlayState } from "../types";

interface CoverCanvasProps {
  state: OverlayState;
}

const CoverCanvas = forwardRef<HTMLDivElement, CoverCanvasProps>(
  ({ state }, ref) => {
    const { cover, colors } = state;
    const { bgDark, bgPanel, borderColor, textColor, mutedText, cyanAccent, pinkAccent, warmAccent } = colors;

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* Grid pattern background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(${borderColor}08 1px, transparent 1px),
              linear-gradient(90deg, ${borderColor}08 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />

        {/* Radial glow center */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${bgPanel}CC 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Top accent gradient bar */}
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
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 60,
            height: 60,
            borderTop: `2px solid ${borderColor}40`,
            borderLeft: `2px solid ${borderColor}40`,
            borderRadius: "2px 0 0 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 60,
            height: 60,
            borderTop: `2px solid ${borderColor}40`,
            borderRight: `2px solid ${borderColor}40`,
            borderRadius: "0 2px 0 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            width: 60,
            height: 60,
            borderBottom: `2px solid ${borderColor}40`,
            borderLeft: `2px solid ${borderColor}40`,
            borderRadius: "0 0 0 2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            width: 60,
            height: 60,
            borderBottom: `2px solid ${borderColor}40`,
            borderRight: `2px solid ${borderColor}40`,
            borderRadius: "0 0 2px 0",
          }}
        />

        {/* App Icon Badges */}
        <div
          style={{
            display: "flex",
            gap: 28,
            marginBottom: 56,
            zIndex: 1,
            alignItems: "flex-end",
          }}
        >
          {/* Claude icon */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: `${bgPanel}CC`,
                border: `1px solid ${borderColor}35`,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
              }}
            >
              <img
                src="/icons/claude.svg"
                alt="Claude"
                style={{ width: 48, height: 48, objectFit: "contain" }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                color: `${mutedText}70`,
                letterSpacing: "0.06em",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              {cover.badge1}
            </span>
          </div>

          {/* × separator */}
          <div
            style={{
              fontSize: 28,
              color: `${borderColor}40`,
              fontWeight: 300,
              marginBottom: 28,
              lineHeight: 1,
            }}
          >
            ×
          </div>

          {/* Codex icon */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: `${bgPanel}CC`,
                border: `1px solid ${borderColor}35`,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
              }}
            >
              <img
                src="/icons/codex.svg"
                alt="Codex"
                style={{ width: 48, height: 48, objectFit: "contain" }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                color: `${mutedText}70`,
                letterSpacing: "0.06em",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              {cover.badge2}
            </span>
          </div>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: textColor,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            textAlign: "center",
            zIndex: 1,
            margin: 0,
            marginBottom: 28,
            maxWidth: 1400,
          }}
        >
          {cover.title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 32,
            color: mutedText,
            fontWeight: 300,
            letterSpacing: "0.02em",
            textAlign: "center",
            zIndex: 1,
            margin: 0,
            marginBottom: 80,
          }}
        >
          {cover.subtitle}
        </p>

        {/* Decorative divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 120,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${borderColor}50)`,
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: warmAccent,
              opacity: 0.7,
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: `${mutedText}60`,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            LIVE
          </div>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: warmAccent,
              opacity: 0.7,
            }}
          />
          <div
            style={{
              width: 120,
              height: 1,
              background: `linear-gradient(90deg, ${borderColor}50, transparent)`,
            }}
          />
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
