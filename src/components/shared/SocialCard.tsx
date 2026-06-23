import type { CSSProperties } from "react";
import type { OverlayState } from "../../types";
import type { TranslationKey } from "../../lib/i18n";
import { compactSocialValue } from "../../lib/socials";
import { fontFamilies } from "../../lib/typography";
import { editorialPalette } from "../lib/editorial-palette";

interface SocialCardProps {
  S: (n: number) => number;
  socials: OverlayState["cover"]["socials"];
  colors: OverlayState["colors"];
  /**
   * "horizontal" — a single bottom metadata rail (desktop wallpaper): pairs flow
   * left-to-right and wrap, scannable in one glance during a stream.
   * "stacked" — a centered label/value block (portrait/mobile wallpaper).
   */
  variant?: "horizontal" | "stacked";
  t: (key: TranslationKey) => string;
}

/**
 * Wallpaper social footer. Platform names are quiet small-caps mono; the value
 * (the real info) is stronger mono ink. No chips, no platform-colour blocks. The
 * layout is a horizontal rail on desktop and a centered block in portrait — never
 * a left-stuck profile card.
 */
export default function SocialCard({
  S,
  socials,
  colors,
  variant = "stacked",
  t,
}: SocialCardProps) {
  const E = editorialPalette(colors);
  const horizontal = variant === "horizontal";

  const labelStyleFor = (social: SocialCardProps["socials"][number]): CSSProperties => ({
    fontFamily: fontFamilies.mono,
    fontSize: S(horizontal ? 16 : 17),
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color:
      social.kind === "custom" && social.customColor
        ? social.customColor
        : E.subtle,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: S(horizontal ? 200 : 240),
    flexShrink: 0,
  });

  const valueStyle: CSSProperties = {
    fontFamily: fontFamilies.mono,
    fontSize: S(horizontal ? 26 : 28),
    color: E.text,
    fontWeight: 650,
    letterSpacing: "0.01em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    maxWidth: S(horizontal ? 360 : 420),
  };

  const eyebrow = (
    <div
      style={{
        fontFamily: fontFamilies.mono,
        fontSize: S(16),
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: E.subtle,
        display: "flex",
        alignItems: "center",
        gap: S(10),
        flexShrink: 0,
      }}
    >
      <div
        style={{ width: S(3), height: S(15), background: E.accent, flexShrink: 0 }}
      />
      {t("canvas.followMe")}
    </div>
  );

  if (horizontal) {
    // One bottom rail: FOLLOW ME, then social pairs flowing across the width,
    // wrapping to a second aligned row if there are too many.
    return (
      <div
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: `${S(14)}px ${S(40)}px`,
        }}
      >
        {eyebrow}
        {socials.map((social, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: S(10),
              minWidth: 0,
            }}
          >
            <span style={labelStyleFor(social)}>{social.label}</span>
            <span style={valueStyle} title={social.value}>
              {compactSocialValue(social.value, 40)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Centered stacked block: FOLLOW ME over an aligned label/value grid, the whole
  // block centred on the same axis as the badges above it.
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: S(16),
        paddingTop: S(22),
        borderTop: `1px solid ${E.line}`,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {eyebrow}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          justifyContent: "center",
          columnGap: S(24),
          rowGap: S(14),
          alignItems: "baseline",
        }}
      >
        {socials.flatMap((social, idx) => [
          <span key={`label-${idx}`} style={labelStyleFor(social)}>
            {social.label}
          </span>,
          <span key={`value-${idx}`} style={valueStyle} title={social.value}>
            {compactSocialValue(social.value, 44)}
          </span>,
        ])}
      </div>
    </div>
  );
}
