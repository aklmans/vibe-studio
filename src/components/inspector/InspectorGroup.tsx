import { useState, type ReactNode } from "react";
import { UI_COLORS } from "../../lib/design-tokens";

interface InspectorGroupProps {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  testId?: string;
  children: ReactNode;
}

/**
 * Accordion-style folding group for the right inspector. Self-contained so it
 * doesn't depend on Radix Accordion (we want individual open/close state
 * without coupling to siblings). All groups default to open — the inspector
 * is meant to feel like a settings panel, not a navigation tree.
 */
export default function InspectorGroup({
  title,
  hint,
  defaultOpen = true,
  testId,
  children,
}: InspectorGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hover, setHover] = useState(false);

  return (
    <div
      data-testid={testId}
      style={{
        borderBottom: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          // Hover is a thin left accent rail + accent title, never a filled row.
          boxShadow: hover ? `inset 2px 0 0 ${UI_COLORS.accent}` : "none",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: "inherit",
          color: UI_COLORS.text,
          transition: "box-shadow 0.12s",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-testid={testId ? `${testId}-toggle` : undefined}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
          <span
            style={{
              fontFamily: "var(--app-font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: hover ? UI_COLORS.accentText : UI_COLORS.textMuted,
              transition: "color 0.12s",
            }}
          >
            {title}
          </span>
          {hint && (
            <span
              style={{
                fontSize: 10,
                color: UI_COLORS.textSubtle,
                fontWeight: 400,
                letterSpacing: "0.02em",
                textTransform: "none",
              }}
            >
              {hint}
            </span>
          )}
        </div>
        <span
          aria-hidden
          style={{
            fontSize: 13,
            color: UI_COLORS.textSubtle,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s",
          }}
        >
          ⌄
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
