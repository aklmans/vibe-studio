import type { CSSProperties, ReactNode } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import SidebarSectionEditor from "../SidebarSectionEditor";
import LiveSessionEditor from "../LiveSessionEditor";
import StackEditor from "../StackEditor";
import BottomBarSegmentEditor from "../BottomBarSegmentEditor";
import { WorkbenchButton, WorkbenchLabel } from "../shared/Field";
import { LineSegmented, RuleNote } from "../inspector/EditorRow";
import type { SessionPersistence } from "./SourceOfTruthBar";

interface SettingsViewProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  persistence: SessionPersistence;
  onOpenJson: () => void;
  onOpenStudioSettings: () => void;
}

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: UI_COLORS.textSoft,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

/**
 * Settings — the manual config workbench (replaces the old "Form"). Grouped so
 * the v1 portable core, the runtime/display controls, studio appearance, and
 * persistence/sync are clearly distinct. Editor testids + business logic are
 * unchanged; this is IA + hierarchy only.
 */
export default function SettingsView({
  state,
  onChange,
  persistence,
  onOpenJson,
  onOpenStudioSettings,
}: SettingsViewProps) {
  const { t } = useLocale();
  const activeSectionIndex = Math.min(
    Math.max(state.sidebar.activeSection, 0),
    Math.max(state.sidebar.sections.length - 1, 0),
  );
  const activeSection = state.sidebar.sections[activeSectionIndex];
  const visibleBadges = state.cover.badges.filter((b) => b.visible).length;
  const visibleSocials = state.cover.socials.filter((s) => s.visible).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 760 }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={eyebrow}>
            <Mark />
            {t("configView.settings")}
          </div>
          <div style={hint}>{t("settingsView.hint")}</div>
        </div>
        <WorkbenchButton
          data-testid="open-json-settings"
          onClick={onOpenJson}
          style={{ minWidth: 110, height: 30, padding: "0 12px", flexShrink: 0 }}
        >
          {t("drawer.openJson")}
        </WorkbenchButton>
      </header>

      {/* ── SESSION CORE ──────────────────────────────────────────────── */}
      <GroupHeader
        id="config-settings-core"
        tone="core"
        title={t("settingsGroup.core")}
        hint={t("settingsGroup.coreHint")}
      />
      <SummaryGroup
        rows={[
          [t("label.title"), state.cover.title || "—"],
          [t("label.topic"), state.cover.todayTopic || "—"],
          [t("cover.visual.label"), t(`cover.visual.${state.cover.visual}`)],
          [t("label.badge"), String(visibleBadges)],
          [t("label.social"), String(visibleSocials)],
        ]}
        note={t("settingsView.brandNote")}
      />

      <FieldGroup
        anchorId="config-form-sections"
        testId="live-data-sections"
        title={t("group.sections")}
        hint={t("configForm.sectionsNote")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <WorkbenchLabel style={labelStyle}>{t("label.activeSection")}</WorkbenchLabel>
          <LineSegmented
            testId="live-data-section-tabs"
            active={String(activeSectionIndex)}
            onSelect={(value) =>
              onChange(patchSection(state, "sidebar", { activeSection: Number(value) }))
            }
            options={state.sidebar.sections.map((section, idx) => ({
              value: String(idx),
              label: section.title || `${t("label.section")} ${idx + 1}`,
              meta: `${(state.sidebar.sectionsDone?.[idx] ?? []).filter(Boolean).length}/${section.bullets.length}`,
              testId: `live-data-section-tab-${idx}`,
            }))}
          />
        </div>
        {activeSection && (
          <div
            data-testid={`live-data-section-panel-${activeSectionIndex}`}
            style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14 }}
          >
            <SidebarSectionEditor
              state={state}
              onChange={onChange}
              index={activeSectionIndex}
              accentColor={UI_COLORS.accent}
            />
          </div>
        )}
      </FieldGroup>

      <FieldGroup
        anchorId="config-form-stack"
        testId="live-data-stack"
        title={t("group.stack")}
        hint={t("group.stack.hint")}
      >
        <StackEditor state={state} onChange={onChange} />
      </FieldGroup>

      {/* ── RUNTIME ───────────────────────────────────────────────────── */}
      <GroupHeader
        id="config-settings-runtime"
        tone="runtime"
        title={t("settingsGroup.runtime")}
        hint={t("settingsGroup.runtimeHint")}
      />
      <FieldGroup
        anchorId="config-form-live-session"
        testId="live-data-live-session"
        title={t("group.liveSession")}
        hint={t("group.liveSession.hint")}
      >
        <LiveSessionEditor state={state} onChange={onChange} />
        <RuleNote>{t("settingsView.runtimeNote")}</RuleNote>
      </FieldGroup>

      {/* ── BROADCAST DISPLAY ─────────────────────────────────────────── */}
      <GroupHeader
        id="config-settings-display"
        tone="runtime"
        title={t("settingsGroup.display")}
        hint={t("settingsGroup.displayHint")}
      />
      <FieldGroup
        anchorId="config-form-bottom-bar"
        testId="live-data-bottom-bar"
        title={t("group.bottomBarSegments")}
        hint={t("group.bottomBarSegments.hint")}
      >
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14 }}
          >
            <span style={segLabel}>{`${t("label.segment")} ${idx + 1}`}</span>
            <BottomBarSegmentEditor state={state} onChange={onChange} index={idx} />
          </div>
        ))}
        <RuleNote>{t("settingsView.displayNote")}</RuleNote>
      </FieldGroup>

      {/* ── STUDIO APPEARANCE ─────────────────────────────────────────── */}
      <GroupHeader
        id="config-settings-appearance"
        tone="runtime"
        title={t("settingsGroup.appearance")}
        hint={t("settingsGroup.appearanceHint")}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
        <WorkbenchButton
          data-testid="open-studio-settings"
          onClick={onOpenStudioSettings}
          style={{ minWidth: 150, height: 32, padding: "0 12px" }}
        >
          {t("settingsView.openStudio")}
        </WorkbenchButton>
        <span style={{ ...hint, maxWidth: 420 }}>{t("settingsView.appearanceNote")}</span>
      </div>

      {/* ── PERSISTENCE & SYNC ────────────────────────────────────────── */}
      <GroupHeader
        id="config-settings-persistence"
        tone="runtime"
        title={t("settingsGroup.persistence")}
        hint={t("settingsGroup.persistenceHint")}
      />
      <SummaryGroup
        rows={[
          [
            t("sourceBar.db"),
            persistence.databaseConfigured
              ? t("sourceBar.dbReady")
              : t("sourceBar.dbLocal"),
          ],
          [t("sourceBar.authority"), t("sourceBar.localDraft")],
          [t("sourceBar.obs"), t("sourceBar.obsState")],
        ]}
        note={t("settingsView.persistenceNote")}
      />
    </div>
  );
}

