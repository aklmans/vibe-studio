import type { CSSProperties } from "react";
import type { OverlayState } from "../types";
import type { SocialConfig } from "../lib/socials";
import { socialStyle } from "../lib/socials";
import EditableText from "./edit/EditableText";

type Size = "small" | "large";

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
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 5,
        padding: "4px 12px",
        flexShrink: 0,
        minWidth: 84,
        textAlign: "center",
        boxSizing: "border-box",
        letterSpacing: "0.04em",
        border: "1px solid transparent",
      }
    : {
        fontSize: 12,
        fontWeight: 700,
        borderRadius: 4,
        padding: "3px 8px",
        flexShrink: 0,
        minWidth: 76,
        textAlign: "center",
        boxSizing: "border-box",
        letterSpacing: "0.04em",
        border: "1px solid transparent",
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
      }
    : {
        fontSize: 14,
        color: textColor,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      };

  const rowGap = isLarge ? 14 : 10;

  const updateSocial = (idx: number, patch: Partial<SocialConfig>) => {
    if (!onChange) return;
    const socialIdx = cover.socials.findIndex(
      (s, i) => s.visible && s.value.trim().length > 0 && cover.socials.filter((ss, ii) => ii < i && ss.visible && ss.value.trim().length > 0).length === idx,
    );
    if (socialIdx === -1) return;
    const socials = cover.socials.map((s, i) =>
      i === socialIdx ? { ...s, ...patch } : s,
    );
    onChange({ ...state, cover: { ...cover, socials } });
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