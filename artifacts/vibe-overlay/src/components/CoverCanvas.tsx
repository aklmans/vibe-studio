import { forwardRef } from "react";
import { OverlayState } from "../types";
import { fontFamilies, typography } from "../lib/typography";

interface CoverCanvasProps {
  state: OverlayState;
}

/* ── Cover-specific editorial palette ──────────────────────────── */
const C = {
  bg1: "#0B1020",
  bg2: "#111827",
  text: "#F5F5F2",
  muted: "#C7C9D1",
  subtle: "#5A6178",
  accent: "#DA7756",
  glassBorder: "rgba(255, 255, 255, 0.06)",
} as const;

const AVATAR_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E2438"/>
      <stop offset="100%" stop-color="#2A3350"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#g)"/>
  <text x="100" y="118" text-anchor="middle" font-family="system-ui,sans-serif"
    font-size="56" font-weight="500" fill="rgba(245,245,242,0.5)">VC</text>
</svg>
`)}`;

const CoverCanvas = forwardRef<HTMLDivElement, CoverCanvasProps>(
  ({ state }, ref) => {
    const { cover } = state;
    const avatarSrc = cover.avatarUrl || AVATAR_PLACEHOLDER;

    return (
      <div
        ref={ref}
        data-testid="cover-canvas"
        style={{
          width: 1920,
          height: 1080,
          position: "relative",
          background: `linear-gradient(170deg, ${C.bg2} 0%, ${C.bg1} 55%, #0A0E1A 100%)`,
          fontFamily: fontFamilies.sans,
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
              linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
            `,
            backgroundSize: "128px 128px",
            pointerEvents: "none",
          }}
        />

        {/* Center radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 70% 80% at 50% 50%, ${C.bg2}F0 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* ── Ghost UI corners (4–8% alpha, dev-environment storytelling) ── */}

        {/* Top-left: terminal window */}
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 96,
            width: 360,
            height: 220,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.025)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              height: 28,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 6,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.10)",
                }}
              />
            ))}
          </div>
          {[80, 55, 70, 40, 65, 50].map((w, i) => (
            <div
              key={i}
              style={{
                margin: "10px 16px 0",
                height: 3,
                width: `${w}%`,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 2,
              }}
            />
          ))}
        </div>

        {/* Top-right: chat panel */}
        <div
          style={{
            position: "absolute",
            top: 96,
            right: 96,
            width: 320,
            height: 220,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            pointerEvents: "none",
          }}
        >
          {[60, 45, 75, 50, 65].map((w, i) => (
            <div
              key={i}
              style={{
                margin: `${i === 0 ? 18 : 14}px ${i % 2 === 0 ? "auto" : "16px"} 0 ${i % 2 === 0 ? "16px" : "auto"}`,
                height: 14,
                width: `${w}%`,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 7,
              }}
            />
          ))}
        </div>

        {/* Bottom-left: commit graph */}
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: 120,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            pointerEvents: "none",
          }}
        >
          {[200, 160, 220, 140, 180, 130].map((w, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: i === 0 ? `${C.accent}55` : "rgba(255,255,255,0.10)",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  height: 2,
                  width: w,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 1,
                }}
              />
            </div>
          ))}
        </div>

        {/* Bottom-right: workflow cards */}
        <div
          style={{
            position: "absolute",
            bottom: 96,
            right: 120,
            display: "flex",
            gap: 14,
            pointerEvents: "none",
          }}
        >
          {[
            { w: 130, h: 92 },
            { w: 110, h: 92 },
            { w: 120, h: 92 },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                width: card.w,
                height: card.h,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.025)",
              }}
            />
          ))}
        </div>

        {/* Top accent bar (paired with bottom) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent 15%, ${C.accent}55 50%, transparent 85%)`,
          }}
        />

        {/* Bottom accent bar (mirrored) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent 15%, ${C.accent}55 50%, transparent 85%)`,
          }}
        />

        {/* Subtle warm accent glow under hero */}
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 360,
            background: `radial-gradient(ellipse at center, ${C.accent}10 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* ── macOS-style toolbar — Claude × Codex (top, larger & brighter) ── */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 24px",
          }}
        >
          <img
            src="/icons/claude.svg"
            alt="Claude"
            style={{ width: 20, height: 20, objectFit: "contain", opacity: 0.85 }}
          />
          <span
            style={{
              fontSize: 14,
              color: C.muted,
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            {cover.badge1}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>×</span>
          <img
            src="/icons/codex.svg"
            alt="Codex"
            style={{ width: 20, height: 20, objectFit: "contain", opacity: 0.85 }}
          />
          <span
            style={{
              fontSize: 14,
              color: C.muted,
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            {cover.badge2}
          </span>
        </div>

        {/* ── Hero: avatar (left) + title block (right), horizontal ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 56,
            padding: "0 160px",
          }}
        >
          {/* Avatar — 240px, left side */}
          {cover.avatarVisible && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.08)",
                  zIndex: 0,
                }}
              />
              <img
                src={avatarSrc}
                alt="Avatar"
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: 240,
                  height: 240,
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Faint screen-light reflection */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 160,
                  height: 48,
                  background:
                    "radial-gradient(ellipse at center bottom, rgba(255,255,255,0.05), transparent 80%)",
                  borderRadius: "50%",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
            </div>
          )}

          {/* Title block */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: 1080,
            }}
          >
            {/* Eyebrow — hookText, uppercased small label above title */}
            {cover.hookVisible && cover.hookText && (
              <div
                style={{
                  ...typography.eyebrow,
                  color: C.subtle,
                  letterSpacing: "0.18em",
                  marginBottom: 18,
                }}
              >
                {cover.hookText}
              </div>
            )}

            {/* Main title — serif, editorial */}
            <h1
              style={{
                ...typography.display,
                fontFamily: fontFamilies.serif,
                fontSize: 96,
                fontWeight: 600,
                color: C.text,
                letterSpacing: "-0.015em",
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              {cover.title}
            </h1>

            {/* TODAY'S BUILD card — solid translucent panel */}
            <div
              style={{
                marginTop: 40,
                background: "rgba(17, 24, 39, 0.85)",
                border: `1px solid ${C.glassBorder}`,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
                borderRadius: 14,
                padding: "20px 32px 22px",
                position: "relative",
                minWidth: 480,
              }}
            >
              {/* Tiny accent line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 32,
                  width: 60,
                  height: 1.5,
                  background: `${C.accent}80`,
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.subtle,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {cover.todayLabel}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 500,
                  color: C.text,
                  lineHeight: 1.3,
                  letterSpacing: "0.01em",
                }}
              >
                {cover.todayTopic}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CoverCanvas.displayName = "CoverCanvas";
export default CoverCanvas;
