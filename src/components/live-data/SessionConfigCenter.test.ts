import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "../../hooks/useLocale";
import { DEFAULT_STATE } from "../../types";
import { buildAgentPrompt } from "../../lib/agent-prompt";
import { focusTargetTestId, needsFocusRetry } from "./drawer-focus";
import { resolveCopyResult, shortConfigHash, turnMessageKey } from "./agent-copy";
import { obsSyncDetail, IDLE_OBS_SYNC, type ObsSyncState } from "./obs-sync";
import { publishLiveState } from "../../lib/live-state-client";
import SourceOfTruthBar from "./SourceOfTruthBar";
import AgentView from "./AgentView";
import LiveDataManager from "./LiveDataManager";

type Persistence = Parameters<typeof LiveDataManager>[0]["persistence"];

const BASE_PERSISTENCE: Persistence = {
  databaseConfigured: false,
  loading: false,
  saving: false,
  error: null,
  savedAt: null,
  session: null,
};

function renderCenter(persistence: Partial<Persistence> = {}) {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(LiveDataManager, {
        state: DEFAULT_STATE,
        onChange: () => {},
        dateKey: "2026-06-25",
        persistence: { ...BASE_PERSISTENCE, ...persistence },
        onReload: () => {},
        onStartSession: () => {},
        onEndSession: () => {},
        onReset: () => {},
      }),
    }),
  );
}

const SETTINGS_SRC = readFileSync(
  resolve("src/components/live-data/SettingsView.tsx"),
  "utf8",
);
const AGENT_SRC = readFileSync(
  resolve("src/components/live-data/AgentView.tsx"),
  "utf8",
);
const DRAWER_SRC = readFileSync(
  resolve("src/components/live-data/ConfigJsonDrawer.tsx"),
  "utf8",
);
const APP_SRC = readFileSync(resolve("src/components/OverlayBuilderApp.tsx"), "utf8");

test("mode is a segmented switch (Agent / Settings), not a left-nav of pages", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="config-mode-switch"/);
  assert.match(html, /data-testid="config-mode-agent"/);
  assert.match(html, /data-testid="config-mode-settings"/);
  // The old AI-Prepare/Settings/JSON left-nav pages are gone.
  assert.doesNotMatch(html, /data-testid="config-nav-prepare"/);
  assert.doesNotMatch(html, /data-testid="config-nav-settings"/);
  assert.doesNotMatch(html, /data-testid="config-nav-json"/);
  assert.doesNotMatch(html, /data-testid="config-view-json"/);
});

test("Session Config renders as a centered modal dialog, not a full-bleed page", () => {
  const html = renderCenter();
  // A dialog over a dimmed/blurred scrim, with a working close affordance.
  assert.match(html, /data-testid="session-config-dialog-root"/);
  assert.match(html, /data-testid="session-config-dialog-scrim"/);
  assert.match(html, /data-testid="session-config-dialog"[^>]*role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-labelledby="session-config-title"/);
  assert.match(html, /id="session-config-title"/);
  assert.match(html, /data-testid="session-config-close"/);
  // The shell owns the a11y contract: Esc close, focus trap, focus restore.
  const dialogSrc = readFileSync(resolve("src/components/live-data/SessionConfigDialog.tsx"), "utf8");
  assert.match(dialogSrc, /role="dialog"/);
  assert.match(dialogSrc, /aria-modal=\{modalActive \? "true" : undefined\}/);
  assert.match(dialogSrc, /event\.key === "Escape"/);
  assert.match(dialogSrc, /restoreRef\.current\?\.focus/); // focus restored to trigger
  assert.match(dialogSrc, /event\.key !== "Tab"/); // focus trap
});

test("the JSON drawer layers above the dialog and yields its Esc / focus while open", () => {
  // The drawer (z 61) sits above the dialog (z 41); the dialog disables Esc /
  // focus-trap while the drawer owns the interaction — one modal at a time.
  const managerSrc = readFileSync(resolve("src/components/live-data/LiveDataManager.tsx"), "utf8");
  assert.match(managerSrc, /closeOnEsc=\{!jsonOpen\}/);
  assert.match(managerSrc, /trapFocus=\{!jsonOpen\}/);
  assert.match(managerSrc, /modalActive=\{!jsonOpen\}/);
  const dialogSrc = readFileSync(resolve("src/components/live-data/SessionConfigDialog.tsx"), "utf8");
  assert.match(dialogSrc, /aria-modal=\{modalActive \? "true" : undefined\}/);
  assert.match(dialogSrc, /aria-hidden=\{!modalActive \? "true" : undefined\}/);
  assert.match(dialogSrc, /inert=\{!modalActive \? true : undefined\}/);
  assert.match(dialogSrc, /zIndex: 40/); // scrim below the drawer's 60
  assert.match(dialogSrc, /zIndex: 41/); // panel below the drawer's 61
});

