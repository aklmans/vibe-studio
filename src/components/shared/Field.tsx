import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";

/* Shared low-level form atoms used across the inspector, settings drawer,
 * command-adjacent controls, and live-data panels. These are intentionally
 * dumb: they carry the warm editorial workbench language without importing app
 * state or changing any editor behavior.
 *
 * Button language (one system everywhere): square corners, transparent ground,
 * a 1px rule border, accent ink, mono caps with wide tracking. Hierarchy comes
 * from the border alone — accent rule = primary, quiet controlBorder rule =
 * secondary; the ink stays accent either way. Bare glyph micro-actions (×, ⌃)
 * stay muted and borderless; anything boxed speaks accent.
 */

export const fieldLabelStyle: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  color: UI_COLORS.textMuted,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const workbenchInputStyle: CSSProperties = {
  background: UI_COLORS.inputInset,
  border: `1px solid ${UI_COLORS.controlBorder}`,
  borderRadius: 4,
  padding: "6px 10px",
  fontSize: 13,
  color: UI_COLORS.text,
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.12s, box-shadow 0.12s, background 0.12s",
};

export const monoInputStyle: CSSProperties = {
  ...workbenchInputStyle,
  fontFamily: "var(--app-font-mono)",
  fontSize: 12,
};

export const workbenchPanelStyle: CSSProperties = {
  minWidth: 0,
  background: UI_COLORS.appSurface,
  border: `1px solid ${UI_COLORS.border}`,
  borderRadius: 3,
  overflow: "hidden",
};

export const workbenchNoteStyle: CSSProperties = {
  fontSize: 11,
  color: UI_COLORS.textMuted,
  lineHeight: 1.5,
  padding: "8px 10px",
  background: UI_COLORS.inputInset,
  border: `1px solid ${UI_COLORS.controlBorder}`,
  borderRadius: 4,
};

export function applyWorkbenchFocus(el: HTMLElement, color = UI_COLORS.accent) {
  el.style.borderColor = color;
  el.style.boxShadow = `0 0 0 2px ${cssAlpha(color, 22)}`;
}

export function clearWorkbenchFocus(el: HTMLElement) {
  el.style.borderColor = UI_COLORS.controlBorder;
  el.style.boxShadow = "none";
}

export function WorkbenchLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <span style={{ ...fieldLabelStyle, ...style }}>{children}</span>;
}

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  testId?: string;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  style?: CSSProperties;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  /** Accessible name — set when no associated <label> names the field. */
  ariaLabel?: string;
}

export function TextInput({
  value,
  onChange,
  testId,
  placeholder,
  type = "text",
  mono = false,
  style,
  onKeyDown,
  ariaLabel,
}: TextInputProps) {
  return (
    <input
      data-testid={testId}
      aria-label={ariaLabel}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      style={{
        ...(mono ? monoInputStyle : workbenchInputStyle),
        ...style,
      }}
      onFocus={(e) => applyWorkbenchFocus(e.currentTarget)}
      onBlur={(e) => clearWorkbenchFocus(e.currentTarget)}
    />
  );
}

interface SectionInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
  placeholder?: string;
}

export function SectionInput({
  label,
  value,
  onChange,
  testId,
  placeholder,
}: SectionInputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={fieldLabelStyle}>{label}</label>
      <TextInput
        value={value}
        onChange={onChange}
        testId={testId}
        placeholder={placeholder}
        ariaLabel={label}
      />
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  testId?: string;
}

export function ColorInput({
  label,
  value,
  onChange,
  hint,
  testId,
}: ColorInputProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: "space-between",
      }}
    >
      <div
        title={hint}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: value,
          border: `1px solid ${UI_COLORS.controlBorder}`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <label style={{ fontSize: 12, color: UI_COLORS.textSoft }} title={hint}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: 10, color: UI_COLORS.textMuted, lineHeight: 1.3 }}>
            {hint}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          data-testid={testId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 28,
            height: 24,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            borderRadius: 4,
            padding: 1,
            background: UI_COLORS.inputInset,
            cursor: "pointer",
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: UI_COLORS.textMuted,
            fontFamily: "var(--app-font-mono)",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}

export function ToggleButton({
  label,
  checked,
  onChange,
  testId,
}: ToggleButtonProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: label ? "space-between" : "flex-end",
        padding: label ? "6px 0" : 0,
      }}
    >
      {label && (
        <span style={{ fontSize: 13, color: UI_COLORS.textSoft }}>{label}</span>
      )}
      <button
        data-testid={testId}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label || undefined}
        style={{
          width: 38,
          height: 20,
          // Square switch — the editorial language has no pills anywhere.
          borderRadius: 0,
          border: `1px solid ${
            checked ? cssAlpha(UI_COLORS.accent, 64) : UI_COLORS.controlBorder
          }`,
          cursor: "pointer",
          background: checked
            ? cssAlpha(UI_COLORS.accent, 12)
            : UI_COLORS.inputInset,
          position: "relative",
          transition: "background 0.16s, border-color 0.16s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 0,
            background: checked ? UI_COLORS.accentText : UI_COLORS.textMuted,
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            transition: "left 0.16s, background 0.16s",
          }}
        />
      </button>
    </div>
  );
}

