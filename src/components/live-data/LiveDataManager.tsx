import { useEffect, useState, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import SourceOfTruthBar, { type SessionPersistence } from "./SourceOfTruthBar";
import SessionConfigOutline, { type ConfigView } from "./SessionConfigOutline";
import SettingsView from "./SettingsView";
import AgentPrepareView from "./AgentPrepareView";
import ConfigJsonDrawer from "./ConfigJsonDrawer";

interface LiveDataManagerProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  dateKey: string;
  persistence: SessionPersistence;
  onReload: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
  /** Opens the existing studio SettingsDrawer (theme / colors / reset). */
  onOpenSettings: () => void;
}

/**
 * Session Config Center shell.
 *
 * Top: the source-of-truth bar (DB / local / OBS truth + session lifecycle).
 * Left: two primary modes —
 *   - AI Prepare : compose an agent handoff prompt → import the result.
 *   - Settings   : the manual config workbench, grouped core vs runtime.
 * The live-session.config.json source document is a global JSON drawer (not a
 * third nav page), reachable from the source bar, the outline, and both views.
 */
export default function LiveDataManager({
  state,
  onChange,
  dateKey,
  persistence,
  onReload,
  onStartSession,
  onEndSession,
  onOpenSettings,
}: LiveDataManagerProps) {
  const [view, setView] = useState<ConfigView>("settings");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null);

  // Outline Settings items jump to a group: switch to Settings, then scroll.
  useEffect(() => {
    if (view === "settings" && pendingAnchor) {
      document
        .getElementById(pendingAnchor)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
      setPendingAnchor(null);
    }
  }, [view, pendingAnchor]);

  const selectSettingsAnchor = (anchorId: string) => {
    setView("settings");
    setPendingAnchor(anchorId);
  };
  const openJson = () => setJsonOpen(true);

  return (
    <div
      data-testid="live-data-manager"
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <SourceOfTruthBar
        dateKey={dateKey}
        persistence={persistence}
        onReload={onReload}
        onStartSession={onStartSession}
        onEndSession={onEndSession}
        onOpenJson={openJson}
      />

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <SessionConfigOutline
          view={view}
          onSelectView={setView}
          onSelectSettingsAnchor={selectSettingsAnchor}
          onOpenJson={openJson}
        />

        <div
          data-testid="config-workspace"
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            padding: "22px 28px 56px",
            boxSizing: "border-box",
          }}
        >
          <ViewPane testId="config-view-prepare" active={view === "prepare"}>
            <AgentPrepareView state={state} onOpenJson={openJson} />
          </ViewPane>
          <ViewPane testId="config-view-settings" active={view === "settings"}>
            <SettingsView
              state={state}
              onChange={onChange}
              persistence={persistence}
              onOpenJson={openJson}
              onOpenStudioSettings={onOpenSettings}
            />
          </ViewPane>
        </div>
      </div>

      <ConfigJsonDrawer
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        state={state}
        onChange={onChange}
      />
    </div>
  );
}

function ViewPane({
  testId,
  active,
  children,
}: {
  testId: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div data-testid={testId} hidden={!active} style={{ display: active ? "block" : "none" }}>
      {children}
    </div>
  );
}
