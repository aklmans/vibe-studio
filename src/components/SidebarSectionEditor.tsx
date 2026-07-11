import type { OverlayState } from "../types";
import { UI_COLORS, cssAlpha } from "../lib/design-tokens";
import {
  MAX_SECTION_BULLETS,
  activeAgenda,
  activeAgendaProfile,
  addBullet,
  removeBullet,
  withActiveAgenda,
} from "../lib/agenda";
import { useLocale } from "../hooks/useLocale";
import { SectionInput, WorkbenchButton, fieldLabelStyle, workbenchInputStyle } from "./shared/Field";

interface SidebarSectionEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  index: number;
  accentColor: string;
}

/**
 * Editor for a single sidebar section (title + bullet list + done toggles).
 * Three of these render inside EditorPanel for Section 1/2/3 and all share
 * the same event handlers; only the accent color changes per section.
 */
export default function SidebarSectionEditor({
  state,
  onChange,
  index,
  accentColor,
}: SidebarSectionEditorProps) {
  const { t } = useLocale();
  const agenda = activeAgenda(state);
  const section = agenda.sections[index];
  if (!section) return null;

  const updateTitle = (value: string) => {
    const sections = agenda.sections.map((s, i) =>
      i === index ? { ...s, title: value } : s,
    );
    onChange(withActiveAgenda(state, { ...agenda, sections }));
  };

  // Planned duration in whole minutes; blank clears it. v1 content, so the
  // agent may also draft it — this is the manual editor for the same field.
  const updateMinutes = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const minutes =
      Number.isFinite(parsed) && parsed >= 1 && parsed <= 999 ? parsed : undefined;
    const sections = agenda.sections.map((s, i) => {
      if (i !== index) return s;
      const { minutes: _drop, ...rest } = s;
      return { ...rest, ...(minutes !== undefined ? { minutes } : {}) };
    });
    onChange(withActiveAgenda(state, { ...agenda, sections }));
  };

  // Per-section speaker (v1 content, optional): the lecture card introduces
  // the active section's speaker. Empty clears the field entirely.
  const updateSpeaker = (value: string) => {
    const sections = agenda.sections.map((s, i) => {
      if (i !== index) return s;
      const { speaker: _drop, ...rest } = s;
      return { ...rest, ...(value ? { speaker: value } : {}) };
    });
    onChange(withActiveAgenda(state, { ...agenda, sections }));
  };

  // The speaker's role / affiliation / achievements — one line per entry,
  // mirroring the host's presenterLines editor. All-blank clears the field.
  const updateSpeakerLines = (value: string) => {
    const lines = value.split("\n");
    const keep = lines.some((line) => line.trim().length > 0);
    const sections = agenda.sections.map((s, i) => {
      if (i !== index) return s;
      const { speakerLines: _drop, ...rest } = s;
      return { ...rest, ...(keep ? { speakerLines: lines } : {}) };
    });
    onChange(withActiveAgenda(state, { ...agenda, sections }));
  };

  const updateBullet = (bulletIdx: number, value: string) => {
    const sections = agenda.sections.map((s, i) => {
      if (i !== index) return s;
      const bullets = s.bullets.map((b, j) => (j === bulletIdx ? value : b));
      return { ...s, bullets };
    });
    onChange(withActiveAgenda(state, { ...agenda, sections }));
  };

  const toggleBulletDone = (bulletIdx: number) => {
    const sectionsDone = agenda.sectionsDone.map((row, i) =>
      i === index ? row.map((v, j) => (j === bulletIdx ? !v : v)) : row,
    );
    onChange(withActiveAgenda(state, { ...agenda, sectionsDone }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionInput
        label={t("label.title")}
        value={section.title}
        onChange={updateTitle}
        testId={`sidebar-s${index + 1}-title`}
      />
      {activeAgendaProfile(state) === "lecture" && (
        <>
          <SectionInput
            label={t("label.speaker")}
            value={section.speaker ?? ""}
            onChange={updateSpeaker}
            placeholder={t("label.speakerPlaceholder")}
            testId={`sidebar-s${index + 1}-speaker`}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={fieldLabelStyle}>{t("label.speakerLines")}</label>
            <textarea
              data-testid={`sidebar-s${index + 1}-speaker-lines`}
              aria-label={t("label.speakerLines")}
              value={(section.speakerLines ?? []).join("\n")}
              onChange={(e) => updateSpeakerLines(e.target.value)}
              placeholder={t("label.speakerLinesPlaceholder")}
              rows={2}
              spellCheck={false}
              style={{
                ...workbenchInputStyle,
                height: "auto",
                padding: "8px 10px",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>
        </>
      )}
      <SectionInput
        label={t("label.plannedMinutes")}
        value={section.minutes !== undefined ? String(section.minutes) : ""}
        onChange={updateMinutes}
        placeholder={t("label.plannedMinutesPlaceholder")}
        testId={`sidebar-s${index + 1}-minutes`}
      />
      {section.bullets.map((b, i) => {
        const done = agenda.sectionsDone[index]?.[i] ?? false;
        return (
          <div
            key={i}
            style={{ display: "flex", alignItems: "flex-end", gap: 6 }}
          >
            <div style={{ flex: 1 }}>
              <SectionInput
                label={`${t("label.bullet")} ${i + 1}`}
                value={b}
                onChange={(v) => updateBullet(i, v)}
                testId={`sidebar-s${index + 1}-bullet-${i}`}
              />
            </div>
            <button
              onClick={() => onChange(removeBullet(state, index, i))}
              title={t("sections.removeBullet")}
              aria-label={t("sections.removeBullet")}
              data-testid={`sidebar-s${index + 1}-bullet-${i}-remove`}
              style={{
                width: 22,
                height: 22,
                borderRadius: 0,
                border: `1px solid ${UI_COLORS.controlBorder}`,
                background: "transparent",
                color: UI_COLORS.textSubtle,
                cursor: "pointer",
                fontSize: 12,
                lineHeight: 1,
                flexShrink: 0,
                marginBottom: 3,
              }}
            >
              ×
            </button>
            <button
              onClick={() => toggleBulletDone(i)}
              title={done ? t("btn.markUndone") : t("btn.markDone")}
              aria-pressed={done}
              style={{
                // A quiet hairline checkbox, not a filled app button: the single
                // accent only tints it once the bullet is marked done.
                width: 22,
                height: 22,
                borderRadius: 0,
                border: `1px solid ${done ? cssAlpha(accentColor, 50) : UI_COLORS.controlBorder}`,
                background: done ? cssAlpha(accentColor, 12) : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginBottom: 3,
                transition: "border-color 0.12s, background 0.12s",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M2 5.5L4.5 8L9 3"
                  stroke={done ? accentColor : UI_COLORS.textSubtle}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        );
      })}
      <div>
        <WorkbenchButton
          testId={`sidebar-s${index + 1}-add-bullet`}
          onClick={() => onChange(addBullet(state, index))}
          disabled={section.bullets.length >= MAX_SECTION_BULLETS}
          style={{ height: 24, padding: "0 10px" }}
        >
          + {t("sections.addBullet")}
        </WorkbenchButton>
      </div>
    </div>
  );
}
