import type { OverlayState } from "../types";
import type { Rect } from "../lib/overlay-layout";
import { activeAgenda, activeAgendaProfile, sectionWindow } from "../lib/agenda";
import { formatElapsed } from "../lib/bottomBar";
import { useNow } from "../hooks/useNow";
import { useLocale } from "../hooks/useLocale";
import { clampLines, fontFamilies } from "../lib/typography";
import { editorialPalette } from "./lib/editorial-palette";

/** "with Someone" is how the author is stored; the card wants the bare name. */
function presenterName(hookText: string): string {
  return hookText.replace(/^with\s+/i, "").trim();
}

/** How many agenda rows the lecture card shows before windowing kicks in. */
const LECTURE_AGENDA_WINDOW = 5;

/**
 * The lecture presenter card, under the camera: this stream's title (content),
 * then the presenter's name and affiliation lines (Brand layer). In lecture
 * layouts a run-of-show checklist follows — the host checks sections off
 * manually; the active one carries the live section timer.
 */
export default function PresenterIntro({
  state,
  rect,
}: {
  state: OverlayState;
  rect: Rect;
}) {
  const { t } = useLocale();
  const { brand, cover, colors } = state;
  const E = editorialPalette(colors);
  const name = presenterName(cover.hookText);
  const lines = brand.presenterLines.filter((line) => line.trim().length > 0);
  const showAgenda = activeAgendaProfile(state) === "lecture";
  // A symposium-style lecture has one speaker per section: the card introduces
  // whoever the ACTIVE section belongs to, falling back to the host.
  const agenda = activeAgenda(state);
  const activeIdx = Math.min(
    Math.max(0, agenda.activeSection),
    Math.max(0, agenda.sections.length - 1),
  );
  const activeSpeaker = showAgenda
    ? (agenda.sections[activeIdx]?.speaker ?? "").trim()
    : "";
  const guest = Boolean(activeSpeaker) && activeSpeaker !== name;
  const displayName = activeSpeaker || name;
  // The guest's own role / affiliation lines (never the host's).
  const guestLines = guest
    ? (agenda.sections[activeIdx]?.speakerLines ?? []).filter(
        (line) => line.trim().length > 0,
      )
    : [];

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
          {guest && (
            <div
              data-testid="overlay-presenter-now-speaking"
              style={{
                fontFamily: fontFamilies.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: E.activeRule,
              }}
            >
              {t("presenter.nowSpeaking")}
            </div>
          )}
          {displayName && (
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
              {displayName}
            </div>
          )}
          {/* Affiliation lines: the guest's own when a guest is on, otherwise
              the host's — the two identities never mix. */}
          {guest &&
            guestLines.map((line, index) => (
              <div
                key={index}
                data-testid={`overlay-presenter-guest-line-${index}`}
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
          {!guest &&
            lines.map((line, index) => (
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
          {guest && name && (
            <div
              data-testid="overlay-presenter-host"
              style={{
                ...clampLines(1),
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.45,
                color: colors.mutedText,
              }}
            >
              {t("presenter.hostedBy")} {name}
            </div>
          )}
        </div>

        {showAgenda && <LectureAgendaList state={state} />}
      </div>
    </div>
  );
}

/**
 * The lecture run of show, under the presenter identity: numbered sections
 * with their planned minutes. A section reads done only when the host checks
 * it off (accent check + strike) — driving to the next section never marks
 * the previous one. The active section carries an accent rail and the live
 * "elapsed / planned" section timer; other rows stay quiet. More sections
 * than the window → the same sliding window as the workbench sidebar, with a
 * mono 0X–0Y / 0Z indicator.
 */
function LectureAgendaList({ state }: { state: OverlayState }) {
  const { t } = useLocale();
  const { colors, liveSession } = state;
  const E = editorialPalette(colors);
  const accent = E.activeRule;
  const agenda = activeAgenda(state);
  const total = agenda.sections.length;
  const activeIdx = Math.min(Math.max(0, agenda.activeSection), Math.max(0, total - 1));
  const { start, end } = sectionWindow(activeIdx, total, LECTURE_AGENDA_WINDOW);
  const windowed = agenda.sections
    .map((section, idx) => ({ section, idx }))
    .slice(start, end);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      data-testid="overlay-lecture-agenda"
      style={{
        borderTop: `1px solid ${E.line}`,
        paddingTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Block label + window indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          fontFamily: fontFamilies.mono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.subtleText,
        }}
      >
        <span>{t("bar.agenda")}</span>
        {total > LECTURE_AGENDA_WINDOW && (
          <span data-testid="lecture-agenda-window" style={{ fontWeight: 600, letterSpacing: "0.1em" }}>
            {pad(start + 1)}–{pad(end)} / {pad(total)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {windowed.map(({ section, idx }) => {
          const passed = agenda.completed[idx] === true;
          const current = idx === activeIdx && !passed;
          return (
            <div
              key={idx}
              data-testid={`lecture-agenda-row-${idx}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                minHeight: 24,
              }}
            >
              {/* State glyph: passed = accent check, current = accent rail, upcoming = hollow */}
              {passed ? (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    background: `${accent}26`,
                    border: `1px solid ${accent}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5L3.5 6.5L7.5 2.5"
                      stroke={accent}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <div
                  style={{
                    width: current ? 3 : 14,
                    height: current ? 16 : 14,
                    background: current ? accent : "transparent",
                    border: current ? "none" : `1px solid ${E.line}`,
                    // The current rail is narrower than the 14px glyph column —
                    // keep the text column aligned across all three states.
                    marginRight: current ? 11 : 0,
                    flexShrink: 0,
                  }}
                />
              )}

              <span
                style={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: current ? colors.textColor : colors.subtleText,
                  flexShrink: 0,
                }}
              >
                {pad(idx + 1)}
              </span>

              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: current ? 15 : 14,
                  fontWeight: current ? 650 : 500,
                  lineHeight: 1.35,
                  color: passed
                    ? `${colors.mutedText}CC`
                    : current
                      ? colors.textColor
                      : colors.mutedText,
                  textDecoration: passed ? "line-through" : "none",
                }}
              >
                {section.title || "—"}
                {(section.speaker ?? "").trim() && (
                  <span
                    data-testid={`lecture-agenda-speaker-${idx}`}
                    style={{ color: colors.subtleText, fontWeight: 500 }}
                  >
                    {" · "}
                    {section.speaker}
                  </span>
                )}
              </span>

              {current ? (
                <SectionTimer
                  startedAtIso={agenda.activeSectionStartedAt || liveSession.startedAt}
                  minutes={section.minutes}
                  color={accent}
                />
              ) : (
                section.minutes !== undefined && (
                  <span
                    style={{
                      fontFamily: fontFamilies.mono,
                      fontSize: 10,
                      fontWeight: 500,
                      color: colors.subtleText,
                      flexShrink: 0,
                    }}
                  >
                    {section.minutes}m
                  </span>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "08:12 / 30:00" — live time in the current section over its plan. */
function SectionTimer({
  startedAtIso,
  minutes,
  color,
}: {
  startedAtIso: string;
  minutes: number | undefined;
  color: string;
}) {
  const startedMs = startedAtIso ? new Date(startedAtIso).getTime() : NaN;
  const ready = Number.isFinite(startedMs);
  const now = useNow(ready);
  const plannedLabel = minutes ? formatElapsed(minutes * 60_000) : "";
  if (!ready && !plannedLabel) return null;
  const elapsedLabel = ready ? formatElapsed(Math.max(0, now - startedMs)) : "";
  return (
    <span
      style={{
        fontFamily: fontFamilies.mono,
        fontSize: 11,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {elapsedLabel}
      {elapsedLabel && plannedLabel ? " / " : ""}
      {plannedLabel}
    </span>
  );
}