test("Session Config opens over the previous workbench tab instead of replacing the preview", () => {
  assert.match(APP_SRC, /type WorkbenchTab = Exclude<OverlayState\["activeTab"\], "live">/);
  assert.match(APP_SRC, /const previewTab: WorkbenchTab =\s*state\.activeTab === "live" \? lastNonLiveTabRef\.current : state\.activeTab/);
  assert.match(APP_SRC, /const previewState = isLiveDataTab \? \{ \.\.\.state, activeTab: previewTab \} : state/);
  assert.match(APP_SRC, /\{isLiveDataTab && \(\s*<LiveDataManager/);
  assert.doesNotMatch(APP_SRC, /\{isLiveDataTab \? \(\s*<LiveDataManager/);
  assert.match(APP_SRC, /<Inspector state=\{previewState\} onChange=\{setState\} demoMode=\{demoMode\} \/>/);
});

test("Settings is a tabbed panel — left vertical menu + panels + field search", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="settings-view"/);
  assert.match(html, /data-testid="settings-tab-bar"[^>]*role="tablist"/);
  assert.match(html, /aria-orientation="vertical"/); // a left rail, not wide top tabs
  for (const id of ["session", "broadcast", "appearance", "provider", "data"]) {
    assert.match(html, new RegExp(`data-testid="settings-tab-${id}"`));
    assert.match(html, new RegExp(`data-testid="settings-panel-${id}"`));
    assert.match(html, new RegExp(`id="settings-tab-${id}"[^>]*aria-controls="settings-panel-${id}"`));
    assert.match(html, new RegExp(`id="settings-panel-${id}"[^>]*aria-labelledby="settings-tab-${id}"`));
  }
  // The old category tree + scroll-spy are retired; a field search is present.
  assert.doesNotMatch(html, /data-testid="settings-category-tree"/);
  assert.match(html, /data-testid="settings-search"/);
  assert.doesNotMatch(SETTINGS_SRC, /suppressSpyUntil|matchedFields|fieldHits/);
  assert.match(html, /data-testid="studio-profile-save"/);
  assert.match(html, /data-testid="studio-profile-clear"/);
  // Existing editors are reused inside the panels (all mounted, visibility toggled).
  assert.match(html, /data-testid="live-data-sections"/);
  assert.match(html, /data-testid="live-data-stack"/);
  assert.match(html, /data-testid="live-data-bottom-bar"/);
  assert.match(html, /data-testid="live-data-live-session"/);
});

test("Settings tabs expose the full keyboard and ARIA tab contract", () => {
  assert.match(SETTINGS_SRC, /tabIndex=\{active \? 0 : -1\}/);
  assert.match(SETTINGS_SRC, /handleTabKeyDown/);
  for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]) {
    assert.match(SETTINGS_SRC, new RegExp(`event\\.key === "${key}"`));
  }
  assert.match(SETTINGS_SRC, /aria-controls=\{`settings-panel-\$\{tab\.id\}`\}/);
  assert.match(SETTINGS_SRC, /aria-labelledby=\{`settings-tab-\$\{tab\.id\}`\}/);
});

test("Settings uses a wide workbench content column", () => {
  assert.match(SETTINGS_SRC, /SETTINGS_CONTENT_MAX_WIDTH\s*=\s*920/);
  assert.doesNotMatch(SETTINGS_SRC, /maxWidth:\s*720/);
});

