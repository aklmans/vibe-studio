import type { OverlayState } from "../types";
import type { Rect } from "../lib/overlay-layout";
import { clampLines, fontFamilies } from "../lib/typography";
import { editorialPalette } from "./lib/editorial-palette";

/**
 * The lecture header band: the host's logo and the recurring programme name.
 * Both come from the Brand layer — set once, reused every stream.
 */
export default function OverlayHeader({
  state,
  rect,
}: {
  state: OverlayState;
  rect: Rect;
}) {
  const { brand, colors } = state;
  const E = editorialPalette(colors);
  const hasLogo = brand.logoUrl.trim().length > 0;
  const hasSeries = brand.seriesName.trim().length > 0;

  return (
    <div
      data-testid="overlay-header"
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 28px",
        background: `${colors.bgPanel}F0`,
        border: `2px solid ${E.lineStrong}`,
        boxShadow: `inset 0 0 0 1px ${E.lineSoft}`,
        overflow: "hidden",
      }}
    >
      {hasLogo && (
        <img
          src={brand.logoUrl}
          alt=""
          data-testid="overlay-header-logo"
          style={{
            height: rect.height - 40,
            maxWidth: 360,
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
          }}
        />
      )}
      {hasLogo && hasSeries && (
        <div
          aria-hidden="true"
          style={{ width: 1, height: 40, background: E.line, flexShrink: 0 }}
        />
      )}
      {hasSeries && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div style={{ width: 3, height: 30, background: E.activeRule, flexShrink: 0 }} />
          <div
            data-testid="overlay-header-series"
            style={{
              ...clampLines(1),
              fontFamily: fontFamilies.serif,
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.15,
              color: colors.textColor,
            }}
          >
            {brand.seriesName}
          </div>
        </div>
      )}
    </div>
  );
}
