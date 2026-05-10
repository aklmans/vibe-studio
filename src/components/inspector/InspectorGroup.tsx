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

  return (
    <div
      data-testid={testId}
      style={{
        borderBottom: `1px solid ${UI_COLORS.panelSurface}`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: "inherit",
          color: UI_COLORS.text,
        }}
        data-testid={testId ? `${testId}-toggle` : undefined}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: UI_COLORS.focus,
            }}
          >
            {title}
          </span>
          {hint && (
            <span
              style={{
                fontSize: 10,
                color: UI_COLORS.textMuted,
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
            fontSize: 14,
            color: UI_COLORS.textMuted,
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
