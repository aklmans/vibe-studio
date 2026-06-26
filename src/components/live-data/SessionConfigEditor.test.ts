import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "../../hooks/useLocale";
import { DEFAULT_STATE } from "../../types";
import { dict } from "../../lib/i18n";
import { parseLiveStudioConfigJson } from "../../lib/live-studio-config";
import type { FileAccessAdapter } from "../../lib/config-file-access";
import SessionConfigEditor, { SESSION_CONFIG_FILE_NAME } from "./SessionConfigEditor";

function fakeAdapter(
  supported: boolean,
  overrides: Partial<FileAccessAdapter> = {},
): FileAccessAdapter {
  return {
    supported: () => supported,
    pick: async () => ({ handle: {}, name: "live-session.config.json" }),
    read: async () => "{}",
    write: async () => {},
    ensureReadable: async () => true,
    ensureWritable: async () => true,
    ...overrides,
  };
}

function renderEditor(adapter: FileAccessAdapter) {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(SessionConfigEditor, {
        state: DEFAULT_STATE,
        onChange: () => {},
        fileAccess: adapter,
      }),
    }),
  );
}

const en = dict.en as Record<string, string>;
const zh = dict.zh as Record<string, string>;

test("no user-visible 'Live Data' tab copy remains", () => {
  for (const value of Object.values(en)) {
    assert.doesNotMatch(value, /Live Data/i);
  }
  for (const value of Object.values(zh)) {
    assert.doesNotMatch(value, /直播数据/);
  }
  assert.equal(en["tab.live"], "Session Config");
  assert.equal(zh["tab.live"], "直播配置");
  assert.equal(en["cmdk.tab.live"], "Go to Session Config");

  // The command-palette search value is repurposed (still findable, no "live data").
  const cmdkSource = readFileSync(
    resolve("src/components/CommandPalette.tsx"),
    "utf8",
  );
  assert.doesNotMatch(cmdkSource, /live data/i);
  assert.match(cmdkSource, /tab-live 直播配置 session config/);
});

test("no brief.* / recipe.* dead i18n keys remain", () => {
  for (const locale of [en, zh]) {
    for (const key of Object.keys(locale)) {
      assert.doesNotMatch(key, /^(brief|recipe)\./);
    }
  }
});

test("the example config uses the live-session name and parses as v1", () => {
  const raw = readFileSync(
    resolve("docs/live-session.config.example.json"),
    "utf8",
  );
  const parsed = parseLiveStudioConfigJson(raw);
  assert.equal(parsed?.version, 1);
  assert.ok(parsed?.title);
  assert.ok(parsed?.sections.length);
});

test("export uses the live-session.config.json file name", () => {
  assert.equal(SESSION_CONFIG_FILE_NAME, "live-session.config.json");
});

const editorSource = readFileSync(
  resolve("src/components/live-data/SessionConfigEditor.tsx"),
  "utf8",
);

test("export rule is fixed: emits the state projection, never the editing draft", () => {
  const exportFn = editorSource.slice(
    editorSource.indexOf("const exportCurrentConfig"),
    editorSource.indexOf("const importConfigFile"),
  );
  // Exports the synced projection, not the (possibly invalid) editing buffer.
  assert.match(exportFn, /const json = projected;/);
  assert.doesNotMatch(exportFn, /displayedText/);
  assert.doesNotMatch(exportFn, /drift\.draft/);
});

test("import guardrail: lands in the buffer, validates, never auto-applies", () => {
  const importFn = editorSource.slice(
    editorSource.indexOf("const importConfigFile"),
    editorSource.indexOf("return ("),
  );
  assert.match(importFn, /\\.json\$/); // checks the file extension
  assert.match(importFn, /loadTextIntoBuffer/); // shared buffer loader (no auto-apply)
  assert.match(importFn, /config\.importNotJson/);
  assert.match(importFn, /config\.importInvalid/);
  assert.doesNotMatch(importFn, /onChange\(/); // never writes state

  // The shared loader (used by import AND the bound-file read) transitions the
  // drift to "editing" and pre-validates — and never writes state, so neither
  // path can auto-apply.
  const loader = editorSource.slice(
    editorSource.indexOf("const loadTextIntoBuffer"),
    editorSource.indexOf("const readBoundIntoBuffer"),
  );
  assert.match(loader, /beginEditing/);
  assert.match(loader, /parseConfigText/);
  assert.doesNotMatch(loader, /onChange\(/);
});

test("bound read enters the buffer (no auto-apply); bound save writes the projection", () => {
  const readFn = editorSource.slice(
    editorSource.indexOf("const readBoundIntoBuffer"),
    editorSource.indexOf("const bindFile"),
  );
  // A bound read routes through the shared buffer loader — never applies state.
  assert.match(readFn, /loadTextIntoBuffer\(result\.text\)/);
  assert.doesNotMatch(readFn, /onChange\(/);
  assert.doesNotMatch(readFn, /applyConfigText/);

  const saveFn = editorSource.slice(
    editorSource.indexOf("const saveBoundFile"),
    editorSource.indexOf("const unbindFile"),
  );
  // Save writes the state projection, never the editing draft, and a failure
  // doesn't touch state.
  assert.match(saveFn, /writeBoundFile\(adapter, handle, projected\)/);
  assert.doesNotMatch(saveFn, /displayedText/);
  assert.doesNotMatch(saveFn, /drift\.draft/);
  assert.doesNotMatch(saveFn, /onChange\(/);
});

test("bound-file actions appear only when File System Access is supported", () => {
  const supported = renderEditor(fakeAdapter(true));
  assert.match(supported, /data-testid="config-bind-file"/);
  assert.match(supported, /data-testid="config-file-status"/);
  assert.match(supported, /data-testid="config-file-note"/);
  // Existing manual import / export is still present alongside.
  assert.match(supported, /data-testid="config-export"/);
  assert.match(supported, /data-testid="config-import"/);

  const fallback = renderEditor(fakeAdapter(false));
  assert.doesNotMatch(fallback, /data-testid="config-bind-file"/);
  assert.doesNotMatch(fallback, /data-testid="config-save-file"/);
  // Status row still shows, in manual-only mode.
  assert.match(fallback, /data-testid="config-file-status"/);
  assert.match(fallback, /Manual import \/ export only/);
});

test("file workflow copy is honest: manual, reviewed, never watched / synced", () => {
  for (const supported of [true, false]) {
    const html = renderEditor(fakeAdapter(supported));
    assert.doesNotMatch(html, /synced to (a )?file/i);
    assert.doesNotMatch(html, /auto-?sync(ed)?/i);
    assert.doesNotMatch(html, /\bwatches the file\b/i);
    assert.doesNotMatch(html, /\bis watched\b/i);
  }
  // The bound-file note positively states it is not watched + still reviewed.
  const bound = renderEditor(fakeAdapter(true));
  assert.match(bound, /never watched/i);
  assert.match(bound, /review \+ Apply/i);
});

test("clipboard-failure message still affirms the file download succeeded", () => {
  assert.match(en["config.copyFailed"], /Downloaded live-session\.config\.json/);
  assert.match(zh["config.copyFailed"], /已下载 live-session\.config\.json/);
});
