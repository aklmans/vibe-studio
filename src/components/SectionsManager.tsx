import type { OverlayState } from "../types";
import { UI_COLORS, cssAlpha } from "../lib/design-tokens";
import {
  MAX_AGENDA_SECTIONS,
  activeAgenda,
  addSection,
  clampSectionIndex,
  driveAgendaTo,
  moveSection,
  removeSection,
  toggleSectionCompleted,
} from "../lib/agenda";
import { useLocale } from "../hooks/useLocale";
import SectionChips from "./inspector/SectionChips";
import SidebarSectionEditor from "./SidebarSectionEditor";
import { WorkbenchButton } from "./shared/Field";

const mono = "var(--app-font-mono)";

/**
 * The agenda structure manager — the one place sections are added, removed and
 * reordered (up to 12). Fixed-width numbered chips select (and drive) a
 * section; the SELECTION LINE below carries its title, planned minutes, the
 * manual completion checkbox and the count; a uniform four-button grid holds
 * the structure actions; the editor edits the selected section.
 */
export default function SectionsManager({
  state,
  onChange,
  testIdPrefix = "sections",
}: {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix?: string;
}) {
  const { t } = useLocale();
  const agenda = activeAgenda(state);
  const sections = agenda.sections;
  const active = clampSectionIndex(state, agenda.activeSection);
  const activeSection = sections[active];
  const isCompleted = agenda.completed[active] === true;
  const atCap = sections.length >= MAX_AGENDA_SECTIONS;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div data-testid={`${testIdPrefix}-manager`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionChips
        sections={sections}
        active={active}
        completed={agenda.completed}
        onSelect={(index) => onChange(driveAgendaTo(state, index, new Date().toISOString()))}
        testIdPrefix={`${testIdPrefix}-chip`}
      />

      {/* Selection line: completion checkbox · index · title · minutes · count.
          The chips above stay pure numbers so their widths never rag. */}
      <div
        data-testid={`${testIdPrefix}-selected`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 0",
          borderTop: `1px solid ${UI_COLORS.border}`,
          borderBottom: `1px solid ${UI_COLORS.border}`,
        }}
      >
        <button
          type="button"
          data-testid={`${testIdPrefix}-completed`}
          onClick={() => onChange(toggleSectionCompleted(state, active))}
          aria-pressed={isCompleted}
          title={t(isCompleted ? "sections.unmarkCompleted" : "sections.markCompleted")}
          style={{
            width: 18,
            height: 18,
            borderRadius: 0,
            border: `1px solid ${
              isCompleted ? cssAlpha(UI_COLORS.accent, 64) : UI_COLORS.controlBorder
            }`,
            background: isCompleted ? cssAlpha(UI_COLORS.accent, 12) : "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 0.12s, background 0.12s",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
            <path
              d="M2 5.5L4.5 8L9 3"
              stroke={isCompleted ? UI_COLORS.accentText : UI_COLORS.textSubtle}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span
          style={{
            fontFamily: mono,
            fontSize: 11,
            fontWeight: 600,
            color: UI_COLORS.textSubtle,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {pad(active + 1)}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 13,
            fontWeight: 650,
            color: UI_COLORS.text,
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {activeSection?.title || "—"}
        </span>
        {activeSection?.minutes !== undefined && (
          <span style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted, flexShrink: 0 }}>
            {activeSection.minutes}m
          </span>
        )}
        <span
          data-testid={`${testIdPrefix}-count`}
          style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textSubtle, flexShrink: 0 }}
        >
          {sections.length}/{MAX_AGENDA_SECTIONS}
        </span>
      </div>

      {/* Structure actions: one uniform grid — no ragged wrapping. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
        <WorkbenchButton
          testId={`${testIdPrefix}-add`}
          onClick={() => onChange(addSection(state, `${t("label.section")} ${sections.length + 1}`))}
          disabled={atCap}
          tone="accent"
          style={{ height: 28, padding: "0 4px" }}
        >
          + {t("sections.add")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-move-up`}
          onClick={() => onChange(moveSection(state, active, -1))}
          disabled={active <= 0}
          style={{ height: 28, padding: "0 4px" }}
        >
          ↑ {t("sections.moveUp")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-move-down`}
          onClick={() => onChange(moveSection(state, active, 1))}
          disabled={active >= sections.length - 1}
          style={{ height: 28, padding: "0 4px" }}
        >
          ↓ {t("sections.moveDown")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-remove`}
          onClick={() => onChange(removeSection(state, active))}
          disabled={sections.length <= 1}
          tone="danger"
          style={{ height: 28, padding: "0 4px" }}
        >
          {t("sections.remove")}
        </WorkbenchButton>
      </div>

      <div data-testid={`${testIdPrefix}-editor-${active}`}>
        <SidebarSectionEditor
          state={state}
          onChange={onChange}
          index={active}
          accentColor={UI_COLORS.accent}
        />
      </div>
    </div>
  );
}