const eyebrow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: "var(--app-font-mono)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: UI_COLORS.text,
};

const hint: CSSProperties = {
  fontSize: 11,
  color: UI_COLORS.textMuted,
  lineHeight: 1.5,
};

const segLabel: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  color: UI_COLORS.textMuted,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

function Mark({ tone = "accent" }: { tone?: "accent" | "muted" }) {
  return (
    <span
      aria-hidden
      style={{
        width: 3,
        height: 13,
        borderRadius: 2,
        background: tone === "muted" ? UI_COLORS.textMuted : UI_COLORS.accent,
      }}
    />
  );
}

function GroupHeader({
  id,
  tone,
  title,
  hint: groupHint,
}: {
  id: string;
  tone: "core" | "runtime";
  title: string;
  hint: string;
}) {
  const color = tone === "core" ? UI_COLORS.accent : UI_COLORS.textMuted;
  return (
    <div
      id={id}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginTop: 18,
        paddingTop: 22,
        borderTop: `1px solid ${UI_COLORS.rule}`,
        scrollMarginTop: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden style={{ width: 3, height: 14, borderRadius: 2, background: color }} />
        <span
          style={{
            fontFamily: "var(--app-font-mono)",
            fontSize: 11,
            fontWeight: 700,
            color: UI_COLORS.text,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ ...hint, paddingLeft: 11 }}>{groupHint}</div>
    </div>
  );
}

function FieldGroup({
  anchorId,
  testId,
  title,
  hint: groupHint,
  children,
}: {
  anchorId: string;
  testId: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section
      id={anchorId}
      data-testid={testId}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 18,
        paddingTop: 16,
        borderTop: `1px solid ${UI_COLORS.border}`,
        scrollMarginTop: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={segLabel}>{title}</span>
        <span style={hint}>{groupHint}</span>
      </div>
      {children}
    </section>
  );
}

function SummaryGroup({
  rows,
  note,
}: {
  rows: [string, string][];
  note: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "120px minmax(0, 1fr)",
              gap: 12,
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontFamily: "var(--app-font-mono)",
                fontSize: 10,
                fontWeight: 700,
                color: UI_COLORS.textSoft,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "var(--app-font-mono)",
                fontSize: 11,
                color: UI_COLORS.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
      <RuleNote>{note}</RuleNote>
    </div>
  );
}
