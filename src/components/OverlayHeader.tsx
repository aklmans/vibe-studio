import type { OverlayState } from "../types";
import type { Rect } from "../lib/overlay-layout";
import { UI_COLORS } from "../lib/design-tokens";
import { clampLines, fontFamilies } from "../lib/typography";
import { editorialPalette } from "./lib/editorial-palette";

/** YYYY-MM-DD from the stored ISO start time — string math only, so server and
 *  client render identically (no hydration drift, unlike new Date()). */
function dateLabel(startedAt: string): string {
  const match = startedAt.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

/**
 * The lecture header band. Not a filled slab: a transparent rule-to-rule strip
 * in the editorial language — brand identity on the left (logo + recurring
 * series name, both Brand layer), quiet mono metadata on the right (today's
 * topic, and the live date + badge once the session starts) so the band reads
 * balanced instead of left-loaded.
 */
export default function OverlayHeader({
  state,
  rect,
}: {
  state: OverlayState;
  rect: Rect;
}) {
  const { brand, cover, liveSession, colors } = state;
  const E = editorialPalette(colors);
  const hasLogo = brand.logoUrl.trim().length > 0;
  const hasSeries = brand.seriesName.trim().length > 0;
  const topic = cover.todayTopic.trim();
  const liveDate = dateLabel(liveSession.startedAt);
  const isLive = liveSession.startedAt.trim().length > 0;

  const metaText = {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: colors.mutedText,
  };

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
        background: "transparent",
        borderTop: `2px solid ${E.lineStrong}`,
        borderBottom: `1px solid ${E.line}`,
        overflow: "hidden",
      }}
    >
      {/* Brand cluster — accent mark, logo, series name */}
      <div style={{ width: 3, height: 34, background: E.activeRule, flexShrink: 0 }} />
      {hasLogo && (
        <img
          src={brand.logoUrl}
          alt=""
          data-testid="overlay-header-logo"
          style={{
            height: Math.min(56, rect.height - 32),
            maxWidth: 320,
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
          }}
        />
      )}
      {hasLogo && hasSeries && (
        <div
          aria-hidden="true"
          style={{ width: 1, height: 36, background: E.line, flexShrink: 0 }}
        />
      )}
      {hasSeries && (
        <div
          data-testid="overlay-header-series"
          style={{
            ...clampLines(1),
            fontFamily: fontFamilies.serif,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.15,
            color: colors.textColor,
            minWidth: 0,
          }}
        >
          {brand.seriesName}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Metadata cluster — today's topic; date + LIVE once the session starts */}
      {topic && (
        <span
          data-testid="overlay-header-topic"
          style={{
            ...metaText,
            maxWidth: "34%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flexShrink: 1,
          }}
        >
          {topic}
        </span>
      )}
      {isLive && (
        <span
          data-testid="overlay-header-live"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0 }}
        >
          {liveDate && <span style={metaText}>{liveDate}</span>}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${E.line}`,
              borderRadius: 4,
              padding: "3px 10px",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: UI_COLORS.live,
                flexShrink: 0,
              }}
            />
            <span style={{ ...metaText, fontSize: 12, color: colors.textColor }}>LIVE</span>
          </span>
        </span>
      )}
      {/* Right edge breathing room so the cluster doesn't kiss the rule end */}
      <div style={{ width: 4, flexShrink: 0 }} />
    </div>
  );
}
