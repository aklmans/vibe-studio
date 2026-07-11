import { forwardRef } from "react";
import { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import { fontFamilies, typography, wrapProse } from "../lib/typography";
import { useLocale } from "../hooks/useLocale";
import SocialList from "./SocialList";
import EditableText from "./edit/EditableText";
import { editorialPalette } from "./lib/editorial-palette";
import AvatarCircle from "./shared/AvatarCircle";
import BadgeToolbar from "./shared/BadgeToolbar";

interface PosterCanvasProps {
  state: OverlayState;
  /** When true (preview mode), text fields can be double-clicked to edit. */
  editable?: boolean;
  onChange?: (next: OverlayState) => void;
}

// An empty avatar url falls back to the built-in default portrait —
// the product ships with a face, never a monogram placeholder.
const AVATAR_PLACEHOLDER = "/avatar.png";

const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(
  ({ state, editable = false, onChange }, ref) => {
    const { t } = useLocale();
    const { cover } = state;
    const E = editorialPalette(state.colors);

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
        {/* Vertical column divider — single quiet hairline */}
        <div
          style={{
            position: "absolute",
            top: 240,
            bottom: 240,
            left: 1120,
            width: 1,
            background: E.hairline,
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
            background="transparent"
            border={`1px solid ${E.line}`}
            borderRadius={3}
            separatorColor={E.subtle}
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
                fontFamily: fontFamilies.mono,
                color: E.subtle,
                letterSpacing: "0.2em",
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
              ...wrapProse,
              fontFamily: fontFamilies.serif,
              fontSize: hasOptionalContent ? 88 : 96,
              fontWeight: 600,
              color: E.text,
              letterSpacing: "-0.015em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 40,
              maxWidth: 864,
            }}
          />

          {/* Today's topic card */}
          <div
            style={{
              width: 720,
              boxSizing: "border-box",
              background: `${E.bg2}80`,
              border: `1px solid ${E.line}`,
              borderRadius: 4,
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
            {/* UPCOMING — quiet mono label + small accent dot, not a pill */}
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 22,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
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
                  fontFamily: fontFamilies.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  color: E.accent,
                  letterSpacing: "0.18em",
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
                fontFamily: fontFamilies.mono,
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
                ...wrapProse,
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
                      ...wrapProse,
                      fontFamily: fontFamilies.serif,
                      fontSize: 48,
                      lineHeight: 1.05,
                      fontWeight: 600,
                      letterSpacing: "-0.015em",
                      color: E.text,
                      maxWidth: 864,
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
                ...wrapProse,
                fontSize: 20,
                color: E.muted,
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: "0 6px",
                lineHeight: 1.6,
                opacity: 0.9,
                maxWidth: 864,
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
              borderColor={E.rule}
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
                padding: "26px 34px",
                background: `${E.bg2}66`,
                border: `1px solid ${E.line}`,
                borderRadius: 4,
                minWidth: 340,
              }}
            >
              <div
                style={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: E.subtle,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div style={{ width: 2, height: 13, background: E.accent, flexShrink: 0 }} />
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
