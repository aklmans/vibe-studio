import type { CSSProperties } from "react";
import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import type { SocialConfig } from "../lib/socials";
import { socialStyle } from "../lib/socials";
import { fontFamilies } from "../lib/typography";
import EditableText from "./edit/EditableText";

type Size = "small" | "large";
const LABEL_SIZE: Record<Size, { width: number; height: number }> = {
  small: { width: 76, height: 22 },
  large: { width: 96, height: 26 },
};

interface SocialListProps {
  state: OverlayState;
  size?: Size;
  editable?: boolean;
  onChange?: (state: OverlayState) => void;
}

export default function SocialList({ state, size = "small", editable, onChange }: SocialListProps) {
  const { cover, colors } = state;
  const { textColor } = colors;
  const visibleSocials = cover.socials.filter(
    (s) => s.visible && s.value.trim().length > 0,
  );
  if (visibleSocials.length === 0) return null;

  const isLarge = size === "large";
  const labelBase: CSSProperties = isLarge
    ? {
        fontFamily: fontFamilies.mono,
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 4,
        padding: "4px 12px",
        flexShrink: 0,
        width: LABEL_SIZE.large.width,
        height: LABEL_SIZE.large.height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxSizing: "border-box",
        letterSpacing: "0.06em",
        border: "1px solid transparent",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }
    : {
        fontFamily: fontFamilies.mono,
        fontSize: 11,
        fontWeight: 500,
        borderRadius: 4,
        padding: "3px 8px",
        flexShrink: 0,
        width: LABEL_SIZE.small.width,
        height: LABEL_SIZE.small.height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxSizing: "border-box",
        letterSpacing: "0.06em",
        border: "1px solid transparent",
        overflow: "hidden",
        whiteSpace: "nowrap",
      };

  const valueStyle: CSSProperties = isLarge
    ? {
        fontSize: 20,
        color: textColor,
        fontWeight: 500,
        letterSpacing: "0.01em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
        maxWidth: 460,
      }
    : {
        fontSize: 14,
        color: textColor,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
        maxWidth: 240,
      };

  const rowGap = isLarge ? 14 : 10;

  const updateSocial = (socialIdx: number, patch: Partial<SocialConfig>) => {
    if (!onChange) return;
    if (!cover.socials[socialIdx]) return;
    const socials = cover.socials.map((s, i) =>
      i === socialIdx ? { ...s, ...patch } : s,
    );
    onChange(patchSection(state, "cover", { socials }));
  };

  const findSocialIndex = (visibleIdx: number): number => {
    let count = 0;
    for (let i = 0; i < cover.socials.length; i++) {
      if (cover.socials[i].visible && cover.socials[i].value.trim().length > 0) {
        if (count === visibleIdx) return i;
        count++;
      }
    }
    return -1;
  };

  return (
    <>
      {visibleSocials.map((social, idx) => {
        const style = socialStyle(social, colors);
        const srcIdx = findSocialIndex(idx);
        return (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", gap: rowGap }}
          >
            <span style={{ ...labelBase, ...style }}>{social.label}</span>
            {editable && onChange && srcIdx >= 0 ? (
              <EditableText
                value={social.value}
                onCommit={(next) => updateSocial(srcIdx, { value: next })}
                readonly={false}
                style={valueStyle}
                testId={`social-value-${srcIdx}`}
              />
            ) : (
              <span style={valueStyle}>{social.value}</span>
            )}
          </div>
        );
      })}
    </>
  );
}