test("Settings edits the v1 portable-core fields directly", () => {
  const html = renderCenter();
  // Identity copy fields are real inputs, not read-only summaries.
  assert.match(html, /data-testid="field-title"/);
  assert.match(html, /data-testid="field-subtitle"/);
  assert.match(html, /data-testid="field-author"/);
  // Profile / cover / badges / socials reuse the shared editors inline.
  assert.match(html, /data-testid="field-profile-avatar-visible"/);
  assert.match(html, /data-testid="cover-visual"/);
  assert.match(html, /data-testid="field-badge-0-label"/);
  assert.match(html, /data-testid="field-social-0-label"/);
  // JSON is demoted to an advanced tool — basic fields no longer carry a per-field
  // "Edit in JSON" link; the entry points are the header + Data & Sync + Agent.
  assert.doesNotMatch(html, /data-testid="settings-openjson-/);
});

test("Studio Profile persists reusable identity separately from stream config", () => {
  const html = renderCenter();
  // Studio Profile is a save/load action inside the unified Session group now,
  // not a separate tab — it snapshots the same identity fields (no duplicates).
  assert.doesNotMatch(html, /data-testid="settings-tab-profile"/);
  assert.match(html, /data-testid="settings-tab-session"/);
  assert.match(html, /data-testid="field-author"/);
  assert.match(html, /data-testid="field-profile-avatar-visible"/);
  assert.match(html, /data-testid="studio-profile-save"/);
  assert.match(html, /data-testid="studio-profile-clear"/);
  assert.doesNotMatch(html, /data-testid="field-studio-profile-author"/);

  assert.match(APP_SRC, /loadStudioProfile/);
  assert.match(APP_SRC, /applyStudioProfileToState\(DEFAULT_STATE_BY_LOCALE\[loadLocale\(\)\]/);
  assert.match(APP_SRC, /saveStudioProfile/);
  assert.match(APP_SRC, /clearStudioProfile/);
  assert.match(APP_SRC, /onSaveStudioProfile=\{handleSaveStudioProfile\}/);
  assert.match(APP_SRC, /onClearStudioProfile=\{handleClearStudioProfile\}/);
  assert.match(APP_SRC, /handleReset[\s\S]*applyStudioProfileToState\(DEFAULT_STATE_BY_LOCALE\[locale\], studioProfile\)/);
});

test("Agent shows a split proposal review rail once the AI returns a config", () => {
  // The right rail appears only when there's a proposal (success + config), so the
  // Agent stays centered until then, then enters a split review.
  assert.match(AGENT_SRC, /data-testid="agent-proposal-rail"/);
  assert.match(AGENT_SRC, /\{proposal && \(/);
  assert.match(AGENT_SRC, /turn\.kind === "ai" && turn\.status === "success" && turn\.configText/);
  // Every AI config turn stays compact in the transcript; the full JSON is never
  // dumped in chat — it belongs in the rail + drift-safe drawer.
  assert.match(AGENT_SRC, /data-testid=\{`agent-turn-proposal-ready-\$\{turn\.id\}`\}/);
  assert.match(AGENT_SRC, /agent\.proposalReady/);
  assert.doesNotMatch(AGENT_SRC, /compactConfig/); // always compact — no per-turn toggle
  assert.doesNotMatch(AGENT_SRC, /\{turn\.configText\}\s*<\/pre>/); // full config JSON not dumped in chat
  // Grouped field-level review: before/after diff groups + an explicit runtime /
  // OBS / storage-untouched note.
  assert.match(AGENT_SRC, /diffConfigProposal/);
  assert.match(AGENT_SRC, /DIFF_GROUPS/);
  assert.match(AGENT_SRC, /agent\.reviewChanges/);
  assert.match(AGENT_SRC, /data-testid=\{`agent-proposal-group-\$\{group\.id\}`\}/);
  assert.match(AGENT_SRC, /data-testid="agent-proposal-runtime-safe"/);
  assert.match(AGENT_SRC, /field\.optionalEmpty/);
  assert.match(AGENT_SRC, /agent\.badgesOptionalEmpty/);
  // Proposal preview is derived only; Review in JSON remains the only apply path.
  assert.match(AGENT_SRC, /configToOverlayState\(state, parsed\.config\)/);
  assert.match(AGENT_SRC, /previewing && parsed\.ok/);
  assert.match(AGENT_SRC, /data-testid=\{previewing \? "agent-proposal-stop-preview" : "agent-proposal-preview"\}/);
  assert.match(AGENT_SRC, /data-testid="agent-proposal-preview-disabled"/);
  assert.match(AGENT_SRC, /agent\.previewNote/);
  assert.match(AGENT_SRC, /data-testid="agent-proposal-review"/);
  assert.match(AGENT_SRC, /onClick=\{\(\) => onReviewProposal\(proposal\)\}/);
  assert.doesNotMatch(AGENT_SRC, /applyConfigText|onChange\(/); // no auto-apply / no state write
});

test("Agent conversations are persisted opportunistically with history and local fallback", () => {
  const managerSrc = readFileSync(resolve("src/components/live-data/LiveDataManager.tsx"), "utf8");

  assert.match(managerSrc, /<AgentView[\s\S]*dateKey=\{dateKey\}/);
  assert.match(AGENT_SRC, /fetchAgentConversations/);
  assert.match(AGENT_SRC, /createAgentConversationClient/);
  assert.match(AGENT_SRC, /fetchAgentConversation/);
  assert.match(AGENT_SRC, /appendAgentConversationMessage/);
  assert.match(AGENT_SRC, /archiveAgentConversationClient/);
  assert.match(AGENT_SRC, /markAgentProposalReviewedClient/);
  assert.match(AGENT_SRC, /messagesToTurns/);
  assert.match(AGENT_SRC, /persistTurnPair/);
  assert.match(AGENT_SRC, /proposalId\?: string/);
  assert.match(AGENT_SRC, /proposalId: message\.proposal\?\.id/);
  assert.match(AGENT_SRC, /reviewProposal/);
  assert.match(AGENT_SRC, /testId="agent-history-toggle"/);
  assert.match(AGENT_SRC, /data-testid="agent-history-list"/);
  assert.match(AGENT_SRC, /data-testid=\{`agent-history-item-\$\{conversation\.id\}`\}/);
  assert.match(AGENT_SRC, /data-testid=\{`agent-history-archive-\$\{conversation\.id\}`\}/);
  assert.match(AGENT_SRC, /data-testid="agent-conversation-status"/);
  // Persistence is opportunistic; the Agent remains usable when the DB route
  // reports databaseConfigured:false or a request fails.
  assert.match(AGENT_SRC, /setConversationAvailable\(result\.databaseConfigured === true\)/);
  assert.match(AGENT_SRC, /if \(!conversationId\) return/);
  assert.match(AGENT_SRC, /setConversations\(\(prev\) => prev\.filter/);
  assert.doesNotMatch(AGENT_SRC, /apiKey|Authorization|baseUrl/i);
});

test("Settings field search has a full keyboard contract + combobox semantics", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="settings-search"[^>]*role="combobox"/);
  assert.match(html, /data-testid="settings-search"[^>]*aria-controls="settings-search-results"/);
  // ↑/↓ move, Enter jumps, Esc clears — via a capture listener so Esc doesn't
  // close the dialog. Active-descendant + option roles complete the semantics.
  for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape"]) {
    assert.match(SETTINGS_SRC, new RegExp(`event\\.key === "${key}"`));
  }
  assert.match(SETTINGS_SRC, /addEventListener\("keydown", onKey, true\)/);
  assert.match(SETTINGS_SRC, /stopImmediatePropagation/);
  assert.match(SETTINGS_SRC, /searchRef\.current = \{ query, open: searchOpen/);
  assert.match(SETTINGS_SRC, /if \(!st\.query \|\| document\.activeElement !== searchInputRef\.current\) return/);
  assert.match(SETTINGS_SRC, /aria-activedescendant=/);
  assert.match(SETTINGS_SRC, /role="option"/);
  assert.match(SETTINGS_SRC, /aria-selected=\{active\}/);
  // Hits carry a field name + a short description + the group.
  assert.match(SETTINGS_SRC, /f\.descKey &&/);
  // Hits visibly mark the query, and the target row flashes after jump.
  assert.match(SETTINGS_SRC, /function highlightMatch/);
  assert.match(SETTINGS_SRC, /<mark/);
  assert.match(SETTINGS_SRC, /target\.style\.outline/);
  assert.match(SETTINGS_SRC, /window\.setTimeout/);
  assert.match(SETTINGS_SRC, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(SETTINGS_SRC, /previousTabIndex/);
});

test("Settings shows scannable summaries before the big editors", () => {
  const html = renderCenter();
  for (const id of ["sections", "stack", "badges", "socials", "bottomBar"]) {
    assert.match(html, new RegExp(`data-testid="settings-summary-${id}"`));
  }
  // Summaries are derived from state (counts + visible state), not hard-coded.
  assert.match(SETTINGS_SRC, /settingsSummary\.sectionsUnit/);
  assert.match(SETTINGS_SRC, /state\.cover\.badges\.filter\(\(b\) => b\.visible\)/);
  assert.match(SETTINGS_SRC, /state\.bottomBar\.segments\.map\(\(s\) => s\.kind\)/);
});

test("docs describe the real agent boundary (provider callable in local/private Studio; key not in client)", () => {
  const readme = readFileSync(resolve("README.md"), "utf8");
  const agents = readFileSync(resolve("AGENTS.md"), "utf8");
  for (const doc of [readme, agents]) {
    assert.doesNotMatch(doc, /does not call a model|never call a model|local handoff prep/i);
    assert.doesNotMatch(doc, /Manual Settings/);
  }
  assert.match(readme, /can call a real model/i);
  assert.match(readme, /key stays in your local\/private Studio server env/i);
  assert.match(readme, /public\/demo deployments do not collect API keys/i);
  assert.match(readme, /cannot push into (your )?local OBS/i);
  assert.match(agents, /calls a configured provider/i);
});

test("Settings has a field-level search that jumps to a field's group + row", () => {
  const html = renderCenter();
  // A search box, honest about scope (fields, not a JSON full-text search).
  assert.match(html, /data-testid="settings-search"/);
  assert.match(SETTINGS_SRC, /settingsView\.searchHint/);
  // Fields are indexed with anchored row ids; a hit switches group + scrolls to it.
  assert.match(SETTINGS_SRC, /FIELD_INDEX/);
  assert.match(SETTINGS_SRC, /data-testid=\{`settings-search-hit-\$\{f\.id\}`\}/);
  assert.match(SETTINGS_SRC, /settings-row-\$\{entry\.id\}/);
  assert.match(SETTINGS_SRC, /scrollIntoView/);
  for (const id of ["title", "stack", "sections", "bottomBar", "liveTimer", "baseUrl", "model", "userAgent", "apiKey", "test"]) {
    assert.match(html, new RegExp(`id="settings-row-${id}"`));
  }
});

test("ManualSettings is renamed to SettingsView (no Manual naming leaks)", () => {
  assert.equal(existsSync(resolve("src/components/live-data/ManualSettings.tsx")), false);
  assert.ok(existsSync(resolve("src/components/live-data/SettingsView.tsx")));
  const html = renderCenter();
  assert.match(html, /data-testid="settings-view"/);
  assert.doesNotMatch(html, /data-testid="manual-settings"/);
  assert.match(SETTINGS_SRC, /export default function SettingsView/);
  const i18nSrc = readFileSync(resolve("src/lib/i18n.ts"), "utf8");
  assert.doesNotMatch(i18nSrc, /"manualSettings\./);
  assert.match(i18nSrc, /"settingsView\.menuLabel"/);
});

test("Session Config opens Agent-first — Agent is the default visible mode", () => {
  const html = renderCenter();
  // Agent is shown; Settings is mounted but hidden until selected.
  assert.match(html, /data-testid="config-view-agent"[^>]*display:flex/);
  assert.match(html, /data-testid="config-view-settings"[^>]*display:none/);
  assert.match(html, /data-testid="agent-view"/);
  // The mode segmented leads with Agent, then Settings — no "Manual" copy.
  const agentIdx = html.indexOf('data-testid="config-mode-agent"');
  const settingsIdx = html.indexOf('data-testid="config-mode-settings"');
  assert.ok(agentIdx > 0 && settingsIdx > agentIdx, "Agent precedes Settings");
  assert.doesNotMatch(html, /data-testid="config-mode-manual"/);
  assert.doesNotMatch(html, /Manual Settings/);
});

test("Agent offers slash commands and guides to Settings, never editing settings via chat", () => {
  // The slash menu appears once a "/" is typed (assert the wiring at the source).
  assert.match(AGENT_SRC, /SLASH_COMMANDS/);
  assert.match(AGENT_SRC, /data-testid=\{`agent-slash-\$\{s\.cmd\}`\}/);
  assert.match(AGENT_SRC, /slashMatches/);
  assert.match(AGENT_SRC, /onOpenSettings\?\.\(s\.group\)/);
  // Not-connected default surfaces a "set up provider" guide to Settings.
  const html = renderCenter();
  assert.match(html, /data-testid="agent-setup-provider"/);
  assert.match(html, /data-testid="agent-provider-guide"/);
});

test("Agent slash menu has a full keyboard contract + distinct /provider and /settings", () => {
  // Listbox / option semantics with an active-descendant highlight.
  assert.match(AGENT_SRC, /role="listbox"/);
  assert.match(AGENT_SRC, /role="option"/);
  assert.match(AGENT_SRC, /aria-selected=\{active\}/);
  assert.match(AGENT_SRC, /aria-activedescendant=/);
  // Keyboard contract: ↑/↓ move, Enter runs, Esc dismisses (without clearing).
  for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape"]) {
    assert.match(AGENT_SRC, new RegExp(`event\\.key === "${key}"`));
  }
  // Esc / Enter use a capture listener + stopImmediatePropagation so Esc
  // dismisses the menu without also closing the dialog, and keeps the input.
  assert.match(AGENT_SRC, /addEventListener\("keydown", onKey, true\)/);
  assert.match(AGENT_SRC, /stopImmediatePropagation/);
  assert.match(AGENT_SRC, /setSlashDismissed\(true\)/);
  // /provider → AI Provider group; /settings → Settings default (Session).
  assert.match(AGENT_SRC, /\{ cmd: "provider", group: "provider" \}/);
  assert.match(AGENT_SRC, /\{ cmd: "settings", group: "session" \}/);
});

test("AI Provider is a Settings group — status + test, the key never enters the client", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="settings-tab-provider"/);
  assert.match(html, /data-testid="settings-panel-provider"/);
  assert.match(html, /data-testid="ai-provider-settings"/);
  assert.match(html, /data-testid="ai-provider-test"/);
  assert.match(html, /data-testid="ai-provider-api-key"/);
  assert.match(html, /data-testid="ai-provider-env-edit-note"/);
  assert.match(html, /data-testid="ai-provider-copy-env-template"/);
  // The provider panel never holds a key or hits a provider directly.
  const providerSrc = readFileSync(resolve("src/components/live-data/AIProviderSettings.tsx"), "utf8");
  assert.doesNotMatch(providerSrc, /Authorization|Bearer |process\.env|api\.deepseek\.com|api\.openai\.com/i);
  assert.match(providerSrc, /SESSION_AGENT_API_KEY=\.\.\./);
  assert.doesNotMatch(providerSrc, /SESSION_AGENT_API_KEY=\$\{|SESSION_AGENT_API_KEY=.*sk-/);
  assert.match(providerSrc, /navigator\.clipboard\.writeText\(ENV_TEMPLATE\)/);
  // The key-free status carries the non-secret base URL; a server test path exists.
  const agentLibSrc = readFileSync(resolve("src/lib/session-agent.ts"), "utf8");
  assert.match(agentLibSrc, /baseUrl: config\.baseUrl/);
  assert.match(agentLibSrc, /export async function testAgentConnection/);
});

test("Agent mode is a local chat-style prep with a transcript and honest framing", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="agent-transcript"/);
  assert.match(html, /data-testid="agent-msg-seed"/);
  // Honest: a local, no-model badge — never claims a connected assistant.
  assert.match(html, /data-testid="agent-local-badge"/);
  assert.match(html, /no model connected/i);
  // Copy handoff is still the single primary path into the drift-safe drawer.
  assert.match(html, /data-testid="agent-copy-handoff"/);
  assert.match(html, /data-testid="open-json-agent"/);
});

test("Agent copy is honest: a failed clipboard never renders a 'copied' turn", () => {
  // Pure outcome mapping — a failed copy is the manual path, never "copied".
  assert.deepEqual(resolveCopyResult(true), { messageKey: "agent.copied", turnStatus: "copied" });
  assert.deepEqual(resolveCopyResult(false), { messageKey: "agent.copyFailed", turnStatus: "manual" });
  assert.equal(turnMessageKey("copied"), "agent.turnReady");
  assert.equal(turnMessageKey("manual"), "agent.turnManual");

  // Snapshot hash for turn metadata is stable + 8-hex (client-side helper).
  const h = shortConfigHash('{"version":1}');
  assert.equal(h, shortConfigHash('{"version":1}'));
  assert.match(h, /^[0-9a-f]{8}$/);
  assert.notEqual(h, shortConfigHash('{"version":1,"title":"x"}'));

  // The assistant bubble keys off the recorded turn status and routes copy
  // through the resolver — it does not hard-code the "copied" wording.
  assert.match(AGENT_SRC, /turnMessageKey\(turn\.status\)/);
  assert.match(AGENT_SRC, /resolveCopyResult/);
  assert.doesNotMatch(AGENT_SRC, /agent\.turnReady/);

  // Only the success wording says "copied"; the manual wording must not — in
  // both locales.
  const i18nSrc = readFileSync(resolve("src/lib/i18n.ts"), "utf8");
  const ready = i18nSrc.match(/"agent\.turnReady": "[^"]*"/g) ?? [];
  const manual = i18nSrc.match(/"agent\.turnManual": "[^"]*"/g) ?? [];
  assert.equal(ready.length, 2);
  assert.equal(manual.length, 2);
  for (const line of ready) assert.match(line, /copied|已复制/);
  for (const line of manual) assert.doesNotMatch(line, /copied|已复制/);
});

test("the JSON drawer states it is manual import/export, not a watched file", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="config-json-file-note"/);
  assert.match(html, /never auto-reads or watches a file/i);
});