interface SectionHeadingProps {
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * Lightweight section heading kept for legacy parts of the editor that still
 * use the "stacked-with-divider" visual. New inspector groups use
 * <InspectorGroup> instead.
 */
export function SectionHeading({ children, style }: SectionHeadingProps) {
  return (
    <div
      style={{
        fontFamily: "var(--app-font-mono)",
        fontSize: 10,
        fontWeight: 600,
        color: UI_COLORS.textMuted,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "16px 0 8px",
        borderTop: `1px solid ${UI_COLORS.border}`,
        marginTop: 4,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface WorkbenchSegmentedOption {
  value: string;
  label: ReactNode;
  testId?: string;
  meta?: ReactNode;
}

export function WorkbenchSegmented({
  options,
  active,
  onSelect,
  columns,
  testId,
}: {
  options: WorkbenchSegmentedOption[];
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
        gap: 3,
        background: UI_COLORS.inputInset,
        padding: 3,
        borderRadius: 0,
        border: `1px solid ${UI_COLORS.controlBorder}`,
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === active;
        return (
          <button
            key={opt.value}
            data-testid={opt.testId}
            onClick={() => onSelect(opt.value)}
            style={{
              minWidth: 0,
              padding: "6px 7px",
              background: isActive
                ? cssAlpha(UI_COLORS.accent, 10)
                : "transparent",
              border: `1px solid ${
                isActive ? cssAlpha(UI_COLORS.accent, 44) : "transparent"
              }`,
              borderRadius: 0,
              fontFamily: "var(--app-font-mono)",
              fontSize: 10,
              fontWeight: isActive ? 650 : 500,
              color: isActive ? UI_COLORS.accentText : UI_COLORS.textMuted,
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "color 0.12s, background 0.12s, border-color 0.12s",
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

type WorkbenchButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "style"
> & {
  children: ReactNode;
  tone?: "neutral" | "accent" | "danger";
  accentColor?: string;
  testId?: string;
  style?: CSSProperties;
};

export const WorkbenchButton = forwardRef<HTMLButtonElement, WorkbenchButtonProps>(
  function WorkbenchButton(
    {
      children,
      disabled,
      tone = "neutral",
      accentColor,
      testId,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) {
    // Accent ink on every boxed action; the border carries the hierarchy.
    const color =
      tone === "danger"
        ? UI_COLORS.danger
        : accentColor ?? UI_COLORS.accentText;
    const restingBorder =
      tone === "neutral"
        ? UI_COLORS.controlBorder
        : cssAlpha(color, tone === "danger" ? 44 : 64);

    return (
      <button
        ref={ref}
        data-testid={testId}
        disabled={disabled}
        style={{
          minHeight: 30,
          borderRadius: 0,
          border: `1px solid ${disabled ? UI_COLORS.controlBorder : restingBorder}`,
          background: "transparent",
          color: disabled ? UI_COLORS.textSubtle : color,
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "var(--app-font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transition: "color 0.12s, border-color 0.12s, background 0.12s",
          ...style,
        }}
        onMouseEnter={(e) => {
          onMouseEnter?.(e);
          if (disabled) return;
          e.currentTarget.style.background = cssAlpha(color, 8);
          e.currentTarget.style.borderColor = cssAlpha(color, 72);
        }}
        onMouseLeave={(e) => {
          onMouseLeave?.(e);
          if (disabled) return;
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = restingBorder;
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

/**
 * Square choice chip for aria-pressed pick-one rows (sections, tasks, OBS
 * sources, JSON module jumps): rule border, accent ink when active, quiet
 * otherwise. Spread it first, then override sizing per call site.
 */
export function choiceChipStyle(active: boolean, disabled = false): CSSProperties {
  return {
    appearance: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 0,
    border: `1px solid ${
      active ? cssAlpha(UI_COLORS.accent, 64) : UI_COLORS.controlBorder
    }`,
    background: active ? cssAlpha(UI_COLORS.accent, 10) : "transparent",
    color: disabled
      ? UI_COLORS.textSubtle
      : active
        ? UI_COLORS.accentText
        : UI_COLORS.textMuted,
    fontFamily: "var(--app-font-mono)",
    fontSize: 11,
    fontWeight: active ? 650 : 500,
    letterSpacing: "0.06em",
    transition: "color 0.12s, border-color 0.12s, background 0.12s",
  };
}
