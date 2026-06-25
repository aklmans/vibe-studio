import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { dict } from "../../lib/i18n";
import { parseLiveStudioConfigJson } from "../../lib/live-studio-config";
import { SESSION_CONFIG_FILE_NAME } from "./SessionConfigEditor";

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
  assert.match(importFn, /beginEditing/); // lands in the editing buffer
  assert.match(importFn, /parseConfigText/); // pre-validates
  assert.match(importFn, /config\.importNotJson/);
  assert.match(importFn, /config\.importInvalid/);
  assert.doesNotMatch(importFn, /onChange\(/); // never writes state
});

test("clipboard-failure message still affirms the file download succeeded", () => {
  assert.match(en["config.copyFailed"], /Downloaded live-session\.config\.json/);
  assert.match(zh["config.copyFailed"], /已下载 live-session\.config\.json/);
});
