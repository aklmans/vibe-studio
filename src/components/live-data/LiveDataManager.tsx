import type { CSSProperties } from "react";
import type { OverlayState } from "../../types";
import { UI_BORDERS, UI_COLORS } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import SidebarSectionEditor from "../SidebarSectionEditor";
import LiveSessionEditor from "../LiveSessionEditor";
import StackEditor from "../StackEditor";
import BottomBarSegmentEditor from "../BottomBarSegmentEditor";
import SessionRecipePanel from "./SessionRecipePanel";
import {
  WorkbenchButton,
  WorkbenchLabel,
  WorkbenchSegmented,
  workbenchPanelStyle,
} from "../shared/Field";

interface LiveDataManagerProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  dateKey: string;
  persistence: {
    databaseConfigured: boolean;
    loading: boolean;
    saving: boolean;
    error: string | null;
    savedAt: string | null;
    session: {
      status: "draft" | "live" | "ended";
      title: string;
    } | null;
  };
  onReload: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
}

const SECTION_ACCENTS = [
  UI_COLORS.sectionAccent,
  UI_COLORS.danger,
  UI_COLORS.sectionAccentWarm,
] as const;

const panelStyle: CSSProperties = {
  ...workbenchPanelStyle,
};

const panelBodyStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  padding: 16,
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: UI_COLORS.textSoft,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export default function LiveDataManager({
  state,
  onChange,
  dateKey,
  persistence,
  onReload,
  onStartSession,
  onEndSession,
}: LiveDataManagerProps) {
  const { t } = useLocale();
  const canWrite = persistence.databaseConfigured && !persistence.loading;
  const statusLabel = persistence.session
    ? t(`liveData.status.${persistence.session.status}`)
    : t("liveData.status.local");

  return (
    <div
      data-testid="live-data-manager"
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
          gap: 16,
          alignItems: "start",
          width: "100%",
          maxWidth: 1320,
          margin: "0 auto",
          paddingBottom: 20,
        }}
      >
        <section
          data-testid="live-data-session-bar"
          style={{
            ...panelStyle,
            gridColumn: "1 / -1",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: UI_COLORS.text,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("liveData.session")}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: UI_COLORS.accent,
                    background: UI_COLORS.previewBadgeSurface,
                    border: UI_BORDERS.control,
                    borderRadius: 6,
                    padding: "2px 8px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {statusLabel}
                </span>
                <span style={{ fontSize: 11, color: UI_COLORS.textMuted }}>
                  {`${t("liveData.date")} ${dateKey}`}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: persistence.error ? UI_COLORS.danger : UI_COLORS.textMuted,
                  lineHeight: 1.4,
                }}
              >
                {persistence.error
                  ? persistence.error
                  : persistence.loading
                    ? t("liveData.loading")
                    : !persistence.databaseConfigured
                      ? t("liveData.localMode")
                      : persistence.saving
                        ? t("liveData.saving")
                        : persistence.savedAt
                          ? t("liveData.saved")
                          : t("liveData.database")}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <SessionButton onClick={onReload} disabled={persistence.loading}>
                {t("liveData.reload")}
              </SessionButton>
              <SessionButton
                onClick={onStartSession}
                disabled={!canWrite || persistence.saving}
                accentColor={UI_COLORS.sectionAccent}
              >
                {t("liveData.startSession")}
              </SessionButton>
              <SessionButton
                onClick={onEndSession}
                disabled={!canWrite || persistence.saving}
                accentColor={UI_COLORS.sectionAccentWarm}
              >
                {t("liveData.endSession")}
              </SessionButton>
            </div>
          </div>
        </section>

        <div style={{ gridColumn: "1 / -1" }}>
          <SessionRecipePanel state={state} onChange={onChange} />
        </div>

        <section data-testid="live-data-sections" style={panelStyle}>
          <PanelHeader
            title={t("group.sections")}
            hint={t("group.sections.hint")}
            accentColor={UI_COLORS.sectionAccent}
          />
          <div style={panelBodyStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <WorkbenchLabel style={labelStyle}>{t("label.activeSection")}</WorkbenchLabel>
              <WorkbenchSegmented
                active={String(state.sidebar.activeSection)}
                onSelect={(value) =>
                  onChange(
                    patchSection(state, "sidebar", {
                      activeSection: Number(value),
                    }),
                  )
                }
                options={state.sidebar.sections.map((section, idx) => ({
                  value: String(idx),
                  label: section.title || `${t("label.section")} ${idx + 1}`,
                  testId: `live-data-active-section-${idx}`,
                }))}
              />
            </div>

            {state.sidebar.sections.map((_, idx) => (
              <EditorBlock
                key={idx}
                label={`${t("label.section")} ${idx + 1}`}
                accentColor={SECTION_ACCENTS[idx]}
              >
                <SidebarSectionEditor
                  state={state}
                  onChange={onChange}
                  index={idx}
                  accentColor={SECTION_ACCENTS[idx]}
                />
              </EditorBlock>
            ))}
          </div>
        </section>

        <section data-testid="live-data-live-bar" style={panelStyle}>
          <PanelHeader
            title={t("group.liveBar")}
            hint={t("group.liveBar.hint")}
            accentColor={UI_COLORS.sectionAccentWarm}
          />
          <div style={panelBodyStyle}>
            <EditorBlock label={t("label.liveSession")} accentColor={UI_COLORS.sectionAccent}>
              <LiveSessionEditor state={state} onChange={onChange} />
            </EditorBlock>

            <EditorBlock label={t("label.stack")} accentColor={UI_COLORS.sectionAccentAlt}>
              <StackEditor state={state} onChange={onChange} />
            </EditorBlock>

            {[0, 1, 2].map((idx) => (
              <EditorBlock
                key={idx}
                label={`${t("label.segment")} ${idx + 1}`}
                accentColor={SECTION_ACCENTS[idx]}
              >
                <BottomBarSegmentEditor
                  state={state}
                  onChange={onChange}
                  index={idx}
                />
              </EditorBlock>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SessionButton({
  children,
  onClick,
  disabled,
  accentColor = UI_COLORS.textSoft,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  accentColor?: string;
}) {
  return (
    <WorkbenchButton
      onClick={onClick}
      disabled={disabled}
      tone={accentColor === UI_COLORS.textSoft ? "neutral" : "accent"}
      accentColor={accentColor}
      style={{
        minWidth: 82,
        height: 30,
        padding: "0 12px",
      }}
    >
      {children}
    </WorkbenchButton>
  );
}

function PanelHeader({
  title,
  hint,
  accentColor,
}: {
  title: string;
  hint: string;
  accentColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 16px",
        borderBottom: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: UI_COLORS.text,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 3,
              height: 14,
              borderRadius: 2,
              background: accentColor,
            }}
          />
          {title}
        </div>
        <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
          {hint}
        </div>
      </div>
    </div>
  );
}

function EditorBlock({
  label,
  accentColor,
  children,
}: {
  label: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 14,
        borderTop: UI_BORDERS.panel,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: accentColor,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
