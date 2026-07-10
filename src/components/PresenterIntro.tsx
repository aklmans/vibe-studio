import type { OverlayState } from "../types";
import type { Rect } from "../lib/overlay-layout";
import { clampLines, fontFamilies } from "../lib/typography";
import { editorialPalette } from "./lib/editorial-palette";

/** "with Someone" is how the author is stored; the card wants the bare name. */
function presenterName(hookText: string): string {
  return hookText.replace(/^with\s+/i, "").trim();
}

/**
 * The lecture presenter card, under the camera: this stream's title (content),
 * then the presenter's name and affiliation lines (Brand layer).
 */
export default function PresenterIntro({
  state,
  rect,
}: {
  state: OverlayState;
  rect: Rect;
}) {
  const { brand, cover, colors } = state;
  const E = editorialPalette(colors);
  const name = presenterName(cover.hookText);
  const lines = brand.presenterLines.filter((line) => line.trim().length > 0);

  return (
    <div
      data-testid="overlay-presenter-intro"
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        boxSizing: "border-box",
        background: `${colors.bgPanel}F0`,
        border: `2px solid ${E.lineStrong}`,
        boxShadow: `inset 0 0 0 1px ${E.lineSoft}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 3, width: 72, background: E.activeRule, flexShrink: 0 }} />
      <div
        style={{
          padding: "26px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          minHeight: 0,
        }}
      >
        <div
          data-testid="overlay-presenter-title"
          style={{
            ...clampLines(3),
            fontFamily: fontFamilies.serif,
            fontSize: 27,
            fontWeight: 650,
            lineHeight: 1.3,
            color: colors.textColor,
          }}
        >
          {cover.title}
        </div>

        <div
          style={{
            borderTop: `1px solid ${E.line}`,
            paddingTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 0,
          }}
        >
          {name && (
            <div
              data-testid="overlay-presenter-name"
              style={{
                ...clampLines(1),
                fontFamily: fontFamilies.serif,
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.1,
                color: colors.textColor,
              }}
            >
              {name}
            </div>
          )}
          {lines.map((line, index) => (
            <div
              key={index}
              style={{
                ...clampLines(2),
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.45,
                color: colors.mutedText,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
