import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { DEFAULT_STATE } from "../types";
import {
  formatLiveStudioConfigJson,
  overlayStateToConfig,
} from "./live-studio-config";
import {
  LIVE_SESSION_CONFIG_V1_KEYS,
  RUNTIME_STATE_EXCLUSIONS,
  STUDIO_CONFIG_FIELDS,
  parseStudioConfigDraft,
  sessionConfigForeignKeys,
  validateStudioConfigDraft,
} from "./session-config-boundary";

test("v1 session keys are disjoint from runtime + studio exclusions", () => {
  const v1 = new Set<string>(LIVE_SESSION_CONFIG_V1_KEYS);
  for (const runtime of RUNTIME_STATE_EXCLUSIONS) {
    // Compare on the top-level segment (e.g. "sidebar.activeSection" → "sidebar").
    assert.ok(!v1.has(runtime), `runtime field ${runtime} must not be a v1 key`);
    assert.ok(!v1.has(runtime.split(".")[0]!), `runtime root of ${runtime} must not be a v1 key`);
  }
  for (const studio of STUDIO_CONFIG_FIELDS) {
    assert.ok(!v1.has(studio), `studio field ${studio} must not be a v1 key`);
  }
});

test("v1 export contains only content-core keys, no runtime / studio fields", () => {
  const config = overlayStateToConfig(DEFAULT_STATE) as unknown as Record<string, unknown>;
  // Top-level: nothing outside the v1 content core.
  assert.deepEqual(sessionConfigForeignKeys(config), []);

  // Whole-string defence: the export never carries these field names, even nested.
  const json = formatLiveStudioConfigJson(overlayStateToConfig(DEFAULT_STATE));
  for (const forbidden of [
    '"bottomBar"',
    '"liveSession"',
    '"startedAt"',
    '"activeSection"',
    '"sectionsDone"',
    '"theme"',
    '"colors"',
    '"persistence"',
    '"mainScreen"',
  ]) {
    assert.ok(!json.includes(forbidden), `v1 export must not contain ${forbidden}`);
  }
});

test("sessionConfigForeignKeys flags runtime / studio fields that leak in", () => {
  const leaked = {
    version: 1,
    title: "x",
    subtitle: "y",
    sections: [],
    theme: "dark", // studio
    bottomBar: [], // runtime
  };
  assert.deepEqual(sessionConfigForeignKeys(leaked).sort(), ["bottomBar", "theme"]);
});

test("validateStudioConfigDraft accepts a well-formed appearance draft", () => {
  const result = validateStudioConfigDraft({
    schemaVersion: 1,
    appearance: { theme: "dark", colors: { primaryMark: "#E9915C" } },
    defaults: {},
    obs: {},
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test("validateStudioConfigDraft enforces the boundary and the shape", () => {
  // Session content must not appear in the studio config.
  const withContent = validateStudioConfigDraft({
    schemaVersion: 1,
    title: "Build with Agents",
    sections: [{ title: "Goal", bullets: ["Ship"] }],
  });
  assert.equal(withContent.valid, false);
  assert.match(withContent.issues.join("\n"), /session content key "title"/);
  assert.match(withContent.issues.join("\n"), /session content key "sections"/);

  // Runtime state must not appear in the studio config either.
  const withRuntime = validateStudioConfigDraft({
    schemaVersion: 1,
    bottomBar: {},
    liveSession: { startedAt: "2026-06-26T10:00:00.000Z" },
    sidebar: { activeSection: 1, sectionsDone: [[true]] },
  });
  assert.equal(withRuntime.valid, false);
  assert.match(withRuntime.issues.join("\n"), /runtime state key "bottomBar"/);
  assert.match(withRuntime.issues.join("\n"), /runtime state key "liveSession"/);
  assert.match(withRuntime.issues.join("\n"), /runtime state key "sidebar"/);

  // Wrong schema version.
  assert.equal(validateStudioConfigDraft({ schemaVersion: 2 }).valid, false);

  // Bad appearance values.
  assert.match(
    validateStudioConfigDraft({ schemaVersion: 1, appearance: { theme: "sepia" } }).issues.join("\n"),
    /appearance\.theme/,
  );
  assert.match(
    validateStudioConfigDraft({ schemaVersion: 1, appearance: { colors: { bg: 123 } } }).issues.join("\n"),
    /appearance\.colors\.bg/,
  );
  assert.match(
    validateStudioConfigDraft({ schemaVersion: 1, persistence: "database" }).issues.join("\n"),
    /persistence must be an object/,
  );
  // Non-object input.
  assert.equal(validateStudioConfigDraft("nope").valid, false);
});

test("parseStudioConfigDraft returns a draft for valid JSON, null otherwise", () => {
  const ok = parseStudioConfigDraft(
    JSON.stringify({
      schemaVersion: 1,
      appearance: { theme: "light" },
      persistence: { mode: "local" },
    }),
  );
  assert.equal(ok?.schemaVersion, 1);
  assert.equal(ok?.appearance?.theme, "light");
  assert.deepEqual(ok?.persistence, { mode: "local" });

  // Invalid (carries session content) → null.
  assert.equal(parseStudioConfigDraft(JSON.stringify({ schemaVersion: 1, title: "x" })), null);
  // Invalid (carries runtime state) → null.
  assert.equal(parseStudioConfigDraft(JSON.stringify({ schemaVersion: 1, bottomBar: {} })), null);
  // Not JSON → null.
  assert.equal(parseStudioConfigDraft("{not json"), null);
});

test("the studio.config example fixture parses + validates", () => {
  const raw = readFileSync(resolve("docs/internal/studio.config.example.json"), "utf8");
  assert.equal(validateStudioConfigDraft(JSON.parse(raw)).valid, true);
  const parsed = parseStudioConfigDraft(raw);
  assert.equal(parsed?.schemaVersion, 1);
  assert.equal(parsed?.appearance?.theme, "dark");
});

test("studio.config doc marks it a draft and never claims a watched / bound file", () => {
  const doc = readFileSync(resolve("docs/internal/studio.config.md"), "utf8");
  assert.match(doc, /draft, not a running feature/i);
  assert.match(doc, /does \*\*not\*\* read, write, watch/i);
  assert.doesNotMatch(doc, /synced to (a )?file|auto-?reads a (local )?file|watches the file/i);
});