test("docs and UI never claim an auto-watched / auto-synced config file", () => {
  const doc = readFileSync(resolve("docs/live-session.config.md"), "utf8");
  // The optional bound file is allowed, but the doc is explicit it is never
  // watched / auto-read — read + save stay manual user actions.
  assert.match(doc, /not watched|never watched|not auto-read/i);
  // No copy implies a live binding / auto-sync / file watch.
  assert.doesNotMatch(doc, /synced to (a )?file|auto-?sync(ed)? to disk|watches the file/i);
  const html = renderCenter();
  assert.doesNotMatch(html, /synced to (a )?file/i);
});

test("the v1 boundary doc records runtime exclusions and the studio.config.json split", () => {
  const doc = readFileSync(resolve("docs/live-session.config.md"), "utf8");
  // v1 still excludes runtime state + studio appearance (locked as boundary text).
  for (const field of ["bottomBar", "liveSession\\.startedAt", "activeSection", "sectionsDone"]) {
    assert.match(doc, new RegExp(field));
  }
  assert.match(doc, /theme|appearance/i);
  // The future split is documented as a direction, not implemented now.
  assert.match(doc, /studio\.config\.json/);
  assert.match(doc, /schemaVersion/);
});

test("Settings language row uses a real i18n key, not translation comparison", () => {
  const i18nSrc = readFileSync(resolve("src/lib/i18n.ts"), "utf8");
  assert.match(SETTINGS_SRC, /settingsRow\.languageTitle/);
  assert.match(i18nSrc, /"settingsRow\.languageTitle": "Language"/);
  assert.match(i18nSrc, /"settingsRow\.languageTitle": "语言"/);
  assert.doesNotMatch(SETTINGS_SRC, /settings\.theme"\)\s*===/);
});

test("Studio Appearance shows real theme / colors / reset rows inline", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="settings-panel-appearance"/);
  // Real controls inline (prefixed testids) — the single home for appearance.
  assert.match(html, /data-testid="studio-theme-light"/);
  assert.match(html, /data-testid="studio-theme-dark"/);
  assert.match(html, /data-testid="studio-color-bg-dark"/);
  assert.match(html, /data-testid="studio-btn-reset"/);
  // No separate drawer to defer to — the merge removed the fallback button.
  assert.doesNotMatch(html, /data-testid="open-studio-drawer"/);
});

