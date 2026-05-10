import type { OverlayState } from "../../types";
import type { TranslationKey } from "../../lib/i18n";
import { socialStyle } from "../../lib/socials";
import { EDITORIAL_PALETTE as E } from "../lib/editorial-palette";

interface SocialCardProps {
  S: (n: number) => number;
  socials: OverlayState["cover"]["socials"];
  colors: OverlayState["colors"];
  fullWidth?: boolean;
  t: (key: TranslationKey) => string;
}

const LABEL_WIDTH = 132;

export default function SocialCard({
  S,
  socials,
  colors,
  fullWidth,
  t,
}: SocialCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: S(28),
        padding: `${S(22)}px ${S(44)}px`,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: S(20),
        minWidth: fullWidth ? undefined : undefined,
        width: fullWidth ? "100%" : undefined,
        boxSizing: "border-box",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          fontSize: S(18),
          fontWeight: 600,
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
            width: S(4),
            height: S(16),
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
            style={{ display: "flex", alignItems: "center", gap: S(10) }}
          >
            <span
              style={{
                ...style,
                fontSize: S(20),
                fontWeight: 600,
                borderRadius: S(8),
                padding: `${S(4)}px ${S(14)}px`,
                flexShrink: 0,
                width: S(LABEL_WIDTH),
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
                fontSize: S(30),
                color: E.muted,
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
