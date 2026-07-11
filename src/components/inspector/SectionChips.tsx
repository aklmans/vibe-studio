import { choiceChipStyle } from "../shared/Field";

interface SectionChipsProps {
  sections: { title: string; minutes?: number }[];
  active: number;
  onSelect: (index: number) => void;
  testIdPrefix: string;
  /** Manual per-section completion — checked chips carry a small ✓. */
  completed?: boolean[];
}

/**
 * Fixed-width numbered chips (01…12): every cell is identical, so rows stay
 * perfectly aligned no matter how long the titles are. The selected section's
 * TITLE renders separately (SectionsManager's selection line, the drive
 * panel's current row) — the chip's title lives in its tooltip.
 */
export default function SectionChips({
  sections,
  active,
  onSelect,
  testIdPrefix,
  completed,
}: SectionChipsProps) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sections.map((section, index) => {
        const isActive = index === active;
        const isDone = completed?.[index] === true;
        return (
          <button
            key={index}
            type="button"
            data-testid={`${testIdPrefix}-${index}`}
            aria-pressed={isActive}
            onClick={() => onSelect(index)}
            title={`${pad(index + 1)} ${section.title || "—"}${
              section.minutes ? ` · ${section.minutes}m` : ""
            }`}
            style={{
              ...choiceChipStyle(isActive),
              width: 52,
              padding: "6px 0",
              lineHeight: 1,
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              textDecoration: isDone && !isActive ? "line-through" : "none",
            }}
          >
            {pad(index + 1)}
            {isDone ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}