test("Settings is merged into Session Config: no standalone drawer, deep-link to Studio Appearance", () => {
  // The standalone SettingsDrawer is gone — one config surface only.
  assert.equal(existsSync(resolve("src/components/SettingsDrawer.tsx")), false);
  assert.doesNotMatch(APP_SRC, /SettingsDrawer/);
  assert.doesNotMatch(APP_SRC, /settingsOpen/);

  // The studio appearance logic still has a single home (the shared controls).
  const sharedSrc = readFileSync(
    resolve("src/components/live-data/StudioAppearanceControls.tsx"),
    "utf8",
  );
  assert.match(sharedSrc, /THEME_PRESETS/);
  assert.match(sharedSrc, /produceState/);

  // Gear / ⌘, / command-palette "Settings" deep-link into the dialog at the
  // Studio Appearance group (open the live tab + request the focus).
  assert.match(APP_SRC, /setSessionConfigFocus\(\{ mode: "settings", group: "appearance"/);
  assert.match(APP_SRC, /draft\.activeTab = "live"/);
  assert.match(APP_SRC, /onOpenSettings: openSessionConfigAppearance/); // ⌘, shortcut
  assert.match(APP_SRC, /onOpenSettings=\{openSessionConfigAppearance\}/); // TopBar + palette
  assert.match(APP_SRC, /focus=\{sessionConfigFocus\}/);
  assert.match(APP_SRC, /onFocusConsumed=\{consumeSessionConfigFocus\}/);

  // The dialog applies the requested mode + group, then consumes the one-shot.
  const managerSrc = readFileSync(resolve("src/components/live-data/LiveDataManager.tsx"), "utf8");
  assert.match(managerSrc, /setMode\(focus\.mode\)/);
  assert.match(managerSrc, /onFocusConsumed\?\.\(\)/);
  assert.match(managerSrc, /focus=\{localFocus \?\? focus\}/); // forwarded to SettingsView
  assert.match(SETTINGS_SRC, /if \(focus\?\.group\) setActiveTab\(focus\.group\)/);

  // The drawer fallback button + its plumbing are removed from Manual.
  assert.doesNotMatch(SETTINGS_SRC, /open-studio-drawer/);
  assert.doesNotMatch(SETTINGS_SRC, /onOpenStudioDrawer/);

  // The dead drawer i18n keys are gone.
  const i18nSrc = readFileSync(resolve("src/lib/i18n.ts"), "utf8");
  for (const key of [
    "settings.title",
    "settings.subtitle",
    "settings.closeSettings",
    "settingsRow.openStudioDrawer",
    "settingsRow.studioDrawerNote",
  ]) {
    assert.doesNotMatch(i18nSrc, new RegExp(key.replace(/\./g, "\\.")));
  }

  // Language + theme still render inside the dialog (moved from the drawer).
  const html = renderCenter();
  assert.match(html, /data-testid="manual-locale-zh"/);
  assert.match(html, /data-testid="manual-locale-en"/);
  assert.match(html, /data-testid="studio-theme-dark"/);
});

test("the JSON drawer is global, drift-safe, and openable from header / data & sync / agent", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="config-json-drawer"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /data-testid="session-config-panel"/);
  assert.match(html, /data-testid="config-input"/);
  assert.match(html, /data-testid="config-apply"/);
  assert.match(html, /data-testid="config-mode"/);
  // Module jumps.
  for (const key of ["title", "cover", "stack", "socials", "sections"]) {
    assert.match(html, new RegExp(`data-testid="config-json-module-${key}"`));
  }
  // Open entry points — the dialog header, Data & Sync, and the Agent.
  assert.match(html, /data-testid="open-json-top"/);
  assert.match(html, /data-testid="open-json-bar"/);
  assert.match(html, /data-testid="open-json-advanced"/);
  assert.match(html, /data-testid="open-json-agent"/);
});

