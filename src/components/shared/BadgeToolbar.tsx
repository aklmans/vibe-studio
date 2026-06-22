import type { CSSProperties } from "react";
import type { BadgeConfig } from "../../lib/badges";
import { badgeIconUrl } from "../../lib/badges";
import { truncateLine } from "../../lib/typography";
import EditableText from "../edit/EditableText";

interface BadgeToolbarProps {
  badges: BadgeConfig[];
  scale?: number;
  readonly: boolean;
  onBadgeLabelChange?: (originalIdx: number, label: string) => void;
  labelColor: string;
  style?: CSSProperties;
  background?: string;
  border?: string;
  borderRadius?: number;
  paddingY?: number;
  paddingX?: number;
  outerGap?: number;
  itemGap?: number;
  iconSize?: number;
  iconOpacity?: number;
  labelFontSize?: number;
  separatorFontSize?: number;
  separatorColor?: string;
}

export default function BadgeToolbar({
  badges,
  scale = 1,
  readonly,
  onBadgeLabelChange,
  labelColor,
  style,
  background = "rgba(255,255,255,0.04)",
  border = "1px solid rgba(255,255,255,0.08)",
  borderRadius = 10,
  paddingY = 10,
  paddingX = 24,
  outerGap = 14,
  itemGap = 14,
  iconSize = 20,
  iconOpacity = 0.85,
  labelFontSize = 14,
  separatorFontSize = 12,
  separatorColor = "rgba(255,255,255,0.22)",
}: BadgeToolbarProps) {
  const visibleBadges = badges
    .map((badge, originalIdx) => ({ badge, originalIdx }))
    .filter(({ badge }) => badge.visible);
  const px = (n: number) => Math.round(n * scale);

  if (visibleBadges.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: px(outerGap),
        background,
        border,
        borderRadius: px(borderRadius),
        padding: `${px(paddingY)}px ${px(paddingX)}px`,
        ...style,
      }}
    >
      {visibleBadges.map(({ badge, originalIdx }, i) => {
        const iconUrl = badgeIconUrl(badge);
        return (
          <div
            key={originalIdx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: px(itemGap),
            }}
          >
            {i > 0 && (
              <span style={{ fontSize: px(separatorFontSize), color: separatorColor }}>
                ×
              </span>
            )}
            {iconUrl && (
              <img
                src={iconUrl}
                alt={badge.label}
                style={{
                  width: px(iconSize),
                  height: px(iconSize),
                  objectFit: "contain",
                  opacity: iconOpacity,
                }}
              />
            )}
            <EditableText
              readonly={readonly}
              value={badge.label}
              onCommit={(v) => onBadgeLabelChange?.(originalIdx, v)}
              ariaLabel={`Badge ${i + 1} label`}
              style={{
                ...truncateLine,
                fontSize: px(labelFontSize),
                color: labelColor,
                fontWeight: 500,
                letterSpacing: "0.04em",
                maxWidth: px(180),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

