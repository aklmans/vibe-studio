import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import {
  MAX_AGENDA_SECTIONS,
  activeAgenda,
  addSection,
  clampSectionIndex,
  driveAgendaTo,
  moveSection,
  removeSection,
} from "../lib/agenda";
import { useLocale } from "../hooks/useLocale";
import SectionChips from "./inspector/SectionChips";
import SidebarSectionEditor from "./SidebarSectionEditor";
import { WorkbenchButton } from "./shared/Field";

const mono = "var(--app-font-mono)";

/**
 * The agenda structure manager — the one place sections are added, removed and
 * reordered (up to 12). Selecting a chip drives the agenda (same semantics as
 * the drive panel: the section timer restarts); the editor below edits the
 * selected section's title, planned minutes and bullets.
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
  const atCap = sections.length >= MAX_AGENDA_SECTIONS;

  return (
    <div data-testid={`${testIdPrefix}-manager`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionChips
        sections={sections}
        active={active}
        onSelect={(index) => onChange(driveAgendaTo(state, index, new Date().toISOString()))}
        testIdPrefix={`${testIdPrefix}-chip`}
      />

      {/* Structure row: add, and reorder/remove for the selected section. */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <WorkbenchButton
          testId={`${testIdPrefix}-add`}
          onClick={() => onChange(addSection(state, `${t("label.section")} ${sections.length + 1}`))}
          disabled={atCap}
          tone="accent"
          style={{ height: 26, padding: "0 10px" }}
        >
          + {t("sections.add")}
        </WorkbenchButton>
        <span style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted, marginRight: "auto" }}>
          {sections.length}/{MAX_AGENDA_SECTIONS}
        </span>
        <WorkbenchButton
          testId={`${testIdPrefix}-move-up`}
          onClick={() => onChange(moveSection(state, active, -1))}
          disabled={active <= 0}
          style={{ height: 26, padding: "0 10px" }}
        >
          ↑ {t("sections.moveUp")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-move-down`}
          onClick={() => onChange(moveSection(state, active, 1))}
          disabled={active >= sections.length - 1}
          style={{ height: 26, padding: "0 10px" }}
        >
          ↓ {t("sections.moveDown")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-remove`}
          onClick={() => onChange(removeSection(state, active))}
          disabled={sections.length <= 1}
          tone="danger"
          style={{ height: 26, padding: "0 10px" }}
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