test("the JSON drawer manages focus and is inert while closed", () => {
  const html = renderCenter();
  // Structure contract: a close button lives inside a dialog.
  assert.match(html, /role="dialog"/);
  assert.match(html, /data-testid="config-json-drawer-close"/);
  // The drawer wires the restore-focus + inert mechanisms and routes focus-in
  // through the tested pure helpers — asserting behaviour, not function names
  // or timer spelling, so a refactor that keeps the contract won't break this.
  assert.match(DRAWER_SRC, /restoreFocusRef/);
  assert.match(DRAWER_SRC, /\.inert\b/);
  assert.match(DRAWER_SRC, /focusTargetTestId/);
  assert.match(DRAWER_SRC, /needsFocusRetry/);
});

test("JSON drawer focus contract: target element and retry decision (pure)", () => {
  // Opened at a key → land on the JSON textarea; no key → the close button.
  assert.equal(focusTargetTestId("title"), "config-input");
  assert.equal(focusTargetTestId(null), "config-json-drawer-close");
  assert.equal(focusTargetTestId(undefined), "config-json-drawer-close");
  // Retry focus-in only while focus is still outside the panel (the opening
  // click can reclaim it to the trigger); never once focus is in, or panel gone.
  const inside = { contains: () => true };
  const outside = { contains: () => false };
  assert.equal(needsFocusRetry(outside, {} as unknown as Node), true);
  assert.equal(needsFocusRetry(inside, {} as unknown as Node), false);
  assert.equal(needsFocusRetry(null, {} as unknown as Node), false);
});

test("Agent chat has the seed, brief input, task chips, context chips and honest actions", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="agent-view"/);
  assert.match(html, /data-testid="agent-transcript"/);
  assert.match(html, /data-testid="agent-msg-seed"/);
  assert.match(html, /data-testid="agent-brief-input"/);
  for (const id of ["generate", "sections", "titleCover", "assets", "check"]) {
    assert.match(html, new RegExp(`data-testid="agent-task-${id}"`));
  }
  for (const id of ["config", "core", "noRuntime", "obs"]) {
    assert.match(html, new RegExp(`data-testid="agent-context-${id}"`));
  }
  assert.match(html, /data-testid="agent-copy-handoff"/);
  // Exactly one button opens the JSON drawer — no trio of same-weight actions.
  assert.match(html, /data-testid="open-json-agent"/);
  assert.doesNotMatch(html, /data-testid="agent-import-result"/);
  assert.doesNotMatch(html, /data-testid="agent-apply-config"/);
  // Honest framing: the seed explains review-before-Apply; no auto-apply copy.
  assert.match(html, /review/i);
  assert.doesNotMatch(html, /Import result/);
  assert.doesNotMatch(html, /Apply reviewed config/);
  // Draft handoff preview is collapsed by default (toggle present, pre not shown).
  assert.match(html, /data-testid="agent-handoff-toggle"/);
  assert.doesNotMatch(html, /data-testid="agent-handoff-preview"/);
});

