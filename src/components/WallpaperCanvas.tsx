import { forwardRef } from "react";
import type { OverlayState } from "../types";
import { avatarPlaceholder } from "../lib/avatar";
import { patchSection } from "../lib/state";
import { fontFamilies } from "../lib/typography";
import { useLocale } from "../hooks/useLocale";
import { UI_COLORS } from "../lib/design-tokens";
import {
  HORIZONTAL_BASE,
  PORTRAIT_BASE,
  type WallpaperPreset,
} from "../lib/wallpaper";
import EditableText from "./edit/EditableText";
import { EDITORIAL_PALETTE as E } from "./lib/editorial-palette";
import AvatarCircle from "./shared/AvatarCircle";
import BadgeToolbar from "./shared/BadgeToolbar";
import SocialCard from "./shared/SocialCard";

interface WallpaperCanvasProps {
  state: OverlayState;
  preset: WallpaperPreset;
  /** When true (preview mode), text fields can be double-clicked to edit. */
  editable?: boolean;
  onChange?: (next: OverlayState) => void;
}

const AVATAR_PLACEHOLDER = avatarPlaceholder("rgba(245,245,242,0.5)", "VC", 56);

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
      onChange(patchSection(state, "cover", patch));
    };
    const writeWallpaper = (patch: Partial<OverlayState["wallpaper"]>) => {
      if (!onChange) return;
      onChange(patchSection(state, "wallpaper", patch));
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
        data-testid={`wallpaper-canvas-${preset.id}`}
        style={{
          width: preset.width,
          height: preset.height,
          position: "relative",
          background: UI_COLORS.appBackground,
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
            scale={scale}
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
            scale={scale}
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
  scale: number;
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
  scale,
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
          <AvatarCircle
            src={avatarSrc}
            size={S(620)}
            borderInset={S(8)}
            borderWidth={S(1)}
          />
        </div>
      )}

      {/* Bottom band: badges + social side by side */}
      <div
        style={{
          position: "absolute",
          left: S(200),
          right: S(200),
          bottom: S(160),
          display: "flex",
          alignItems: "flex-end",
          gap: S(48),
        }}
      >
        {visibleBadges.length > 0 && (
          <BadgeToolbar
            badges={cover.badges}
            scale={scale}
            readonly={readonly}
            onBadgeLabelChange={writeBadgeLabel}
            labelColor={E.muted}
            background="rgba(255,255,255,0.05)"
            border="1px solid rgba(255,255,255,0.1)"
            borderRadius={20}
            paddingY={22}
            paddingX={44}
            outerGap={28}
            itemGap={18}
            iconSize={40}
            labelFontSize={30}
            separatorFontSize={22}
            separatorColor="rgba(255,255,255,0.2)"
          />
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
  scale,
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
          padding: `${S(440)}px ${S(80)}px ${S(320)}px`,
          boxSizing: "border-box",
          gap: S(32),
        }}
      >
      {wallpaper.avatarVisible && (
        <AvatarCircle
          src={avatarSrc}
          size={S(440)}
          borderInset={S(8)}
          borderWidth={S(1)}
        />
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
        <BadgeToolbar
          badges={cover.badges}
          scale={scale}
          readonly={readonly}
          onBadgeLabelChange={writeBadgeLabel}
          labelColor={E.muted}
          background="rgba(255,255,255,0.04)"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius={20}
          paddingY={18}
          paddingX={40}
          outerGap={28}
          itemGap={20}
          iconSize={40}
          labelFontSize={30}
          separatorFontSize={22}
        />
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
