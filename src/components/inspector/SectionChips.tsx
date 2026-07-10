import type { CSSProperties } from "react";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";

const mono = "var(--app-font-mono)";

interface SectionChipsProps {
  sections: { title: string; minutes?: number }[];
  active: number;
  onSelect: (index: number) => void;
  testIdPrefix: string;
}

/**
 * A wrapping list of numbered section chips. Replaces equal-width segmented
 * rows wherever sections are listed — with up to 12 sections those cells
 * become unusably narrow, while chips wrap into as many rows as needed.
 */
export default function SectionChips({
  sections,
  active,
  onSelect,
  testIdPrefix,
}: SectionChipsProps) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const base: CSSProperties = {
    appearance: "none",
    cursor: "pointer",
    borderRadius: 999,
    fontFamily: mono,
    fontSize: 11,
    lineHeight: 1,
    padding: "5px 11px",
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    transition: "color 0.12s, border-color 0.12s, background 0.12s",
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sections.map((section, index) => {
        const isActive = index === active;
        return (
          <button
            key={index}
            type="button"
            data-testid={`${testIdPrefix}-${index}`}
            aria-pressed={isActive}
            onClick={() => onSelect(index)}
            style={{
              ...base,
              border: `1px solid ${
                isActive ? cssAlpha(UI_COLORS.accent, 44) : UI_COLORS.controlBorder
              }`,
              background: isActive ? cssAlpha(UI_COLORS.accent, 12) : "transparent",
              color: isActive ? UI_COLORS.text : UI_COLORS.textMuted,
              fontWeight: isActive ? 700 : 500,
            }}
          >
            {pad(index + 1)} {section.title || "—"}
            {section.minutes ? ` · ${section.minutes}m` : ""}
          </button>
        );
      })}
    </div>
  );
}
