import type { CSSProperties } from "react";
import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import type { SocialConfig } from "../lib/socials";
import { compactSocialValue } from "../lib/socials";
import { fontFamilies } from "../lib/typography";
import { editorialPalette } from "./lib/editorial-palette";
import EditableText from "./edit/EditableText";

type Size = "small" | "large";
// Fixed label column so every platform name aligns and the value column starts
// at the same x — a stable label/value pair, not a row of button chips.
const LABEL_WIDTH: Record<Size, number> = {
  small: 76,
  large: 96,
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
  const E = editorialPalette(colors);
  const visibleSocials = cover.socials.filter(
    (s) => s.visible && s.value.trim().length > 0,
  );
  if (visibleSocials.length === 0) return null;

  const isLarge = size === "large";
  // Platform label: quiet small-caps mono text in a fixed column — low-key but
  // clear, no button chip, no fill, no border.
  const labelBase: CSSProperties = {
    fontFamily: fontFamilies.mono,
    fontSize: isLarge ? 13 : 11,
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    width: isLarge ? LABEL_WIDTH.large : LABEL_WIDTH.small,
    flexShrink: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const valueStyle: CSSProperties = isLarge
    ? {
        fontSize: 20,
        color: textColor,
        fontWeight: 650,
        letterSpacing: "0.01em",
        fontFamily: fontFamilies.mono,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
        maxWidth: 460,
      }
    : {
        fontSize: 14,
        color: textColor,
        fontWeight: 650,
        fontFamily: fontFamilies.mono,
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
        const srcIdx = findSocialIndex(idx);
        const displayValue = compactSocialValue(social.value, isLarge ? 46 : 34);
        const labelColor =
          social.kind === "custom" && social.customColor
            ? social.customColor
            : E.subtle;
        return (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "baseline", gap: rowGap }}
          >
            <span style={{ ...labelBase, color: labelColor }}>{social.label}</span>
            {editable && onChange && srcIdx >= 0 ? (
              <EditableText
                value={social.value}
                onCommit={(next) => updateSocial(srcIdx, { value: next })}
                readonly={false}
                style={valueStyle}
                testId={`social-value-${srcIdx}`}
              />
            ) : (
              <span style={valueStyle} title={social.value}>
                {displayValue}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
