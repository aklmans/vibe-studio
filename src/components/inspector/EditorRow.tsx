import type { CSSProperties, ReactNode } from "react";
import { UI_COLORS } from "../../lib/design-tokens";
import { fieldLabelStyle } from "../shared/Field";

/* Inspector-only editorial primitives. These turn list editors (badges,
 * socials, …) from stacked rounded cards into a ruled spec sheet: a left index
 * gutter for metadata, a stable field column in the middle, and a visibility /
 * action slot on the right. Hairlines separate rows — no card boxes, no fills.
 *
 * Kept out of shared/Field so changing the editor rhythm never touches the
 * CommandPalette controls that share Field's atoms. */

const indexStyle: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: UI_COLORS.textSubtle,
  fontVariantNumeric: "tabular-nums",
  paddingTop: 2,
  width: 16,
  flexShrink: 0,
  textAlign: "right",
};

const titleStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 12,
  fontWeight: 600,
  color: UI_COLORS.textSoft,
  letterSpacing: "0.02em",
  display: "flex",
  alignItems: "center",
  gap: 8,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

interface EditorRowProps {
  /** 1-based position; rendered as a zero-padded mono index in the gutter. */
  index: number;
  /** Row identity (left/middle): plain text or icon + label. */
  title: ReactNode;
  /** Right-aligned visibility toggle / action; stays full-strength when dimmed. */
  action?: ReactNode;
  /** Hidden items read quiet, but the toggle/index stay legible. */
  dimmed?: boolean;
  testId?: string;
  children?: ReactNode;
}

export function EditorRow({
  index,
  title,
  action,
  dimmed = false,
  testId,
  children,
}: EditorRowProps) {
  return (
    <div
      data-testid={testId}
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 0",
        borderTop: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <span style={{ ...indexStyle, opacity: dimmed ? 0.45 : 1 }}>
        {String(index).padStart(2, "0")}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 20 }}>
          <div style={{ ...titleStyle, opacity: dimmed ? 0.55 : 1 }}>{title}</div>
          {action}
        </div>
        {children && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              opacity: dimmed ? 0.6 : 1,
            }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/** Field column gutter width — keeps every label/value input left-aligned. */
export const FIELD_LABEL_WIDTH = 54;
export const FIELD_CONTENT_INSET = FIELD_LABEL_WIDTH + 10;

/**
 * One labelled field inside an EditorRow: a fixed-width mono label and the
 * control beside it, so label / value / icon inputs line up into stable columns.
 */
export function FieldLine({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          ...fieldLabelStyle,
          width: FIELD_LABEL_WIDTH,
          flexShrink: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

interface LineSegmentedOption {
  value: string;
  label: ReactNode;
  testId?: string;
  meta?: ReactNode;
}

/**
 * Inspector-only segmented selector. It keeps the same behavior shape as the
 * shared WorkbenchSegmented, but renders as a ruled selector: transparent
 * surface, no inset capsule, active state as text weight + underline.
 */
export function LineSegmented({
  options,
  active,
  onSelect,
  columns,
  testId,
}: {
  options: LineSegmentedOption[];
  active: string;
  onSelect: (value: string) => void;
  columns?: number;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        display: "grid",
        gridTemplateColumns: columns
          ? `repeat(${columns}, minmax(0, 1fr))`
          : `repeat(${options.length}, minmax(0, 1fr))`,
        gap: 0,
        borderTop: `1px solid ${UI_COLORS.border}`,
        borderBottom: `1px solid ${UI_COLORS.border}`,
      }}
    >
      {options.map((opt, idx) => {
        const isActive = opt.value === active;
        return (
          <button
            key={opt.value}
            data-testid={opt.testId}
            aria-pressed={isActive}
            title={typeof opt.label === "string" ? opt.label : undefined}
            onClick={() => onSelect(opt.value)}
            style={{
              minWidth: 0,
              padding: "7px 6px 6px",
              background: "transparent",
              border: "none",
              borderRight:
                idx === options.length - 1
                  ? "none"
                  : `1px solid ${UI_COLORS.border}`,
              boxShadow: isActive
                ? `inset 0 -2px 0 ${UI_COLORS.accent}`
                : "none",
              fontFamily: "var(--app-font-mono)",
              fontSize: 10,
              fontWeight: isActive ? 650 : 500,
              // Selected = accent ink, matching the boxed-button language.
              color: isActive ? UI_COLORS.accentText : UI_COLORS.textMuted,
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "color 0.12s, box-shadow 0.12s",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = UI_COLORS.textSoft;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = UI_COLORS.textMuted;
            }}
          >
            <span>{opt.label}</span>
            {opt.meta && (
              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontSize: 9,
                  fontWeight: 500,
                  color: isActive ? UI_COLORS.accentText : UI_COLORS.textSubtle,
                  letterSpacing: "0.02em",
                }}
              >
                {opt.meta}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function RuleNote({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: UI_COLORS.textMuted,
        lineHeight: 1.5,
        paddingLeft: 10,
        borderLeft: `2px solid ${UI_COLORS.rule}`,
      }}
    >
      {children}
    </div>
  );
}
