import { useState } from "react";
import type { OverlayState } from "../types";
import { UI_COLORS, cssAlpha } from "../lib/design-tokens";
import {
  MAX_AGENDA_SECTIONS,
  activeAgenda,
  activeAgendaProfile,
  addSection,
  clampSectionIndex,
  copyAgendaToProfile,
  moveSection,
  removeSection,
  toggleSectionCompleted,
} from "../lib/agenda";
import type { BarProfileId } from "../lib/overlay-layout";
import { useLocale } from "../hooks/useLocale";
import SectionChips from "./inspector/SectionChips";
import SidebarSectionEditor from "./SidebarSectionEditor";
import { WorkbenchButton } from "./shared/Field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

const ALL_PROFILES: BarProfileId[] = ["workbench", "lecture", "mobile"];

const mono = "var(--app-font-mono)";

/**
 * The agenda structure manager — the one place sections are added, removed and
 * reordered (up to 12). Numbered chips pick the section being EDITED; picking
 * one never drives the live agenda or restarts its timer — advancing on air
 * belongs to the Broadcast agenda drive console. The live section carries a
 * quiet accent dot so the host always sees where the broadcast is while
 * editing anywhere else.
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
  const live = clampSectionIndex(state, agenda.activeSection);
  // Editing selection — local to the manager, independent of the on-air
  // pointer. Starts on the live section; a null value means "follow live".
  const [selectedRaw, setSelectedRaw] = useState<number | null>(null);
  const selected = Math.min(Math.max(selectedRaw ?? live, 0), sections.length - 1);
  const selectedSection = sections[selected];
  const isCompleted = agenda.completed[selected] === true;
  const atCap = sections.length >= MAX_AGENDA_SECTIONS;
  // Planned-minutes total — a time-boxed lecture shouldn't need mental math.
  const totalMinutes = sections.reduce((sum, section) => sum + (section.minutes ?? 0), 0);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div data-testid={`${testIdPrefix}-manager`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionChips
        sections={sections}
        active={selected}
        completed={agenda.completed}
        liveIndex={live}
        liveLabel={t("sections.onAir")}
        onSelect={(index) => setSelectedRaw(index)}
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
          onClick={() => onChange(toggleSectionCompleted(state, selected))}
          aria-pressed={isCompleted}
          aria-label={t(isCompleted ? "sections.unmarkCompleted" : "sections.markCompleted")}
          title={t(isCompleted ? "sections.unmarkCompleted" : "sections.markCompleted")}
          style={{
            width: 24,
            height: 24,
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
          <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
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
          {pad(selected + 1)}
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
          {selectedSection?.title || "—"}
        </span>
        {selected === live && (
          <span
            data-testid={`${testIdPrefix}-live-tag`}
            style={{
              fontFamily: mono,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: UI_COLORS.accentText,
              flexShrink: 0,
            }}
          >
            {t("sections.onAir")}
          </span>
        )}
        {selectedSection?.minutes !== undefined && (
          <span style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted, flexShrink: 0 }}>
            {selectedSection.minutes}m
          </span>
        )}
        {totalMinutes > 0 && (
          <span
            data-testid={`${testIdPrefix}-total-minutes`}
            title={t("sections.totalMinutes")}
            style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted, flexShrink: 0 }}
          >
            Σ {totalMinutes}m
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
          onClick={() => {
            onChange(addSection(state, `${t("label.section")} ${sections.length + 1}`));
            // Jump the editing selection to the newly appended section.
            if (!atCap) setSelectedRaw(sections.length);
          }}
          disabled={atCap}
          tone="accent"
          style={{ height: 28, padding: "0 4px" }}
        >
          + {t("sections.add")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-move-up`}
          onClick={() => {
            onChange(moveSection(state, selected, -1));
            setSelectedRaw(Math.max(0, selected - 1));
          }}
          disabled={selected <= 0}
          style={{ height: 28, padding: "0 4px" }}
        >
          ↑ {t("sections.moveUp")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-move-down`}
          onClick={() => {
            onChange(moveSection(state, selected, 1));
            setSelectedRaw(Math.min(sections.length - 1, selected + 1));
          }}
          disabled={selected >= sections.length - 1}
          style={{ height: 28, padding: "0 4px" }}
        >
          ↓ {t("sections.moveDown")}
        </WorkbenchButton>
        <WorkbenchButton
          testId={`${testIdPrefix}-remove`}
          onClick={() => {
            onChange(removeSection(state, selected));
            setSelectedRaw(Math.max(0, Math.min(selected, sections.length - 2)));
          }}
          disabled={sections.length <= 1}
          tone="danger"
          style={{ height: 28, padding: "0 4px" }}
        >
          {t("sections.remove")}
        </WorkbenchButton>
      </div>

      <div data-testid={`${testIdPrefix}-editor-${selected}`}>
        <SidebarSectionEditor
          state={state}
          onChange={onChange}
          index={selected}
          accentColor={UI_COLORS.accent}
        />
      </div>

      {/* Copy the whole agenda to another scene — the three agendas are
          independent by design; this is the explicit bridge between them. */}
      <div
        data-testid={`${testIdPrefix}-copy-row`}
        style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, paddingTop: 2 }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: UI_COLORS.textSubtle,
          }}
        >
          {t("sections.copyTo")}
        </span>
        {ALL_PROFILES.filter((profile) => profile !== activeAgendaProfile(state)).map((profile) => (
          <AlertDialog key={profile}>
            <AlertDialogTrigger asChild>
              <WorkbenchButton
                testId={`${testIdPrefix}-copy-${profile}`}
                style={{ height: 24, padding: "0 8px", minHeight: 24 }}
              >
                {t(`sceneProfile.${profile}` as Parameters<typeof t>[0])}
              </WorkbenchButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("sections.copyTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("sections.copyDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid={`${testIdPrefix}-copy-cancel`}>
                  {t("btn.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  data-testid={`${testIdPrefix}-copy-confirm-${profile}`}
                  onClick={() =>
                    onChange(copyAgendaToProfile(state, activeAgendaProfile(state), profile))
                  }
                >
                  {t("sections.copyConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>
    </div>
  );
}
