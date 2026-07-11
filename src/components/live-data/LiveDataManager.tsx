import { useEffect, useState } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { LineSegmented } from "../inspector/EditorRow";
import { type SessionPersistence } from "./SourceOfTruthBar";
import { IDLE_OBS_SYNC, type ObsSyncState } from "./obs-sync";
import SessionConfigDialog from "./SessionConfigDialog";
import SettingsView from "./SettingsView";
import AgentView from "./AgentView";
import ConfigJsonDrawer from "./ConfigJsonDrawer";
import type { StudioProfile } from "../../lib/studio-profile";

type ConfigMode = "agent" | "settings";

/** A one-shot request to open the dialog at a specific mode + Settings group. */
export interface SessionConfigFocus {
  mode: ConfigMode;
  /** Settings group id to reveal (e.g. "appearance"). */
  group?: string;
  /** Bumped per request so a repeat deep-link re-applies even if unchanged. */
  nonce: number;
}

interface LiveDataManagerProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  dateKey: string;
  /** Public demo mode keeps this surface local-only: no provider, DB or OBS writes. */
  demoMode?: boolean;
  persistence: SessionPersistence;
  /** Real OBS / live-state push status for the source-of-truth bar. */
  obsSync?: ObsSyncState;
  onReload: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
  /** Safe reset (reused by the inline Studio Appearance controls). */
  onReset: () => void;
  /** The explicit next-stream verb: keep brand + presentation, clear content. */
  onPrepareNextSession?: () => void;
  /** Close the Session Config Center dialog (returns to the previous tab). */
  onClose?: () => void;
  /** A one-shot deep-link request (gear / ⌘, → Studio Appearance). */
  focus?: SessionConfigFocus | null;
  /** Clear the focus request once applied so a later plain open is honored. */
  onFocusConsumed?: () => void;
  studioProfile?: StudioProfile | null;
  onSaveStudioProfile?: (profile: StudioProfile) => void;
  onClearStudioProfile?: () => void;
}

/**
 * Session Config Center — a centered modal dialog over the dimmed workbench, in
 * the spirit of a desktop settings window. It opens Agent-first: the dialog
 * header carries the top mental model (Agent vs Settings) + a top-right Open
 * JSON + close. The body is the active mode:
 *   - Agent: a chat window (transcript + composer) with real-AI / local handoff
 *     and slash commands; it links to Settings but never edits settings itself.
 *   - Settings: a left menu (Session / Content / Broadcast Display / Studio
 *     Appearance / AI Provider / Data & Sync) + the selected panel. The
 *     source-of-truth bar + lifecycle live in Data & Sync, not a persistent strip.
 * JSON stays a global power-tool drawer (header Open JSON, Data & Sync, Agent
 * Review in JSON) — drift-safe, never a second apply path. It renders as a
 * sibling above the dialog and takes over Esc / focus while open.
 */
export default function LiveDataManager({
  state,
  onChange,
  dateKey,
  demoMode = false,
  persistence,
  obsSync = IDLE_OBS_SYNC,
  onReload,
  onStartSession,
  onEndSession,
  onReset,
  onPrepareNextSession,
  onClose,
  focus,
  onFocusConsumed,
  studioProfile = null,
  onSaveStudioProfile,
  onClearStudioProfile,
}: LiveDataManagerProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<ConfigMode>("agent");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonKey, setJsonKey] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState<string | null>(null);
  // A local nav request (e.g. the Agent's "Set up AI Provider") to reveal a
  // Settings group, separate from the app-level deep-link focus.
  const [localFocus, setLocalFocus] = useState<{ group?: string; nonce: number } | null>(null);

  const openSettings = (group?: string) => {
    setMode("settings");
    setLocalFocus(group ? { group, nonce: Date.now() } : null);
  };

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

  // A deep-link (gear / ⌘, / command palette) requests a mode + Manual group.
  // Apply the mode, forward the group to SettingsView, and consume the
  // one-shot so a later plain open lands on its own default.
  useEffect(() => {
    if (!focus) return;
    setMode(focus.mode);
    setLocalFocus(null); // an app deep-link supersedes a local nav request
    onFocusConsumed?.();
  }, [focus, onFocusConsumed]);

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
            <div style={{ width: 220, maxWidth: "100%" }}>
              <LineSegmented
                testId="config-mode-switch"
                active={mode}
                onSelect={(value) => setMode(value as ConfigMode)}
                options={[
                  { value: "agent", label: t("configMode.agent"), testId: "config-mode-agent" },
                  { value: "settings", label: t("configMode.settings"), testId: "config-mode-settings" },
                ]}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button
              data-testid="open-json-top"
              onClick={() => openJson()}
              style={{
                appearance: "none",
                cursor: "pointer",
                border: `1px solid ${UI_COLORS.controlBorder}`,
                borderRadius: 0,
                background: "transparent",
                color: UI_COLORS.accentText,
                fontFamily: "var(--app-font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "4px 10px",
              }}
            >
              {t("drawer.openJson")} ↗
            </button>
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
          </div>
        </header>

        {/* Body — the active mode. Both stay mounted (visibility toggled) so the
            JSON drift stays synced and the IA is statically inspectable. The
            source-of-truth + lifecycle live inside Settings → Data & Sync so the
            calm Agent-first entry isn't crowded by status the moment it opens. */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
          <div
            data-testid="config-view-agent"
            hidden={mode !== "agent"}
            style={{ display: mode === "agent" ? "flex" : "none", flex: 1, minWidth: 0, minHeight: 0 }}
          >
            <AgentView
              state={state}
              dateKey={dateKey}
              demoMode={demoMode}
              onOpenJson={() => openJson()}
              onReviewJson={openJsonForReview}
              onOpenSettings={openSettings}
            />
          </div>
          <div
            data-testid="config-view-settings"
            hidden={mode !== "settings"}
            style={{ display: mode === "settings" ? "flex" : "none", flex: 1, minWidth: 0, minHeight: 0 }}
          >
            <SettingsView
              state={state}
              onChange={onChange}
              onReset={onReset}
              demoMode={demoMode}
              onOpenJson={openJson}
              focus={localFocus ?? focus}
              dateKey={dateKey}
              persistence={persistence}
              obsSync={obsSync}
              onReload={onReload}
              onStartSession={onStartSession}
              onEndSession={onEndSession}
              studioProfile={studioProfile}
              onSaveStudioProfile={onSaveStudioProfile}
              onClearStudioProfile={onClearStudioProfile}
              onPrepareNextSession={onPrepareNextSession}
            />
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
