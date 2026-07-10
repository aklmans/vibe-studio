import type { CSSProperties } from "react";
import type { OverlayState } from "../types";
import { activeAgenda } from "../lib/agenda";
import type { BottomBarSlot } from "../lib/bottomBar";
import { formatElapsed, formatStartLabel } from "../lib/bottomBar";
import { UI_COLORS } from "../lib/design-tokens";
import { fontFamilies, wrapProse, clampLines, truncateLine } from "../lib/typography";
import { stackItemLabel } from "../lib/stack";
import { useNow } from "../hooks/useNow";
import { activeBarSegments } from "../lib/bottomBar";
import type { BarProfileId } from "../lib/overlay-layout";
import { useLocale } from "../hooks/useLocale";
import { editorialPalette } from "./lib/editorial-palette";
import { BrandIcon } from "./shared/BrandIcon";

type Size = "small" | "large";

interface BottomBarSegmentsProps {
  state: OverlayState;
  size?: Size;
  /** Which bar data set to render; defaults to the active layout's profile. */
  profile?: BarProfileId;
}

/**
 * Shared renderer for the three bottom-bar slots. OverlayCanvas uses
 * size="small" (208px tall row), the BottomBarPanel export slice uses
 * size="large" (180px tall standalone export).
 */
export default function BottomBarSegments({
  state,
  size = "small",
  profile,
}: BottomBarSegmentsProps) {
  const { t } = useLocale();
  const { colors } = state;
  const { textColor, mutedText } = colors;
  const E = editorialPalette(colors);
  const accent = E.primaryMark;
  const segments = profile
    ? state.bottomBar.segments[profile]
    : activeBarSegments(state);

  const baseTitleSize = size === "large" ? 13 : 12;
  const baseValueSize = size === "large" ? 32 : 28;
  const padding = size === "large" ? "24px 36px" : "20px 32px";

  return (
    <>
      {segments.map((seg, idx) => {
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
            {idx < segments.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 18,
                  bottom: 18,
                  width: 1,
                  background: E.line,
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
              line={E.line}
              lineSoft={E.lineSoft}
              surface={E.bg3}
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
  line: string;
  lineSoft: string;
  surface: string;
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
  line,
  lineSoft,
  surface,
  t,
}: SegmentBodyProps) {
  const titleStyle: CSSProperties = {
    fontFamily: fontFamilies.mono,
    fontSize: titleSize,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: mutedText,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };
  const railStyle: CSSProperties = {
    width: 3,
    height: 14,
    background: accent,
    flexShrink: 0,
  };
  const valueStyle: CSSProperties = {
    ...wrapProse,
    fontSize: valueSize,
    color: textColor,
    fontWeight: 650,
    letterSpacing: 0,
  };
  // Title labels are one-line metadata; long section names truncate rather than
  // wrapping the rail off its row.
  const ellipsisSpan: CSSProperties = {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
                background: "transparent",
                border: `1px solid ${line}`,
                borderRadius: 4,
                padding: "1px 7px",
                height: 17,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: UI_COLORS.live,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: textColor,
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
      const agenda = activeAgenda(state);
      const sectionIdx = slot.sectionIndex;
      const section = agenda.sections[sectionIdx] ?? agenda.sections[0];
      const doneRow = agenda.sectionsDone[sectionIdx] ?? [];
      const total = section?.bullets.length ?? 0;
      const done = doneRow.filter(Boolean).length;
      const ratio = total === 0 ? 0 : done / total;
      const titleText = section?.title || t("bar.progress");
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span style={ellipsisSpan}>{t("bar.progress")} · {titleText}</span>
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
                background: lineSoft,
                border: `1px solid ${line}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  height: "100%",
                  background: accent,
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
              minWidth: 0,
            }}
          >
            {items.map((item, i) => {
              const label = stackItemLabel(item);
              return (
                <span
                  key={`${label}-${i}`}
                  style={{
                    ...truncateLine,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: fontFamilies.mono,
                    fontSize: 13,
                    fontWeight: 500,
                    color: textColor,
                    background: surface,
                    border: `1px solid ${line}`,
                    borderRadius: 4,
                    padding: "4px 10px",
                    letterSpacing: "0.01em",
                    boxShadow: `inset 0 -1px 0 ${lineSoft}`,
                    maxWidth: valueSize >= 32 ? 220 : 160,
                  }}
                >
                  <BrandIcon
                    iconKey={item.iconKey}
                    mode={item.iconMode}
                    color={textColor}
                    size={13}
                    label={label}
                  />
                  <span style={{ ...truncateLine, minWidth: 0 }}>{label}</span>
                </span>
              );
            })}
          </div>
        </>
      );
    }

    case "topic": {
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span style={ellipsisSpan}>{state.cover.todayLabel || t("bar.topic")}</span>
          </div>
          <div style={{ ...valueStyle, ...clampLines(2) }}>
            {state.cover.todayTopic}
          </div>
        </>
      );
    }

    case "agenda": {
      // Lecture lower-third: where are we in the talk, and what comes next —
      // all derived from the sections the sidebar would otherwise be showing.
      const agenda = activeAgenda(state);
      const sections = agenda.sections;
      const count = sections.length;
      const idx = Math.min(Math.max(0, agenda.activeSection), Math.max(0, count - 1));
      const current = sections[idx];
      const upNext = sections[idx + 1];
      const pad = (n: number) => String(n).padStart(2, "0");
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span style={ellipsisSpan}>
              {t("bar.agenda")} · {pad(count === 0 ? 0 : idx + 1)}/{pad(count)}
            </span>
            <AgendaTimer
              startedAtIso={agenda.activeSectionStartedAt || state.liveSession.startedAt}
              minutes={current?.minutes}
              textColor={textColor}
            />
          </div>
          <div
            style={{
              ...valueStyle,
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              minWidth: 0,
            }}
          >
            <span style={{ ...ellipsisSpan, fontFamily: fontFamilies.serif }}>
              {current?.title || t("bar.agenda")}
            </span>
            {upNext?.title ? (
              <span
                style={{
                  ...ellipsisSpan,
                  fontSize: Math.max(11, Math.round(valueSize * 0.6)),
                  fontWeight: 500,
                  color: mutedText,
                  flexShrink: 2,
                }}
              >
                {t("bar.agendaNext")} · {upNext.title}
              </span>
            ) : null}
          </div>
        </>
      );
    }

    case "social": {
      // Persistent attribution. A picked handle (socialIndex) wins when it is
      // still visible and non-empty; otherwise fall back to the first visible
      // one so the slot never goes blank because of a socials re-shuffle.
      const socials = state.cover.socials;
      const picked =
        slot.socialIndex !== undefined ? socials[slot.socialIndex] : undefined;
      const social =
        picked && picked.visible && picked.value.trim().length > 0
          ? picked
          : socials.find((s) => s.visible && s.value.trim().length > 0);
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span style={ellipsisSpan}>{t("bar.social")}</span>
          </div>
          <div
            style={{
              ...valueStyle,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              minWidth: 0,
            }}
          >
            {social ? (
              <>
                <span style={ellipsisSpan}>{social.label}</span>
                <span style={{ color: mutedText, fontWeight: 500 }}>·</span>
                <span style={{ ...ellipsisSpan, flexShrink: 2 }}>{social.value}</span>
              </>
            ) : (
              <span style={{ color: mutedText }}>—</span>
            )}
          </div>
        </>
      );
    }

    case "text": {
      return (
        <>
          <div style={titleStyle}>
            <div style={railStyle} />
            <span style={ellipsisSpan}>{slot.title}</span>
          </div>
          <div style={{ ...valueStyle, ...clampLines(2) }}>{slot.text}</div>
        </>
      );
    }
  }
}

/** "08:12 / 30:00" — time in the current section over its planned duration.
 *  No start yet → planned only; no plan → elapsed only; neither → nothing. */
function AgendaTimer({
  startedAtIso,
  minutes,
  textColor,
}: {
  startedAtIso: string;
  minutes: number | undefined;
  textColor: string;
}) {
  const startedMs = startedAtIso ? new Date(startedAtIso).getTime() : NaN;
  const ready = Number.isFinite(startedMs);
  const now = useNow(ready);
  const plannedLabel = minutes ? formatElapsed(minutes * 60_000) : "";
  if (!ready && !plannedLabel) return null;
  const elapsedLabel = ready ? formatElapsed(Math.max(0, now - startedMs)) : "";
  return (
    <span style={{ marginLeft: 4, whiteSpace: "nowrap", color: textColor }}>
      {elapsedLabel}
      {elapsedLabel && plannedLabel ? " / " : ""}
      {plannedLabel}
    </span>
  );
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
