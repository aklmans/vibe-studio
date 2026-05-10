import { forwardRef } from "react";
import { OverlayState } from "../types";
import { avatarPlaceholder } from "../lib/avatar";
import { patchSection } from "../lib/state";
import { fontFamilies, typography } from "../lib/typography";
import { useLocale } from "../hooks/useLocale";
import SocialList from "./SocialList";
import EditableText from "./edit/EditableText";
import { EDITORIAL_PALETTE as E } from "./lib/editorial-palette";
import AvatarCircle from "./shared/AvatarCircle";
import BadgeToolbar from "./shared/BadgeToolbar";

interface PosterCanvasProps {
  state: OverlayState;
  /** When true (preview mode), text fields can be double-clicked to edit. */
  editable?: boolean;
  onChange?: (next: OverlayState) => void;
}

const AVATAR_PLACEHOLDER = avatarPlaceholder("rgba(245,245,242,0.5)", "VC", 56);

const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(
  ({ state, editable = false, onChange }, ref) => {
    const { t } = useLocale();
    const { cover } = state;

    const avatarSrc = cover.avatarUrl || AVATAR_PLACEHOLDER;
    const hasOptionalContent =
      cover.manifestoVisible || cover.closingVisible;
    const readonly = !editable || !onChange;

    const writeCover = (patch: Partial<OverlayState["cover"]>) => {
      if (!onChange) return;
      onChange(patchSection(state, "cover", patch));
    };

    const writeBadgeLabel = (originalIdx: number, label: string) => {
      if (!onChange) return;
      const badges = state.cover.badges.map((b, i) =>
        i === originalIdx ? { ...b, label } : b,
      );
      onChange(patchSection(state, "cover", { badges }));
    };

    return (
      <div
        ref={ref}
        data-testid="cover-canvas"
        style={{
          width: 1920,
          height: 1080,
          position: "relative",
          background: `linear-gradient(170deg, ${E.bg2} 0%, ${E.bg1} 55%, ${E.bg3} 100%)`,
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

        {/* Left-biased radial glow behind title */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 90% at 35% 50%, ${E.bg2}F0 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* Warm accent glow behind avatar */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 50% 60% at 78% 48%, ${E.accent}12 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* ── Ghost UI corners ── */}

        {/* Bottom-left: commit graph */}
        <div
          style={{
            position: "absolute",
            bottom: 110,
            left: 120,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            pointerEvents: "none",
          }}
        >
          {[180, 140, 200, 120, 160].map((w, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    i === 0 ? `${E.accent}55` : "rgba(255,255,255,0.10)",
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

        {/* Top-right: chat panel */}
        <div
          style={{
            position: "absolute",
            top: 96,
            right: 96,
            width: 280,
            height: 180,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            pointerEvents: "none",
          }}
        >
          {[60, 45, 75, 50].map((w, i) => (
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

        {/* Top accent bar (paired with bottom) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent 15%, ${E.accent}55 50%, transparent 85%)`,
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
            background: `linear-gradient(90deg, transparent 15%, ${E.accent}55 50%, transparent 85%)`,
          }}
        />

        {/* Vertical column divider */}
        <div
          style={{
            position: "absolute",
            top: 200,
            bottom: 200,
            left: 1120,
            width: 1,
            background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent)`,
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
          {/* ── Agent badges toolbar — same style as CoverCanvas, but in flow ── */}
          <BadgeToolbar
            badges={cover.badges}
            readonly={readonly}
            onBadgeLabelChange={writeBadgeLabel}
            labelColor={E.muted}
            style={{
              alignSelf: "flex-start",
              marginBottom: hasOptionalContent ? 28 : 36,
            }}
          />

          {/* Eyebrow — hookText */}
          {cover.hookVisible && cover.hookText && (
            <EditableText
              readonly={readonly}
              value={cover.hookText}
              onCommit={(v) => writeCover({ hookText: v })}
              as="div"
              ariaLabel="Hook text"
              style={{
                ...typography.eyebrow,
                color: E.subtle,
                letterSpacing: "0.18em",
                marginBottom: 18,
              }}
            />
          )}

          {/* Main title — serif, editorial */}
          <EditableText
            readonly={readonly}
            value={cover.title}
            onCommit={(v) => writeCover({ title: v })}
            as="h1"
            ariaLabel="Poster title"
            style={{
              fontFamily: fontFamilies.serif,
              fontSize: hasOptionalContent ? 88 : 96,
              fontWeight: 600,
              color: E.text,
              letterSpacing: "-0.015em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 40,
            }}
          />

          {/* Today's topic card */}
          <div
            style={{
              width: 720,
              boxSizing: "border-box",
              background: "rgba(17, 24, 39, 0.85)",
              border: `1px solid ${E.glassBorder}`,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
              borderRadius: 14,
              padding: "20px 32px 22px",
              position: "relative",
              marginBottom: hasOptionalContent ? 36 : 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 32,
                width: 60,
                height: 1.5,
                background: `${E.accent}80`,
                borderRadius: 1,
              }}
            />
            {/* UPCOMING pill — top-right, semantic pair with TODAY'S BUILD */}
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: `${E.accent}18`,
                border: `1px solid ${E.accent}55`,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: E.accent,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: E.accent,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {t("canvas.upcoming")}
              </span>
            </div>
            <EditableText
              readonly={readonly}
              value={cover.todayLabel}
              onCommit={(v) => writeCover({ todayLabel: v })}
              as="div"
              ariaLabel="Today label"
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: E.subtle,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            />
            <EditableText
              readonly={readonly}
              value={cover.todayTopic}
              onCommit={(v) => writeCover({ todayTopic: v })}
              as="div"
              ariaLabel="Today topic"
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: E.text,
                lineHeight: 1.3,
                letterSpacing: "0.01em",
              }}
            />
          </div>

          {/* Optional section divider */}
          {hasOptionalContent && (
            <div
              style={{
                width: 36,
                height: 1.5,
                background: `linear-gradient(90deg, ${E.accent}55, transparent)`,
                marginBottom: 28,
                borderRadius: 1,
              }}
            />
          )}

          {/* Manifesto — optional, serif (matches main title family) */}
          {cover.manifestoVisible && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                marginBottom: cover.closingVisible ? 28 : 0,
              }}
            >
              {[cover.manifestoLine1, cover.manifestoLine2, cover.manifestoLine3].map(
                (line, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: fontFamilies.serif,
                      fontSize: 48,
                      lineHeight: 1.05,
                      fontWeight: 600,
                      letterSpacing: "-0.015em",
                      color: E.text,
                    }}
                  >
                    {line}
                  </div>
                )
              )}
            </div>
          )}

          {/* Closing sentence — optional */}
          {cover.closingVisible && (
            <div
              style={{
                fontSize: 20,
                color: E.muted,
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: "0 6px",
                lineHeight: 1.6,
                opacity: 0.9,
              }}
            >
              <span>{cover.closingPrefix}</span>
              <span
                style={{
                  textDecoration: "line-through",
                  textDecorationColor: `${E.accent}80`,
                  textDecorationThickness: 2,
                  color: E.subtle,
                }}
              >
                {cover.closingStruck}
              </span>
              <span style={{ color: E.accent, fontWeight: 600 }}>
                {cover.closingHighlight}
              </span>
              <span style={{ color: `${E.muted}80` }}>{cover.closingSuffix}</span>
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
          {/* Avatar — editorial, simple inner hairline ring (no conic gradient) */}
          {cover.avatarVisible && (
            <AvatarCircle
              src={avatarSrc}
              size={260}
              borderInset={4}
              reflection={{ width: 180, height: 52 }}
            />
          )}

          {/* Social info block */}
          {cover.socialVisible && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                alignItems: "stretch",
                padding: "28px 36px",
                background: "rgba(17, 24, 39, 0.78)",
                border: `1px solid ${E.glassBorder}`,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
                borderRadius: 14,
                minWidth: 340,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: E.subtle,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div style={{ width: 3, height: 12, borderRadius: 2, background: E.accent, flexShrink: 0 }} />
                {t("canvas.followMe")}
              </div>
              <SocialList state={state} size="large" editable={editable} onChange={onChange} />
            </div>
          )}
        </div>
      </div>
    );
  },
);

PosterCanvas.displayName = "PosterCanvas";
export default PosterCanvas;
