import { forwardRef } from "react";
import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import { fontFamilies, wrapProse } from "../lib/typography";
import { useLocale } from "../hooks/useLocale";
import {
  HORIZONTAL_BASE,
  PORTRAIT_BASE,
  type WallpaperPreset,
} from "../lib/wallpaper";
import EditableText from "./edit/EditableText";
import { editorialPalette, type EditorialPalette } from "./lib/editorial-palette";
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

// An empty avatar url falls back to the built-in default portrait —
// the product ships with a face, never a monogram placeholder.
const AVATAR_PLACEHOLDER = "/avatar.png";

const WallpaperCanvas = forwardRef<HTMLDivElement, WallpaperCanvasProps>(
  ({ state, preset, editable = false, onChange }, ref) => {
    const { t } = useLocale();
    const { cover, wallpaper } = state;
    const E = editorialPalette(state.colors);
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
          background: E.bg1,
          fontFamily: fontFamilies.sans,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
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
            palette={E}
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
            palette={E}
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
  palette: EditorialPalette;
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
  palette: E,
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
              fontFamily: fontFamilies.mono,
              fontSize: S(26),
              fontWeight: 500,
              color: E.subtle,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: S(48),
              display: "flex",
              alignItems: "center",
              gap: S(20),
            }}
          >
            <div
              style={{
                width: S(56),
                height: S(2),
                background: E.accent,
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
            ...wrapProse,
            fontFamily: fontFamilies.serif,
            fontSize: S(208),
            fontWeight: 600,
            color: E.text,
            letterSpacing: "-0.018em",
            lineHeight: 1.02,
            margin: 0,
            marginBottom: wallpaper.sloganVisible && wallpaper.slogan ? S(48) : 0,
            maxWidth: "100%",
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
              ...wrapProse,
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
            borderColor={E.rule}
          />
        </div>
      )}

      {/* Bottom band: one horizontal metadata rail — badges · separator · social.
          Spans the full content width so it's scannable at a glance on stream. */}
      <div
        style={{
          position: "absolute",
          left: S(200),
          right: S(200),
          bottom: S(160),
          display: "flex",
          alignItems: "center",
          gap: S(40),
          borderTop: `1px solid ${E.line}`,
          paddingTop: S(30),
        }}
      >
        {visibleBadges.length > 0 && (
          <BadgeToolbar
            badges={cover.badges}
            scale={scale}
            readonly={readonly}
            onBadgeLabelChange={writeBadgeLabel}
            labelColor={E.muted}
            background="transparent"
            border="1px solid transparent"
            borderRadius={0}
            paddingY={0}
            paddingX={0}
            outerGap={28}
            itemGap={18}
            iconSize={40}
            labelFontSize={30}
            separatorFontSize={22}
            separatorColor={E.subtle}
          />
        )}

        {visibleSocials.length > 0 && (
          <>
            {visibleBadges.length > 0 && (
              <div
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  minHeight: S(40),
                  background: E.line,
                  flexShrink: 0,
                }}
              />
            )}
            <SocialCard
              variant="horizontal"
              S={S}
              socials={visibleSocials}
              colors={colors}
              t={t}
            />
          </>
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
  palette: E,
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
          borderColor={E.rule}
        />
      )}

      {wallpaper.brandLabelVisible && wallpaper.brandLabel && (
        <div
          style={{
            fontFamily: fontFamilies.mono,
            fontSize: S(32),
            fontWeight: 500,
            color: E.subtle,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: S(18),
            marginTop: S(20),
          }}
        >
          <div
            style={{
              width: S(40),
              height: S(2),
              background: E.accent,
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
              width: S(40),
              height: S(2),
              background: E.accent,
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
          ...wrapProse,
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
            ...wrapProse,
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
          background="transparent"
          border={`1px solid ${E.line}`}
          borderRadius={3}
          paddingY={18}
          paddingX={40}
          outerGap={28}
          itemGap={20}
          iconSize={40}
          labelFontSize={30}
          separatorFontSize={22}
          separatorColor={E.subtle}
        />
      )}

      {visibleSocials.length > 0 && (
        <SocialCard
          variant="stacked"
          S={S}
          socials={visibleSocials}
          colors={colors}
          t={t}
        />
      )}
    </div>
  );
}
