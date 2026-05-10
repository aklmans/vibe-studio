import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import { patchSection } from "../lib/state";
import { useLocale } from "../hooks/useLocale";

interface SectionInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
}

function SectionInput({ label, value, onChange, testId }: SectionInputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: UI_COLORS.textSoft,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: UI_COLORS.controlSurface,
          border: `1px solid ${UI_COLORS.controlBorder}`,
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 13,
          color: UI_COLORS.text,
          outline: "none",
          fontFamily: "inherit",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = UI_COLORS.focus)}
        onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
      />
    </div>
  );
}

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
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: `1px solid ${done ? `${accentColor}60` : UI_COLORS.controlBorder}`,
                background: done ? `${accentColor}20` : UI_COLORS.controlSurface,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginBottom: 1,
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
