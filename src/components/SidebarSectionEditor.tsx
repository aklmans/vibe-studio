import type { OverlayState } from "../types";
import { UI_COLORS, cssAlpha } from "../lib/design-tokens";
import { patchSection } from "../lib/state";
import { useLocale } from "../hooks/useLocale";
import { SectionInput } from "./shared/Field";

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
  const section = state.sidebar.sections[index];
  if (!section) return null;

  const updateTitle = (value: string) => {
    const sections = state.sidebar.sections.map((s, i) =>
      i === index ? { ...s, title: value } : s,
    );
    onChange(patchSection(state, "sidebar", { sections }));
  };

  // Planned duration in whole minutes; blank clears it. v1 content, so the
  // agent may also draft it — this is the manual editor for the same field.
  const updateMinutes = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const minutes =
      Number.isFinite(parsed) && parsed >= 1 && parsed <= 999 ? parsed : undefined;
    const sections = state.sidebar.sections.map((s, i) => {
      if (i !== index) return s;
      const { minutes: _drop, ...rest } = s;
      return { ...rest, ...(minutes !== undefined ? { minutes } : {}) };
    });
    onChange(patchSection(state, "sidebar", { sections }));
  };

  const updateBullet = (bulletIdx: number, value: string) => {
    const sections = state.sidebar.sections.map((s, i) => {
      if (i !== index) return s;
      const bullets = s.bullets.map((b, j) => (j === bulletIdx ? value : b));
      return { ...s, bullets };
    });
    onChange(patchSection(state, "sidebar", { sections }));
  };

  const toggleBulletDone = (bulletIdx: number) => {
    const sectionsDone = (state.sidebar.sectionsDone ?? []).map((row, i) =>
      i === index ? row.map((v, j) => (j === bulletIdx ? !v : v)) : row,
    );
    onChange(patchSection(state, "sidebar", { sectionsDone }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionInput
        label={t("label.title")}
        value={section.title}
        onChange={updateTitle}
        testId={`sidebar-s${index + 1}-title`}
      />
      <SectionInput
        label={t("label.plannedMinutes")}
        value={section.minutes !== undefined ? String(section.minutes) : ""}
        onChange={updateMinutes}
        placeholder={t("label.plannedMinutesPlaceholder")}
        testId={`sidebar-s${index + 1}-minutes`}
      />
      {section.bullets.map((b, i) => {
        const done = state.sidebar.sectionsDone?.[index]?.[i] ?? false;
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
              onClick={() => toggleBulletDone(i)}
              title={done ? t("btn.markUndone") : t("btn.markDone")}
              aria-pressed={done}
              style={{
                // A quiet hairline checkbox, not a filled app button: the single
                // accent only tints it once the bullet is marked done.
                width: 22,
                height: 22,
                borderRadius: 3,
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
    </div>
  );
}
