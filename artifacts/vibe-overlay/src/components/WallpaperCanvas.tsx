import { forwardRef } from "react";
import type { OverlayState } from "../types";
import { fontFamilies } from "../lib/typography";
import { badgeIconUrl } from "../lib/badges";
import { socialStyle } from "../lib/socials";
import { useLocale } from "../hooks/useLocale";
import {
  HORIZONTAL_BASE,
  PORTRAIT_BASE,
  type WallpaperPreset,
} from "../lib/wallpaper";
import EditableText from "./edit/EditableText";

interface WallpaperCanvasProps {
  state: OverlayState;
  preset: WallpaperPreset;
  /** When true (preview mode), text fields can be double-clicked to edit. */
  editable?: boolean;
  onChange?: (next: OverlayState) => void;
}

/* Editorial palette, shared with Cover/Poster so the wallpaper reads as the
 * same brand even when the layout is different. */
const E = {
  bg1: "#0B1020",
  bg2: "#111827",
  bg3: "#0A0E1A",
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

const WallpaperCanvas = forwardRef<HTMLDivElement, WallpaperCanvasProps>(
  ({ state, preset, editable = false, onChange }, ref) => {
    const { t } = useLocale();
    const { cover, wallpaper } = state;
    const isPortrait = preset.orientation === "portrait";
    const base = isPortrait ? PORTRAIT_BASE : HORIZONTAL_BASE;
    const scale = preset.width / base.width;
    const S = (n: number) => Math.round(n * scale);

    const avatarSrc = cover.avatarUrl || AVATAR_PLACEHOLDER;
    const visibleBadges = wallpaper.badgesVisible
      ? cover.badges.filter((b) => b.visible)
      : [];
    const visibleSocials = wallpaper.socialVisible
      ? cover.socials.filter((s) => s.visible && s.value.trim().length > 0)
      : [];
    const readonly = !editable || !onChange;

    const writeCover = (patch: Partial<OverlayState["cover"]>) => {
      if (!onChange) return;
      onChange({ ...state, cover: { ...state.cover, ...patch } });
    };
    const writeWallpaper = (patch: Partial<OverlayState["wallpaper"]>) => {
      if (!onChange) return;
      onChange({ ...state, wallpaper: { ...state.wallpaper, ...patch } });
    };
    const writeBadgeLabel = (originalIdx: number, label: string) => {
      if (!onChange) return;
      const badges = state.cover.badges.map((b, i) =>
        i === originalIdx ? { ...b, label } : b,
      );
      onChange({ ...state, cover: { ...state.cover, badges } });
    };

    return (
      <div
        ref={ref}
        data-testid={`wallpaper-canvas-${preset.id}`}
        style={{
          width: preset.width,
          height: preset.height,
          position: "relative",
          background: `linear-gradient(${isPortrait ? "180deg" : "170deg"}, ${E.bg2} 0%, ${E.bg1} 55%, ${E.bg3} 100%)`,
          fontFamily: fontFamilies.sans,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
            `,
            backgroundSize: `${S(128)}px ${S(128)}px`,
            pointerEvents: "none",
          }}
        />

        {/* Center radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isPortrait
              ? `radial-gradient(ellipse 90% 50% at 50% 38%, ${E.bg2}E0 0%, transparent 70%)`
              : `radial-gradient(ellipse 75% 90% at 38% 50%, ${E.bg2}F0 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* Warm accent glow behind avatar */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isPortrait
              ? `radial-gradient(ellipse 60% 30% at 50% 30%, ${E.accent}10 0%, transparent 70%)`
              : `radial-gradient(ellipse 40% 70% at 78% 50%, ${E.accent}12 0%, transparent 65%)`,
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
            height: S(3),
            background: `linear-gradient(90deg, transparent 15%, ${E.accent}55 50%, transparent 85%)`,
          }}
        />

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: S(3),
            background: `linear-gradient(90deg, transparent 15%, ${E.accent}55 50%, transparent 85%)`,
          }}
        />

        {isPortrait ? (
          <PortraitLayout
            S={S}
            preset={preset}
            cover={cover}
            wallpaper={wallpaper}
            avatarSrc={avatarSrc}
            visibleBadges={visibleBadges}
            visibleSocials={visibleSocials}
            colors={state.colors}
            readonly={readonly}
            writeCover={writeCover}
            writeWallpaper={writeWallpaper}
            writeBadgeLabel={writeBadgeLabel}
            t={t}
          />
        ) : (
          <HorizontalLayout
            S={S}
            preset={preset}
            cover={cover}
            wallpaper={wallpaper}
            avatarSrc={avatarSrc}
            visibleBadges={visibleBadges}
            visibleSocials={visibleSocials}
            colors={state.colors}
            readonly={readonly}
            writeCover={writeCover}
            writeWallpaper={writeWallpaper}
            writeBadgeLabel={writeBadgeLabel}
            t={t}
          />
        )}
      </div>
    );
  },
);