test("the agent handoff includes the current config and changes with the task", () => {
  const sections = buildAgentPrompt(
    DEFAULT_STATE,
    "",
    "Task: update only the sections (titles + bullets); keep everything else.",
  );
  const check = buildAgentPrompt(
    DEFAULT_STATE,
    "",
    "Task: review the current config for issues and return a corrected version.",
  );
  assert.notEqual(sections, check);
  assert.match(sections, /update only the sections/);
  for (const p of [sections, check]) {
    assert.match(p, /"title": "Building With Agents"/);
    assert.match(p, /version: 1/);
    assert.match(p, /Allowed badge keys:/);
    assert.match(p, /claude-code/);
    assert.match(p, /chatgpt/);
    assert.match(p, /Do not use generic labels such as AI, LLM, or AI\/LLM/);
    assert.match(p, /Badges are optional/);
    assert.match(p, /never invent or force a badge/);
    assert.doesNotMatch(p, /Allowed badge keys:[^\n]*(react|nextdotjs)/);
  }
});

test("no Recipe/Brief reflow; the agent client never holds a key or hits a provider", () => {
  const html = renderCenter();
  assert.doesNotMatch(html, /Recipe/i);
  assert.doesNotMatch(html, /Brief Builder|Quick Start|Stream Recipe/);

  // The client (AgentView + its fetch helper) only calls the same-origin route —
  // never a provider, never a key, never an SDK. The key stays server-side.
  const clientSrc = readFileSync(resolve("src/lib/session-agent-client.ts"), "utf8");
  for (const src of [AGENT_SRC, clientSrc]) {
    assert.doesNotMatch(src, /Authorization|Bearer |apiKey|SESSION_AGENT_API_KEY|process\.env/);
    assert.doesNotMatch(src, /api\.deepseek\.com|api\.openai\.com|EventSource|XMLHttpRequest/i);
    assert.doesNotMatch(src, /\bopenai\b|\banthropic\b/i);
  }
  assert.match(clientSrc, /\/api\/session-config\/agent/);
  // The client imports the server adapter type-only, so its provider-call code
  // never enters the client bundle.
  assert.match(AGENT_SRC, /import type \{[^}]*SessionAgentStatus[^}]*\} from "\.\.\/\.\.\/lib\/session-agent"/);
  // The prompt builder stays pure (no network).
  const promptSrc = readFileSync(resolve("src/lib/agent-prompt.ts"), "utf8");
  assert.doesNotMatch(promptSrc, /\bfetch\s*\(/);
});

test("Agent shows a connected badge + Run with AI only when a provider is configured", () => {
  // Default (no provider) → local prep badge, no Run with AI.
  const local = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(AgentView, { state: DEFAULT_STATE, dateKey: "2026-06-27", onOpenJson: () => {} }),
    }),
  );
  assert.match(local, /data-testid="agent-local-badge"/);
  assert.match(local, /no model connected/i);
  assert.doesNotMatch(local, /data-testid="agent-run-ai"/);

  // Configured → connected badge + Run with AI. Copy handoff stays as fallback.
  const connected = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(AgentView, {
        state: DEFAULT_STATE,
        dateKey: "2026-06-27",
        onOpenJson: () => {},
        initialStatus: { configured: true, provider: "deepseek", model: "deepseek-chat" },
      }),
    }),
  );
  assert.match(connected, /data-testid="agent-connected-badge"/);
  assert.match(connected, /Connected · deepseek · deepseek-chat/);
  assert.match(connected, /data-testid="agent-run-ai"/);
  assert.match(connected, /data-testid="agent-copy-handoff"/);
});

test("AI review path is wired to the drawer buffer and never auto-applies", () => {
  // AgentView hands returned JSON up via reviewProposal (not a second apply path)
  // and opportunistically marks the persisted proposal as reviewed.
  assert.match(AGENT_SRC, /markAgentProposalReviewedClient\(conversationId, turn\.proposalId\)/);
  assert.match(AGENT_SRC, /if \(turn\.configText\) onReviewJson\?\.\(turn\.configText\)/);
  assert.doesNotMatch(AGENT_SRC, /onChange\(/); // the agent never writes state

  // LiveDataManager opens the drawer for review and clears the one-shot after.
  const managerSrc = readFileSync(resolve("src/components/live-data/LiveDataManager.tsx"), "utf8");
  assert.match(managerSrc, /openJsonForReview/);
  assert.match(managerSrc, /onReviewJson=\{openJsonForReview\}/);
  assert.match(managerSrc, /onReviewConsumed=\{\(\) => setReviewText\(null\)\}/);

  // The editor loads reviewText into the editing buffer (review), never applies it.
  const editorSrc = readFileSync(resolve("src/components/live-data/SessionConfigEditor.tsx"), "utf8");
  const reviewEffect = editorSrc.slice(
    editorSrc.indexOf("if (reviewText == null) return;"),
    editorSrc.indexOf("}, [reviewText]);"),
  );
  assert.match(reviewEffect, /loadTextIntoBuffer\(reviewText\)/);
  assert.match(reviewEffect, /onReviewConsumed/);
  assert.doesNotMatch(reviewEffect, /onChange\(|applyConfigText/);
});

test("the OBS chip is honest: push confirmed, consumption not heartbeat-confirmed", () => {
  const i18nSrc = readFileSync(resolve("src/lib/i18n.ts"), "utf8");
  // Synced tooltip confirms the push but disclaims OBS consumption.
  assert.match(i18nSrc, /"sourceBar\.obsSyncedHint": "live-state push confirmed; OBS source consumption is not heartbeat-confirmed\."/);
  assert.match(i18nSrc, /not heartbeat-confirmed/);
  // It never claims OBS is online / consuming.
  assert.doesNotMatch(i18nSrc, /"sourceBar\.obs[A-Za-z]*": "[^"]*OBS is online/i);
  assert.doesNotMatch(i18nSrc, /OBS confirmed receipt|OBS is receiving/i);
});

test("switching Manual tabs only swaps the visible panel (state preserved)", () => {
  const html = renderCenter();
  // Tabs are a presentation switch — every panel is rendered (visibility
  // toggled via hidden), so the v1 fields + JSON drift never unmount on switch.
  assert.match(SETTINGS_SRC, /role="tabpanel"/);
  assert.match(SETTINGS_SRC, /hidden=\{tab\.id !== activeTab\}/);
  // All five panels are present in the markup even though one is active.
  for (const id of ["session", "broadcast", "appearance", "provider", "data"]) {
    assert.match(html, new RegExp(`data-testid="settings-panel-${id}"`));
  }
});

test("obsolete Session Config i18n namespaces are removed", () => {
  const i18nSrc = readFileSync(resolve("src/lib/i18n.ts"), "utf8");
  for (const namespace of ["agentPrepare.", "configView.", "configOutline."]) {
    assert.doesNotMatch(i18nSrc, new RegExp(namespace.replace(".", "\\.")));
  }
});

function renderBar(obsSync: ObsSyncState) {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(SourceOfTruthBar, {
        dateKey: "2026-06-26",
        persistence: BASE_PERSISTENCE,
        obsSync,
        onReload: () => {},
        onStartSession: () => {},
        onEndSession: () => {},
        onOpenJson: () => {},
      }),
    }),
  );
}

