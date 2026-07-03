import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const APP_SRC = readFileSync(resolve("src/components/OverlayBuilderApp.tsx"), "utf8");
const MANAGER_SRC = readFileSync(resolve("src/components/live-data/LiveDataManager.tsx"), "utf8");
const AGENT_SRC = readFileSync(resolve("src/components/live-data/AgentView.tsx"), "utf8");

test("demo mode disables production side effects while keeping the builder usable", () => {
  assert.match(APP_SRC, /interface OverlayBuilderAppProps/);
  assert.match(APP_SRC, /demoMode\?: boolean/);
  assert.match(APP_SRC, /export default function App\(\{ demoMode = false \}: OverlayBuilderAppProps\)/);
  assert.match(APP_SRC, /if \(demoMode\) \{\s*setLiveDataPersistence/);
  assert.match(APP_SRC, /if \(demoMode\) \{\s*setObsSync\(IDLE_OBS_SYNC\)/);
  assert.match(APP_SRC, /if \(demoMode \|\| !liveDataPersistence\.databaseConfigured/);
  assert.match(APP_SRC, /if \(demoMode\) return/);
  assert.match(APP_SRC, /<LiveDataManager[\s\S]*demoMode=\{demoMode\}/);
});

test("demo hides the OBS composition controls; the studio inspector wires them in", () => {
  const INSPECTOR_SRC = readFileSync(
    resolve("src/components/inspector/Inspector.tsx"),
    "utf8",
  );
  const OVERLAY_INSPECTOR_SRC = readFileSync(
    resolve("src/components/inspector/groups/OverlayInspector.tsx"),
    "utf8",
  );
  // demoMode threads App → Inspector → OverlayInspector, and the composition
  // group only renders outside demo — a public demo must never control OBS.
  assert.match(APP_SRC, /<Inspector [^>]*demoMode=\{demoMode\}/);
  assert.match(INSPECTOR_SRC, /demoMode\?: boolean/);
  assert.match(INSPECTOR_SRC, /<OverlayInspector [^>]*demoMode=\{demoMode\}/);
  assert.match(
    OVERLAY_INSPECTOR_SRC,
    /\{!demoMode && \(\s*<InspectorGroup[\s\S]{0,120}group\.composition/,
  );

  // The Session Config Broadcast group hosts the same control and gates it too.
  const SETTINGS_SRC = readFileSync(
    resolve("src/components/live-data/SettingsView.tsx"),
    "utf8",
  );
  assert.match(MANAGER_SRC, /<SettingsView[\s\S]*?demoMode=\{demoMode\}/);
  assert.match(SETTINGS_SRC, /demoMode\?: boolean/);
  assert.match(SETTINGS_SRC, /\{!demoMode && \(\s*<AssetRow[\s\S]{0,120}group\.composition/);
});

test("demo reflects real provider status and can run the agent, but never writes to the database", () => {
  assert.match(MANAGER_SRC, /demoMode\?: boolean/);
  assert.match(MANAGER_SRC, /<AgentView[\s\S]*demoMode=\{demoMode\}/);
  assert.match(AGENT_SRC, /demoMode\?: boolean/);
  // DB-backed conversation history and turn persistence stay off in demo.
  assert.match(AGENT_SRC, /if \(demoMode\) \{\s*setConversationAvailable\(false\)/);
  assert.match(AGENT_SRC, /if \(demoMode\) return;\s*if \(!conversationId\) return/);
  // Demo no longer forces "not configured" status nor the local handoff — it
  // experiences the real, rate-limited provider when the deploy configured one.
  assert.doesNotMatch(AGENT_SRC, /if \(demoMode\) \{\s*setStatus\(\{ configured: false/);
  assert.doesNotMatch(AGENT_SRC, /if \(demoMode\) \{\s*recordLocalTurn\(false\)/);
});
