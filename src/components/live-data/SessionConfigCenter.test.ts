import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "../../hooks/useLocale";
import { DEFAULT_STATE } from "../../types";
import { buildAgentPrompt } from "../../lib/agent-prompt";
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
        onOpenSettings: () => {},
      }),
    }),
  );
}

test("the left nav has only AI Prepare and Settings — JSON is not a third page", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="config-nav-prepare"/);
  assert.match(html, /data-testid="config-nav-settings"/);
  assert.doesNotMatch(html, /data-testid="config-nav-json"/);
  // Two primary view panes; no JSON pane.
  assert.match(html, /data-testid="config-view-prepare"/);
  assert.match(html, /data-testid="config-view-settings"/);
  assert.doesNotMatch(html, /data-testid="config-view-json"/);
});

test("AI Prepare has a big input, task chips, and a prompt preview with the current config", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="agent-prepare"/);
  assert.match(html, /data-testid="agent-brief-input"/);
  for (const id of ["generate", "sections", "titleCover", "assets", "check"]) {
    assert.match(html, new RegExp(`data-testid="agent-task-${id}"`));
  }
  assert.match(html, /data-testid="agent-prompt-preview"/);
  // The preview includes the current config (default title).
  assert.match(html, /Building With Agents/);
});

test("selecting a task chip changes the composed prompt; it always includes the config", () => {
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
  assert.match(check, /review the current config/);
  for (const prompt of [sections, check]) {
    assert.match(prompt, /live-session\.config\.json/);
    assert.match(prompt, /version: 1/);
    assert.match(prompt, /"title": "Building With Agents"/);
  }
});

test("Settings has the core / runtime / display / appearance / persistence groups", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="config-view-settings"/);
  for (const id of ["core", "runtime", "display", "appearance", "persistence"]) {
    assert.match(html, new RegExp(`id="config-settings-${id}"`));
    assert.match(html, new RegExp(`data-testid="config-nav-${id}"`));
  }
  // Keeps the live editors.
  assert.match(html, /data-testid="live-data-sections"/);
  assert.match(html, /data-testid="live-data-live-session"/);
  assert.match(html, /data-testid="live-data-stack"/);
  assert.match(html, /data-testid="live-data-bottom-bar"/);
  // Studio Appearance routes to the existing settings drawer (not re-implemented).
  assert.match(html, /data-testid="open-studio-settings"/);
});

test("the JSON drawer reuses SessionConfigEditor drift-safe controls + module jumps", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="config-json-drawer"/);
  assert.match(html, /data-testid="session-config-panel"/);
  assert.match(html, /data-testid="config-input"/);
  assert.match(html, /data-testid="config-apply"/);
  assert.match(html, /data-testid="config-import"/);
  assert.match(html, /data-testid="config-export"/);
  assert.match(html, /data-testid="config-mode"/);
  // Module jumps for the v1 shape.
  for (const key of [
    "title",
    "profile",
    "cover",
    "badges",
    "stack",
    "socials",
    "sections",
  ]) {
    assert.match(html, new RegExp(`data-testid="config-json-module-${key}"`));
  }
});

test("the JSON drawer is openable from the source bar, AI Prepare and Settings", () => {
  const html = renderCenter();
  assert.match(html, /data-testid="open-json-bar"/);
  assert.match(html, /data-testid="open-json-prepare"/);
  assert.match(html, /data-testid="open-json-settings"/);
});

test("the source-of-truth bar shows DB / local status without a faked OBS revision", () => {
  const local = renderCenter();
  assert.match(local, /data-testid="live-data-session-bar"/);
  assert.match(local, /Authority/);
  assert.match(local, /Local draft/);
  assert.match(local, /Local only/);
  assert.match(local, /Using local draft/i);
  assert.match(local, /current state/);
  assert.doesNotMatch(local, /rev#?\s*\d+/i);
  assert.doesNotMatch(local, /revision\s*\d+/i);
});

test("no revived Recipe/Brief, no LLM, no network in AI prepare or its prompt builder", () => {
  const html = renderCenter();
  assert.doesNotMatch(html, /Recipe/i);
  assert.doesNotMatch(html, /Brief Builder|Quick Start|Stream Recipe/);

  const viewSrc = readFileSync(
    resolve("src/components/live-data/AgentPrepareView.tsx"),
    "utf8",
  );
  const promptSrc = readFileSync(resolve("src/lib/agent-prompt.ts"), "utf8");
  for (const src of [viewSrc, promptSrc]) {
    assert.doesNotMatch(src, /\bfetch\s*\(/);
    assert.doesNotMatch(src, /EventSource|XMLHttpRequest|openai|anthropic/i);
  }
});