test("the source-of-truth bar shows a real (idle) OBS status, no faked revision", () => {
  const local = renderCenter(); // default obsSync = idle (nothing pushed yet)
  assert.match(local, /data-testid="live-data-session-bar"/);
  assert.match(local, /Authority/);
  assert.match(local, /Local draft/);
  assert.match(local, /data-testid="obs-sync-chip"/);
  assert.match(local, /idle/);
  // Idle never invents a revision number.
  assert.doesNotMatch(local, /rev\s*#?\s*\d+/i);
  assert.doesNotMatch(local, /revision\s*\d+/i);
});

test("OBS sync detail is honest: a real revision only when synced", () => {
  assert.equal(obsSyncDetail(IDLE_OBS_SYNC), "");
  assert.equal(obsSyncDetail({ status: "syncing", revision: null, lastPushedAt: null, error: null }), "");
  assert.equal(obsSyncDetail({ status: "error", revision: null, lastPushedAt: null, error: "live-state 500" }), "");
  assert.match(
    obsSyncDetail({ status: "synced", revision: 7, lastPushedAt: "2026-06-26T10:00:00.000Z", error: null }),
    /rev 7/,
  );
  // Synced without a server revision shows no fabricated number — no "rev 0",
  // no "rev <n>", no "rev" word at all — just the last-pushed time.
  const nullRev = obsSyncDetail({
    status: "synced",
    revision: null,
    lastPushedAt: "2026-06-26T10:00:00.000Z",
    error: null,
  });
  assert.doesNotMatch(nullRev, /rev/);
  assert.notEqual(nullRev, "");
});

test("the OBS chip renders real synced / error status with last-pushed detail", () => {
  const synced = renderBar({ status: "synced", revision: 12, lastPushedAt: "2026-06-26T10:00:00.000Z", error: null });
  assert.match(synced, /data-testid="obs-sync-chip"/);
  assert.match(synced, /rev 12/);

  const error = renderBar({ status: "error", revision: null, lastPushedAt: null, error: "live-state 503" });
  // The push error is surfaced (chip tooltip) and no revision is invented.
  assert.match(error, /live-state 503/);
  assert.doesNotMatch(error, /rev\s*\d/);

  const syncing = renderBar({ status: "syncing", revision: null, lastPushedAt: null, error: null });
  assert.match(syncing, /syncing/);
  assert.doesNotMatch(syncing, /rev\s*\d/);

  // Synced but the API reported no revision: still a synced chip, but never
  // "rev 0" or any fabricated number.
  const syncedNoRev = renderBar({
    status: "synced",
    revision: null,
    lastPushedAt: "2026-06-26T10:00:00.000Z",
    error: null,
  });
  assert.match(syncedNoRev, /data-testid="obs-sync-chip"/);
  assert.doesNotMatch(syncedNoRev, /rev 0/);
  assert.doesNotMatch(syncedNoRev, /rev\s*\d/);
});

test("publishLiveState returns the store's real revision + updatedAt, backward-compatibly", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ revision: 9, updatedAt: "2026-06-26T10:00:00.000Z", locale: "en", state: {} }),
        { status: 200 },
      )) as typeof fetch;
    assert.deepEqual(await publishLiveState(DEFAULT_STATE, "en"), {
      revision: 9,
      updatedAt: "2026-06-26T10:00:00.000Z",
    });

    // Missing revision → null (never a faked 0); updatedAt still falls back to "".
    globalThis.fetch = (async () => new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;
    assert.deepEqual(await publishLiveState(DEFAULT_STATE, "en"), { revision: null, updatedAt: "" });

    // Non-numeric revision (e.g. an older API or wrong type) → null, not 0.
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ revision: "5", updatedAt: 123 }), { status: 200 })) as typeof fetch;
    assert.deepEqual(await publishLiveState(DEFAULT_STATE, "en"), { revision: null, updatedAt: "" });

    // A non-OK response throws so the caller can show an error status.
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    await assert.rejects(() => publishLiveState(DEFAULT_STATE, "en"));
  } finally {
    globalThis.fetch = original;
  }
});

test("Agent shows the active task intent and the handoff reflects the brief", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="agent-task-intent"/);
  // The default task (generate) intent is visible without expanding the handoff.
  assert.match(html, /Generate a complete config/);

  // The handoff varies with the user brief, not just the task chip.
  const a = buildAgentPrompt(DEFAULT_STATE, "rebuild the intro", "Task: x");
  const b = buildAgentPrompt(DEFAULT_STATE, "wrap up the stream", "Task: x");
  assert.notEqual(a, b);
  assert.match(a, /Brief: rebuild the intro/);
  assert.match(b, /Brief: wrap up the stream/);
});
