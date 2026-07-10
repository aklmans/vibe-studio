import type { CSSProperties } from "react";
import { choiceChipStyle } from "../shared/Field";

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
    lineHeight: 1,
    padding: "5px 11px",
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
            style={{ ...choiceChipStyle(isActive), ...base }}
          >
            {pad(index + 1)} {section.title || "—"}
            {section.minutes ? ` · ${section.minutes}m` : ""}
          </button>
        );
      })}
    </div>
  );
}
