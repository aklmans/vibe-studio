import type { OverlayState } from "../../types";
import type { TranslationKey } from "../../lib/i18n";
import { compactSocialValue, socialStyle } from "../../lib/socials";
import { fontFamilies } from "../../lib/typography";
import { editorialPalette } from "../lib/editorial-palette";

interface SocialCardProps {
  S: (n: number) => number;
  socials: OverlayState["cover"]["socials"];
  colors: OverlayState["colors"];
  fullWidth?: boolean;
  t: (key: TranslationKey) => string;
}

const LABEL_WIDTH = 132;
const LABEL_HEIGHT = 34;

export default function SocialCard({
  S,
  socials,
  colors,
  fullWidth,
  t,
}: SocialCardProps) {
  const E = editorialPalette(colors);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: S(28),
        padding: `${S(20)}px ${S(8)}px ${S(4)}px`,
        background: "transparent",
        borderTop: `1px solid ${E.rule}`,
        width: fullWidth ? "100%" : undefined,
        boxSizing: "border-box",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          fontFamily: fontFamilies.mono,
          fontSize: S(17),
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: E.subtle,
          display: "flex",
          alignItems: "center",
          gap: S(10),
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: S(3),
            height: S(16),
            background: E.accent,
            flexShrink: 0,
          }}
        />
        {t("canvas.followMe")}
      </div>
      {socials.map((social, idx) => {
        const style = socialStyle(social, colors);
        const displayValue = compactSocialValue(social.value, 48);
        return (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", gap: S(10) }}
          >
            <span
              style={{
                ...style,
                fontFamily: fontFamilies.mono,
                fontSize: S(18),
                fontWeight: 500,
                borderRadius: S(6),
                padding: `${S(4)}px ${S(14)}px`,
                flexShrink: 0,
                width: S(LABEL_WIDTH),
                height: S(LABEL_HEIGHT),
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxSizing: "border-box",
                letterSpacing: "0.06em",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {social.label}
            </span>
            <span
              style={{
                fontFamily: fontFamilies.mono,
                fontSize: S(30),
                color: E.text,
                fontWeight: 650,
                letterSpacing: "0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                maxWidth: S(520),
              }}
              title={social.value}
            >
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