WallpaperCanvas.displayName = "WallpaperCanvas";
export default WallpaperCanvas;

/* ─── Layout: horizontal (Desktop 4K / QHD) ──────────────────────────────── */

interface LayoutProps {
  S: (n: number) => number;
  preset: WallpaperPreset;
  cover: OverlayState["cover"];
  wallpaper: OverlayState["wallpaper"];
  avatarSrc: string;
  visibleBadges: OverlayState["cover"]["badges"];
  visibleSocials: OverlayState["cover"]["socials"];
  colors: OverlayState["colors"];
  readonly: boolean;
  writeCover: (patch: Partial<OverlayState["cover"]>) => void;
  writeWallpaper: (patch: Partial<OverlayState["wallpaper"]>) => void;
  writeBadgeLabel: (originalIdx: number, label: string) => void;
  t: (key: import("../lib/i18n").TranslationKey) => string;
}

function HorizontalLayout({
  S,
  preset,
  cover,
  wallpaper,
  avatarSrc,
  visibleBadges,
  visibleSocials,
  colors,
  readonly,
  writeCover,
  writeWallpaper,
  writeBadgeLabel,
  t,
}: LayoutProps) {
  /* Title block sits left-of-center, avatar floats right.
   * Badges + social card occupy the bottom band, mirroring across the gutter. */
  return (
    <>
      {/* Vertical column divider — mirrors Poster */}
      <div
        style={{
          position: "absolute",
          top: S(360),
          bottom: S(360),
          left: preset.width * 0.62,
          width: 1,
          background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent)`,
        }}
      />

      {/* Left column: brand → title → slogan */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: preset.width * 0.62,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: `0 ${S(96)}px 0 ${S(200)}px`,
        }}
      >
        {wallpaper.brandLabelVisible && wallpaper.brandLabel && (
          <div
            style={{
              fontSize: S(28),
              fontWeight: 600,
              color: E.subtle,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              marginBottom: S(48),
              display: "flex",
              alignItems: "center",
              gap: S(20),
            }}
          >
            <div
              style={{
                width: S(64),
                height: S(2),
                background: `${E.accent}AA`,
                borderRadius: 1,
              }}
            />
            <EditableText
              readonly={readonly}
              value={wallpaper.brandLabel}
              onCommit={(v) => writeWallpaper({ brandLabel: v })}
              ariaLabel="Brand label"
            />
          </div>
        )}

        <EditableText
          readonly={readonly}
          value={cover.title}
          onCommit={(v) => writeCover({ title: v })}
          as="h1"
          ariaLabel="Wallpaper title"
          style={{
            fontFamily: fontFamilies.serif,
            fontSize: S(208),
            fontWeight: 600,
            color: E.text,
            letterSpacing: "-0.018em",
            lineHeight: 1.02,
            margin: 0,
            marginBottom: wallpaper.sloganVisible && wallpaper.slogan ? S(48) : 0,
          }}
        />

        {wallpaper.sloganVisible && wallpaper.slogan && (
          <EditableText
            readonly={readonly}
            value={wallpaper.slogan}
            onCommit={(v) => writeWallpaper({ slogan: v })}
            as="div"
            ariaLabel="Wallpaper slogan"
            style={{
              fontSize: S(40),
              fontWeight: 400,
              color: E.muted,
              letterSpacing: "0.01em",
              lineHeight: 1.4,
              maxWidth: S(1700),
            }}
          />
        )}
      </div>

      {/* Right column: avatar */}
      {wallpaper.avatarVisible && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: preset.width * 0.38,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                position: "absolute",
                inset: -S(8),
                borderRadius: "50%",
                border: `${S(1)}px solid rgba(255,255,255,0.08)`,
                zIndex: 0,
              }}
            />
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{
                position: "relative",
                zIndex: 1,
                width: S(620),
                height: S(620),
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom band: badges (left) + social card (right) */}
      <div
        style={{
          position: "absolute",
          left: S(200),
          right: S(200),
          bottom: S(160),
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: S(40),
        }}
      >
        {visibleBadges.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: S(28),
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: S(20),
              padding: `${S(18)}px ${S(40)}px`,
            }}
          >
            {visibleBadges.map((badge, i) => {
              const originalIdx = cover.badges.indexOf(badge);
              return (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: S(28) }}
                >
                  {i > 0 && (
                    <span
                      style={{ fontSize: S(22), color: "rgba(255,255,255,0.22)" }}
                    >
                      ×
                    </span>
                  )}
                  {badgeIconUrl(badge) && (
                    <img
                      src={badgeIconUrl(badge)}
                      alt={badge.label}
                      style={{
                        width: S(40),
                        height: S(40),
                        objectFit: "contain",
                        opacity: 0.85,
                      }}
                    />
                  )}
                  <EditableText
                    readonly={readonly}
                    value={badge.label}
                    onCommit={(v) => writeBadgeLabel(originalIdx, v)}
                    ariaLabel={`Badge ${i + 1} label`}
                    style={{
                      fontSize: S(28),
                      color: E.muted,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        {visibleSocials.length > 0 && (
          <SocialCard S={S} socials={visibleSocials} colors={colors} t={t} />
        )}
      </div>
    </>
  );
}

/* ─── Layout: portrait (Mobile) ──────────────────────────────────────────── */

function PortraitLayout({
  S,
  preset,
  cover,
  wallpaper,
  avatarSrc,
  visibleBadges,
  visibleSocials,
  colors,
  readonly,
  writeCover,
  writeWallpaper,
  writeBadgeLabel,
  t,
}: LayoutProps) {
  /* Stack from top: safe area → avatar → brand → title → slogan → spacer →
   * badges → social card → bottom safe area. Sizes tuned for iPhone Pro Max. */
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${S(440)}px ${S(80)}px ${S(480)}px`,
        boxSizing: "border-box",
        gap: S(36),
      }}
    >
      {wallpaper.avatarVisible && (
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: -S(8),
              borderRadius: "50%",
              border: `${S(1)}px solid rgba(255,255,255,0.08)`,
              zIndex: 0,
            }}
          />
          <img
            src={avatarSrc}
            alt="Avatar"
            style={{
              position: "relative",
              zIndex: 1,
              width: S(440),
              height: S(440),
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}

      {wallpaper.brandLabelVisible && wallpaper.brandLabel && (
        <div
          style={{
            fontSize: S(34),
            fontWeight: 600,
            color: E.subtle,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: S(18),
            marginTop: S(20),
          }}
        >
          <div
            style={{
              width: S(46),
              height: S(2),
              background: `${E.accent}AA`,
              borderRadius: 1,
            }}
          />
          <EditableText
            readonly={readonly}
            value={wallpaper.brandLabel}
            onCommit={(v) => writeWallpaper({ brandLabel: v })}
            ariaLabel="Brand label"
          />
          <div
            style={{
              width: S(46),
              height: S(2),
              background: `${E.accent}AA`,
              borderRadius: 1,
            }}
          />
        </div>
      )}

      <EditableText
        readonly={readonly}
        value={cover.title}
        onCommit={(v) => writeCover({ title: v })}
        as="h1"
        ariaLabel="Wallpaper title"
        style={{
          fontFamily: fontFamilies.serif,
          fontSize: S(160),
          fontWeight: 600,
          color: E.text,
          letterSpacing: "-0.018em",
          lineHeight: 1.02,
          margin: 0,
          textAlign: "center",
          maxWidth: preset.width - S(160),
        }}
      />

      {wallpaper.sloganVisible && wallpaper.slogan && (
        <EditableText
          readonly={readonly}
          value={wallpaper.slogan}
          onCommit={(v) => writeWallpaper({ slogan: v })}
          as="div"
          ariaLabel="Wallpaper slogan"
          style={{
            fontSize: S(44),
            fontWeight: 400,
            color: E.muted,
            letterSpacing: "0.01em",
            lineHeight: 1.4,
            textAlign: "center",
            maxWidth: preset.width - S(200),
          }}
        />
      )}

      {/* Spacer pushes badges + socials toward the lower third */}
      <div style={{ flex: 1, minHeight: S(40) }} />

      {visibleBadges.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: S(28),
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: S(20),
            padding: `${S(18)}px ${S(40)}px`,
          }}
        >
          {visibleBadges.map((badge, i) => {
            const originalIdx = cover.badges.indexOf(badge);
            return (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: S(20) }}
              >
                {i > 0 && (
                  <span
                    style={{ fontSize: S(22), color: "rgba(255,255,255,0.22)" }}
                  >
                    ×
                  </span>
                )}
                {badgeIconUrl(badge) && (
                  <img
                    src={badgeIconUrl(badge)}
                    alt={badge.label}
                    style={{
                      width: S(40),
                      height: S(40),
                      objectFit: "contain",
                      opacity: 0.85,
                    }}
                  />
                )}
                <EditableText
                  readonly={readonly}
                  value={badge.label}
                  onCommit={(v) => writeBadgeLabel(originalIdx, v)}
                  ariaLabel={`Badge ${i + 1} label`}
                  style={{
                    fontSize: S(30),
                    color: E.muted,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {visibleSocials.length > 0 && (
        <SocialCard
          S={S}
          socials={visibleSocials}
          colors={colors}
          fullWidth
          t={t}
        />
      )}
    </div>
  );
}

/* ─── Social card — wallpaper-tuned size, shared by both layouts ─────────── */

interface SocialCardProps {
  S: (n: number) => number;
  socials: OverlayState["cover"]["socials"];
  colors: OverlayState["colors"];
  fullWidth?: boolean;
  t: (key: import("../lib/i18n").TranslationKey) => string;
}

function SocialCard({ S, socials, colors, fullWidth, t }: SocialCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: S(22),
        padding: `${S(36)}px ${S(48)}px`,
        background: "rgba(17, 24, 39, 0.78)",
        border: `1px solid ${E.glassBorder}`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
        borderRadius: S(22),
        minWidth: fullWidth ? undefined : S(640),
        width: fullWidth ? "100%" : undefined,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: S(20),
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: E.subtle,
          display: "flex",
          alignItems: "center",
          gap: S(14),
          marginBottom: S(4),
        }}
      >
        <div
          style={{
            width: S(4),
            height: S(18),
            borderRadius: 2,
            background: E.accent,
            flexShrink: 0,
          }}
        />
        {t("canvas.followMe")}
      </div>
      {socials.map((social, idx) => {
        const style = socialStyle(social, colors);
        return (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", gap: S(24) }}
          >
            <span
              style={{
                ...style,
                fontSize: S(24),
                fontWeight: 600,
                borderRadius: S(8),
                padding: `${S(8)}px ${S(20)}px`,
                flexShrink: 0,
                minWidth: S(140),
                textAlign: "center",
                boxSizing: "border-box",
                letterSpacing: "0.04em",
                border: "1px solid transparent",
              }}
            >
              {social.label}
            </span>
            <span
              style={{
                fontSize: S(32),
                color: colors.textColor,
                fontWeight: 500,
                letterSpacing: "0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {social.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
