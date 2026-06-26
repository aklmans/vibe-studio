import { useState } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { LineSegmented } from "../inspector/EditorRow";
import SourceOfTruthBar, { type SessionPersistence } from "./SourceOfTruthBar";
import { IDLE_OBS_SYNC, type ObsSyncState } from "./obs-sync";
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
}

/**
 * Session Config Center shell. A tab inside the app shell — same warm editorial
 * rhythm as the other editor tabs, not a full-screen settings product.
 *
 * Top: source-of-truth bar (status + lifecycle + Open JSON).
 * Mode switch (segmented): Manual Settings / Agent.
 *   - Manual Settings: category tree + settings rows + search (settings-page IA).
 *   - Agent: a prepare panel that composes a handoff for an external AI tool.
 * JSON lives in a global drawer (not a nav page), reachable from the bar, Manual
 * (rows / Advanced) and Agent — with focus management.
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
}: LiveDataManagerProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<ConfigMode>("manual");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonKey, setJsonKey] = useState<string | null>(null);

  const openJson = (key?: string) => {
    setJsonKey(key ?? null);
    setJsonOpen(true);
  };

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
        obsSync={obsSync}
        onReload={onReload}
        onStartSession={onStartSession}
        onEndSession={onEndSession}
        onOpenJson={() => openJson()}
      />

      {/* Mode switch — Manual Settings / Agent (segmented, not left nav). */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 16px",
          borderBottom: `1px solid ${UI_COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 280, maxWidth: "100%" }}>
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

      {/* Both modes stay mounted (visibility toggled) so the JSON drift stays
          synced and the IA is statically inspectable. */}
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
          style={{
            display: mode === "agent" ? "block" : "none",
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            padding: "22px 28px 56px",
          }}
        >
          <AgentView state={state} onOpenJson={() => openJson()} />
        </div>
      </div>

      <ConfigJsonDrawer
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        state={state}
        onChange={onChange}
        focusKey={jsonKey}
      />
    </div>
  );
}
