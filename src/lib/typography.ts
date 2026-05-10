// Shared typography tokens. Use these instead of inline fontSize/fontWeight/
// letterSpacing literals so the type ramp stays consistent across canvases.
//
// Token roles:
//   display   — biggest hero (Cover/Poster main title)
//   title     — secondary hero (large card titles)
//   subtitle  — supporting line under title
//   eyebrow   — small uppercased labels above titles or section headers
//   body      — list bullets, descriptions
//   caption   — smallest legible label (badges, captions, dimensions)

import type { CSSProperties } from "react";

type TypeToken = Pick<
  CSSProperties,
  "fontSize" | "fontWeight" | "letterSpacing" | "lineHeight" | "textTransform"
>;

export const typography = {
  display: {
    fontSize: 96,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
  },
  title: {
    fontSize: 56,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: "0.04em",
    lineHeight: 1.3,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  body: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.04em",
  },
} satisfies Record<string, TypeToken>;

export const fontFamilies = {
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  mono: '"SF Mono", Menlo, Monaco, "Cascadia Code", monospace',
} as const;

// Helper: detect if a string is mostly ASCII so we know whether uppercase +
// wide letter-spacing should apply. CJK strings should use the no-uppercase,
// tighter spacing variant of the eyebrow style.
export function isAsciiHeavy(value: string): boolean {
  if (!value) return true;
  const ascii = value.replace(/[^\x20-\x7E]/g, "").length;
  return ascii / value.length >= 0.6;
}

// Returns an eyebrow style appropriate for the given label (English vs CJK).
export function eyebrowStyleFor(label: string): TypeToken {
  if (isAsciiHeavy(label)) {
    return typography.eyebrow;
  }
  return {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "none",
  };
}
