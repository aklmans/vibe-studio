import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "../hooks/useLocale";
import FirstRunWizard from "./FirstRunWizard";

const WIZARD_SRC = readFileSync(resolve("src/components/FirstRunWizard.tsx"), "utf8");
const APP_SRC = readFileSync(resolve("src/components/OverlayBuilderApp.tsx"), "utf8");

function renderWizard(locale: "zh" | "en" = "en") {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: locale,
      persist: false,
      children: React.createElement(FirstRunWizard, {
        onComplete: () => {},
        onSkip: () => {},
      }),
    }),
  );
}

test("first-run wizard renders the name step with skip-all always available", () => {
  const html = renderWizard();

  assert.match(html, /data-testid="first-run-wizard"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /data-testid="wizard-name-input"/);
  assert.match(html, /data-testid="wizard-skip-all"/);
  // Next is disabled until a name is typed; the other steps are optional.
  assert.match(html, /data-testid="wizard-next"[^>]*disabled=""/);
});

test("first-run wizard copy is localized in both languages", () => {
  assert.match(renderWizard("zh"), /欢迎使用 Vibe Studio/);
  assert.match(renderWizard("en"), /Welcome to Vibe Studio/);
});

test("wizard builds a v3 brand profile and never touches session content", () => {
  // Completion produces a StudioProfile (brand layer) — no cover/stack/agenda writes.
  assert.match(WIZARD_SRC, /version: 3/);
  assert.match(WIZARD_SRC, /author: name\.trim\(\)/);
  assert.doesNotMatch(WIZARD_SRC, /sidebar|stack|agendas/);
});

test("app shows the wizard only on a true studio first run", () => {
  // Never in demo mode; only when neither a draft nor a brand profile exists,
  // decided in the initializer via the pure first-run gate.
  assert.match(APP_SRC, /shouldShowFirstRun\(\{/);
  assert.match(APP_SRC, /hasStoredDraft: hasStoredOverlayState\(\)/);
  assert.match(APP_SRC, /hasBrandProfile: Boolean\(loadStudioProfile\(\)\)/);
});

test("draft autosave is deferred while the wizard is open (F-1)", () => {
  // A mid-wizard refresh must boot back into the wizard: the persist effect
  // bails until the host completes or skips (both flip firstRunOpen).
  assert.match(
    APP_SRC,
    /if \(!shouldPersistOverlayDraft\(\{ demoMode, firstRunOpen \}\)\) return;/,
  );
});

test("demo keeps its own storage draft and rich seed", () => {
  assert.match(APP_SRC, /DEMO_OVERLAY_STATE_STORAGE_KEY/);
  assert.match(APP_SRC, /DEMO_STATE_BY_LOCALE\[loadLocale\(\)\]/);
  assert.match(APP_SRC, /saveOverlayState\(state, undefined, stateStorageKey\)/);
});
