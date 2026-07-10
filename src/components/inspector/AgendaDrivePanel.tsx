import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { activeAgenda,
  clampSectionIndex, driveAgendaTo, restartSectionTimer } from "../../lib/agenda";
import { activeBarSegments, withActiveBarSegments } from "../../lib/bottomBar";
import { useLocale } from "../../hooks/useLocale";
import { LineSegmented } from "./EditorRow";
import SectionChips from "./SectionChips";
import { WorkbenchButton } from "../shared/Field";

const mono = "var(--app-font-mono)";

/**
 * The broadcast-time agenda console: step or jump the current section (each
 * drive restarts the on-air "time in section"), restart the timer in place,
 * and pick which social handle the bottom bar's follow slot features. Content
 * (titles, planned minutes) is edited in Session; this panel only drives.
 */
export default function AgendaDrivePanel({
  state,
  onChange,
}: {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}) {
  const { t } = useLocale();
  const agenda = activeAgenda(state);
  const sections = agenda.sections;
  const count = sections.length;
  const idx = clampSectionIndex(state, agenda.activeSection);
  const current = sections[idx];

  const drive = (target: number) =>
    onChange(driveAgendaTo(state, target, new Date().toISOString()));

  // The follow slot: the first social segment in the ACTIVE layout's bar.
  const barSegments = activeBarSegments(state);
  const socialSegmentIndex = barSegments.findIndex(
    (segment) => segment.kind === "social",
  );
  const socialSegment = barSegments[socialSegmentIndex];
  const followIndex =
    socialSegment?.kind === "social" ? socialSegment.socialIndex : undefined;

  const setFollowIndex = (value: string) => {
    if (socialSegmentIndex < 0) return;
    onChange(
      withActiveBarSegments(
        state,
        barSegments.map((segment, i) =>
          i === socialSegmentIndex && segment.kind === "social"
            ? { kind: "social" as const, ...(value === "auto" ? {} : { socialIndex: Number(value) }) }
            : segment,
        ),
      ),
    );
  };

  const addFollowSegment = () =>
    onChange(
      withActiveBarSegments(state, [...barSegments, { kind: "social" as const }]),
    );

  const followOptions = [
    { value: "auto", label: t("agendaDrive.followAuto"), testId: "agenda-follow-auto" },
    ...state.cover.socials
      .map((social, index) => ({ social, index }))
      .filter(({ social }) => social.value.trim().length > 0)
      .map(({ social, index }) => ({
        value: String(index),
        label: social.label || social.value,
        testId: `agenda-follow-${index}`,
      })),
  ];

  return (
    <div data-testid="agenda-drive" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Current position + step controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <WorkbenchButton
          testId="agenda-prev"
          onClick={() => drive(idx - 1)}
          disabled={idx <= 0}
          style={{ height: 30, padding: "0 12px" }}
        >
          ← {t("agendaDrive.prev")}
        </WorkbenchButton>
        <div
          data-testid="agenda-current"
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "center",
            fontFamily: mono,
            fontSize: 11,
            color: UI_COLORS.textSoft,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {String(count === 0 ? 0 : idx + 1).padStart(2, "0")}/{String(count).padStart(2, "0")}
          {" · "}
          {current?.title || "—"}
          {current?.minutes ? ` · ${current.minutes}min` : ""}
        </div>
        <WorkbenchButton
          testId="agenda-next"
          onClick={() => drive(idx + 1)}
          disabled={idx >= count - 1}
          tone="accent"
          style={{ height: 30, padding: "0 12px" }}
        >
          {t("agendaDrive.next")} →
        </WorkbenchButton>
      </div>

      {/* Jump directly to a section — wrapping chips scale to 12 sections. */}
      <SectionChips
        sections={sections}
        active={idx}
        onSelect={(target) => drive(target)}
        testIdPrefix="agenda-jump"
      />

      {/* Timer restart */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <WorkbenchButton
          testId="agenda-restart-timer"
          onClick={() => onChange(restartSectionTimer(state, new Date().toISOString()))}
          style={{ height: 28, padding: "0 10px" }}
        >
          {t("agendaDrive.restartTimer")}
        </WorkbenchButton>
        <span style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted }}>
          {agenda.activeSectionStartedAt
            ? t("agendaDrive.timerRunning")
            : t("agendaDrive.timerIdle")}
        </span>
      </div>

      {/* Follow slot */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: UI_COLORS.textMuted,
          }}
        >
          {t("agendaDrive.followSlot")}
        </span>
        {socialSegmentIndex >= 0 ? (
          <LineSegmented
            testId="agenda-follow"
            active={followIndex === undefined ? "auto" : String(followIndex)}
            onSelect={setFollowIndex}
            options={followOptions}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted }}>
              {t("agendaDrive.noFollowSegment")}
            </span>
            <WorkbenchButton
              testId="agenda-add-follow"
              onClick={addFollowSegment}
              style={{ height: 26, padding: "0 10px" }}
            >
              {t("agendaDrive.addFollowSegment")}
            </WorkbenchButton>
          </div>
        )}
      </div>
    </div>
  );
}
