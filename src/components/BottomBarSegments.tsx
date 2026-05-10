import type { CSSProperties } from "react";
import type { OverlayState } from "../types";
import type { BottomBarSlot } from "../lib/bottomBar";
import { formatElapsed, formatStartLabel } from "../lib/bottomBar";
import { UI_COLORS } from "../lib/design-tokens";
import { useNow } from "../hooks/useNow";
import { useLocale } from "../hooks/useLocale";

type Size = "small" | "large";

interface BottomBarSegmentsProps {
  state: OverlayState;
  size?: Size;
}

/**
 * Shared renderer for the three bottom-bar slots. OverlayCanvas uses
 * size="small" (162px tall row), the BottomBarPanel export slice uses
 * size="large" (180px tall standalone export).
 */
export default function BottomBarSegments({
  state,
  size = "small",
}: BottomBarSegmentsProps) {
  const { t } = useLocale();
  const { bottomBar, colors } = state;
  const { borderColor, textColor, mutedText, cyanAccent, pinkAccent, warmAccent } = colors;
  const accents = [cyanAccent, warmAccent, pinkAccent];

  const baseTitleSize = size === "large" ? 13 : 12;
  const baseValueSize = size === "large" ? 32 : 28;
  const padding = size === "large" ? "24px 36px" : "20px 32px";

  return (
    <>
      {bottomBar.segments.map((seg, idx) => {
        const accent = accents[idx] ?? cyanAccent;
        return (
          <div
            key={idx}
            style={{
              flex: 1,
              padding,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {idx < bottomBar.segments.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 16,
                  bottom: 16,
                  width: 1,
                  background: `linear-gradient(180deg, transparent 0%, ${borderColor}40 50%, transparent 100%)`,
                }}
              />
            )}
            <SegmentBody
              slot={seg}
              accent={accent}
              state={state}
              titleSize={baseTitleSize}
              valueSize={baseValueSize}
              textColor={textColor}
              mutedText={mutedText}
              borderColor={borderColor}
              t={t}
            />
          </div>
        );
      })}
    </>
  );
}

interface SegmentBodyProps {
  slot: BottomBarSlot;
  accent: string;
  state: OverlayState;
  titleSize: number;
  valueSize: number;
  textColor: string;
  mutedText: string;
  borderColor: string;
  t: (key: import("../lib/i18n").TranslationKey) => string;
}

function SegmentBody({
  slot,
  accent,
  state,
  titleSize,
  valueSize,
  textColor,
  mutedText,
  borderColor,
  t,
}: SegmentBodyProps) {
  const titleStyle: CSSProperties = {
    fontSize: titleSize,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: accent,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };
  const railStyle: CSSProperties = {
    width: 3,
    height: 12,
    borderRadius: 2,
    background: accent,
    flexShrink: 0,
  };
  const valueStyle: CSSProperties = {
    fontSize: valueSize,
    color: textColor,
    fontWeight: 500,
    letterSpacing: "-0.01em",
  };

  switch (slot.kind) {
    case "live": {
      const startedAt = state.liveSession.startedAt;
      const startedMs = startedAt ? new Date(startedAt).getTime() : NaN;
      const ready = Number.isFinite(startedMs);
      const startLabel = ready ? formatStartLabel(startedAt) : "—";
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span>{t("bar.onAir")}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginLeft: 4,
                background: UI_COLORS.live,
                borderRadius: 999,
                padding: "1px 8px",
                height: 16,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: UI_COLORS.white,
                  letterSpacing: "0.12em",
                }}
              >
                {t("canvas.liveBadge")}
              </span>
            </span>
          </div>
          <LiveElapsedValue
            ready={ready}
            startedMs={startedMs}
            startLabel={startLabel}
            valueStyle={valueStyle}
            mutedText={mutedText}
            t={t}
          />
        </>
      );
    }

    case "progress": {
      const sectionIdx = slot.sectionIndex;
      const section =
        state.sidebar.sections[sectionIdx] ?? state.sidebar.sections[0];
      const doneRow = state.sidebar.sectionsDone?.[sectionIdx] ?? [];
      const total = section?.bullets.length ?? 0;
      const done = doneRow.filter(Boolean).length;
      const ratio = total === 0 ? 0 : done / total;
      const titleText = section?.title || t("bar.progress");
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span>{t("bar.progress")} · {titleText}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span
              style={{
                ...valueStyle,
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}
            >
              {done}
              <span style={{ color: `${mutedText}80`, margin: "0 4px" }}>/</span>
              {total}
            </span>
            <div
              style={{
                flex: 1,
                minWidth: 80,
                height: 6,
                borderRadius: 3,
                background: `${borderColor}18`,
                border: `1px solid ${borderColor}25`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${accent}90, ${accent}55)`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </>
      );
    }

    case "stack": {
      const items = state.stack.items;
      if (items.length === 0) {
        return (
          <>
            <div style={titleStyle}>
              <div style={railStyle} />
              <span>{t("bar.stack")}</span>
            </div>
            <span style={{ ...valueStyle, color: `${mutedText}80`, fontSize: titleSize + 2 }}>
              {t("bar.emptyStack")}
            </span>
          </>
        );
      }
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span>{t("bar.stack")}</span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
          >
            {items.map((item, i) => (
              <span
                key={i}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: textColor,
                  background: `${borderColor}15`,
                  border: `1px solid ${borderColor}30`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </>
      );
    }

    case "topic": {
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span>{state.cover.todayLabel || t("bar.topic")}</span>
          </div>
          <div style={valueStyle}>{state.cover.todayTopic}</div>
        </>
      );
    }

    case "text": {
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span>{slot.title}</span>
          </div>
          <div style={valueStyle}>{slot.text}</div>
        </>
      );
    }
  }
}

interface LiveElapsedValueProps {
  ready: boolean;
  startedMs: number;
  startLabel: string;
  valueStyle: CSSProperties;
  mutedText: string;
  t: (key: import("../lib/i18n").TranslationKey) => string;
}

function LiveElapsedValue({
  ready,
  startedMs,
  startLabel,
  valueStyle,
  mutedText,
  t,
}: LiveElapsedValueProps) {
  const now = useNow(ready);
  const elapsed = ready ? Math.max(0, now - startedMs) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
      }}
    >
      <span
        style={{
          ...valueStyle,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {ready ? formatElapsed(elapsed) : "—:——"}
      </span>
      {ready && (
        <span
          style={{
            fontSize: 12,
            color: `${mutedText}99`,
            letterSpacing: "0.04em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {t("live.started")} · {startLabel}
        </span>
      )}
    </div>
  );
}
