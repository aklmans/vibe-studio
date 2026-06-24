import type { CSSProperties, ReactNode } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
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
} from "../shared/Field";
import { LineSegmented } from "../inspector/EditorRow";

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
  const statusColor =
    persistence.session?.status === "live"
      ? UI_COLORS.accent
      : persistence.session?.status === "ended"
        ? UI_COLORS.textMuted
        : UI_COLORS.textSubtle;

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
      {/* One editorial column — ruled sections, no nested card panels. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 880,
          margin: "0 auto",
          padding: "4px 8px 48px",
          boxSizing: "border-box",
        }}
      >
        {/* Session status bar — a ruled header row, not a card. */}
        <section
          data-testid="live-data-session-bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 2px 18px",
            borderBottom: `1px solid ${UI_COLORS.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: UI_COLORS.text,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {t("liveData.session")}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: statusColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--app-font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    color: statusColor,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {statusLabel}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 11,
                  color: UI_COLORS.textMuted,
                  letterSpacing: "0.02em",
                }}
              >
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
              tone="accent"
            >
              {t("liveData.startSession")}
            </SessionButton>
            <SessionButton
              onClick={onEndSession}
              disabled={!canWrite || persistence.saving}
            >
              {t("liveData.endSession")}
            </SessionButton>
          </div>
        </section>

        <RuledSection
          testId="live-data-sections"
          title={t("group.sections")}
          hint={t("group.sections.hint")}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <WorkbenchLabel style={labelStyle}>
              {t("label.activeSection")}
            </WorkbenchLabel>
            <LineSegmented
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
            <EditorBlock key={idx} label={`${t("label.section")} ${idx + 1}`}>
              <SidebarSectionEditor
                state={state}
                onChange={onChange}
                index={idx}
                accentColor={UI_COLORS.accent}
              />
            </EditorBlock>
          ))}
        </RuledSection>

        <RuledSection
          testId="live-data-live-session"
          title={t("group.liveSession")}
          hint={t("group.liveSession.hint")}
        >
          <LiveSessionEditor state={state} onChange={onChange} />
        </RuledSection>

        <RuledSection
          testId="live-data-stack"
          title={t("group.stack")}
          hint={t("group.stack.hint")}
        >
          <StackEditor state={state} onChange={onChange} />
        </RuledSection>

        <RuledSection
          testId="live-data-bottom-bar"
          title={t("group.bottomBarSegments")}
          hint={t("group.bottomBarSegments.hint")}
        >
          {[0, 1, 2].map((idx) => (
            <EditorBlock key={idx} label={`${t("label.segment")} ${idx + 1}`}>
              <BottomBarSegmentEditor
                state={state}
                onChange={onChange}
                index={idx}
              />
            </EditorBlock>
          ))}
        </RuledSection>

        {/* Session recipe — kept as a single bordered textarea-like exception. */}
        <div style={{ marginTop: 32 }}>
          <SessionRecipePanel state={state} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

function SessionButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "accent";
}) {
  return (
    <WorkbenchButton
      onClick={onClick}
      disabled={disabled}
      tone={tone}
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

/**
 * A ruled editorial region: a top rule, a mono section eyebrow + hint, and a
 * stacked body. No rounded panel, no nested card — structure comes from the
 * rule and the heading, the way the inspector and Zhaphar lists do.
 */
function RuledSection({
  title,
  hint,
  testId,
  children,
}: {
  title: string;
  hint: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <section
      data-testid={testId}
      style={{
        marginTop: 32,
        paddingTop: 22,
        borderTop: `1px solid ${UI_COLORS.rule}`,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
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
        </div>
        <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
          {hint}
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * A labelled editing row inside a ruled section. A quiet mono label and a thin
 * hairline above it — a ruled row, never a card-in-card block.
 */
function EditorBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingTop: 16,
        borderTop: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--app-font-mono)",
          fontSize: 10,
          fontWeight: 600,
          color: UI_COLORS.textMuted,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
