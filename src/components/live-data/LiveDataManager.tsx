import { useState } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { LineSegmented } from "../inspector/EditorRow";
import SourceOfTruthBar, { type SessionPersistence } from "./SourceOfTruthBar";
import { IDLE_OBS_SYNC, type ObsSyncState } from "./obs-sync";
import SessionConfigDialog from "./SessionConfigDialog";
import ManualSettings from "./ManualSettings";
import AgentView from "./AgentView";
import ConfigJsonDrawer from "./ConfigJsonDrawer";

type ConfigMode = "manual" | "agent";

interface LiveDataManagerProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  dateKey: string;
  persistence: SessionPersistence;
  /** Real OBS / live-state push status for the source-of-truth bar. */
  obsSync?: ObsSyncState;
  onReload: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
  /** Opens the studio SettingsDrawer (fallback for Studio Appearance). */
  onOpenSettings: () => void;
  /** Safe reset (reused by the inline Studio Appearance controls). */
  onReset: () => void;
  /** Close the Session Config Center dialog (returns to the previous tab). */
  onClose?: () => void;
}

/**
 * Session Config Center — a centered modal dialog over the dimmed workbench, in
 * the spirit of a desktop settings window. The dialog header carries the top
 * mental model: Manual Settings vs Agent, plus close. A slim source-of-truth
 * strip shows status + lifecycle + Open JSON. The body is the active mode:
 *   - Manual Settings: a left menu (Session / Cover / Branding / Display /
 *     Studio Appearance / Data) + the selected panel's content.
 *   - Agent: a chat window (transcript + composer) with real-AI / local handoff.
 * JSON stays a global power-tool drawer (top Open JSON, per-field Open in JSON,
 * Agent Review in JSON) — drift-safe, never a second apply path. It renders as a
 * sibling above the dialog and takes over Esc / focus while open.
 */
export default function LiveDataManager({
  state,
  onChange,
  dateKey,
  persistence,
  obsSync = IDLE_OBS_SYNC,
  onReload,
  onStartSession,
  onEndSession,
  onOpenSettings,
  onReset,
  onClose,
}: LiveDataManagerProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<ConfigMode>("manual");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonKey, setJsonKey] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState<string | null>(null);

  const openJson = (key?: string) => {
    setJsonKey(key ?? null);
    setJsonOpen(true);
  };

  // Open the drawer and seed the editing buffer with returned JSON for review.
  // It is never auto-applied — the user still presses Apply.
  const openJsonForReview = (text: string) => {
    setJsonKey(null);
    setReviewText(text);
    setJsonOpen(true);
  };

  const close = onClose ?? (() => {});

  return (
    <>
      <SessionConfigDialog
        onClose={close}
        closeOnEsc={!jsonOpen}
        trapFocus={!jsonOpen}
        modalActive={!jsonOpen}
        ariaLabelledBy="session-config-title"
      >
        {/* Header — title + the top mental model (Manual / Agent) + close. */}
        <header
          data-testid="live-data-manager"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "14px 20px",
            borderBottom: `1px solid ${UI_COLORS.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
            <span
              id="session-config-title"
              style={{
                fontFamily: "var(--app-font-serif)",
                fontSize: 18,
                fontWeight: 500,
                color: UI_COLORS.text,
                whiteSpace: "nowrap",
              }}
            >
              {t("tab.live")}
            </span>
            <div style={{ width: 260, maxWidth: "100%" }}>
              <LineSegmented
                testId="config-mode-switch"
                active={mode}
                onSelect={(value) => setMode(value as ConfigMode)}
                options={[
                  { value: "manual", label: t("configMode.manual"), testId: "config-mode-manual" },
                  { value: "agent", label: t("configMode.agent"), testId: "config-mode-agent" },
                ]}
              />
            </div>
          </div>
          <button
            data-testid="session-config-close"
            onClick={close}
            aria-label={t("drawer.close")}
            title={t("drawer.close")}
            style={{
              appearance: "none",
              border: "none",
              background: "transparent",
              color: UI_COLORS.textMuted,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </header>

        {/* Source-of-truth strip — status + lifecycle + Open JSON. */}
        <SourceOfTruthBar
          dateKey={dateKey}
          persistence={persistence}
          obsSync={obsSync}
          onReload={onReload}
          onStartSession={onStartSession}
          onEndSession={onEndSession}
          onOpenJson={() => openJson()}
        />

        {/* Body — the active mode. Both stay mounted (visibility toggled) so the
            JSON drift stays synced and the IA is statically inspectable. */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
          <div
            data-testid="config-view-manual"
            style={{ display: mode === "manual" ? "flex" : "none", flex: 1, minWidth: 0, minHeight: 0 }}
          >
            <ManualSettings
              state={state}
              onChange={onChange}
              persistence={persistence}
              onReset={onReset}
              onOpenJson={openJson}
              onOpenStudioDrawer={onOpenSettings}
            />
          </div>
          <div
            data-testid="config-view-agent"
            hidden={mode !== "agent"}
            style={{ display: mode === "agent" ? "flex" : "none", flex: 1, minWidth: 0, minHeight: 0 }}
          >
            <AgentView state={state} onOpenJson={() => openJson()} onReviewJson={openJsonForReview} />
          </div>
        </div>
      </SessionConfigDialog>

      <ConfigJsonDrawer
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        state={state}
        onChange={onChange}
        focusKey={jsonKey}
        reviewText={reviewText}
        onReviewConsumed={() => setReviewText(null)}
      />
    </>
  );
}
