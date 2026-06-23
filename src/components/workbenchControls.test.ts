import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { cssAlpha, UI_COLORS } from "../lib/design-tokens";
import { dict } from "../lib/i18n";
import { SectionInput, ToggleButton } from "./shared/Field";

test("shared text inputs use the editorial inset control surface", () => {
  const html = renderToStaticMarkup(
    React.createElement(SectionInput, {
      label: "Title",
      value: "Vibe Coding",
      onChange: () => {},
    }),
  );

  assert.match(html, /font-family:var\(--app-font-mono\)/);
  assert.match(html, /background:var\(--live-input-inset\)/);
  assert.match(html, /border:1px solid var\(--live-control-border\)/);
  assert.doesNotMatch(html, /background:var\(--live-control-surface\)/);
});

test("shared toggles are hairline controls, not solid accent pills", () => {
  const html = renderToStaticMarkup(
    React.createElement(ToggleButton, {
      label: "Show Avatar",
      checked: true,
      onChange: () => {},
    }),
  );

  assert.match(html, /role="switch"/);
  assert.match(html, /border:1px solid/);
  assert.match(html, new RegExp(cssAlpha(UI_COLORS.accent, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(html, /background:var\(--live-accent\)/);
  assert.doesNotMatch(html, /background:var\(--live-white\)/);
});

test("operation UI source paths avoid legacy SaaS visual residue", () => {
  const files = [
    "src/components/BadgesEditor.tsx",
    "src/components/SocialsEditor.tsx",
    "src/components/shared/AvatarUploader.tsx",
    "src/components/shared/Field.tsx",
    "src/components/SidebarSectionEditor.tsx",
    "src/components/BottomBarSegmentEditor.tsx",
    "src/components/LiveSessionEditor.tsx",
    "src/components/StackEditor.tsx",
    "src/components/SettingsDrawer.tsx",
    "src/components/CommandPalette.tsx",
    "src/components/topbar/ExportMenu.tsx",
    "src/components/live-data/LiveDataManager.tsx",
    "src/components/live-data/SessionRecipePanel.tsx",
    "src/components/inspector/BrandIdentityEditor.tsx",
    "src/components/inspector/InspectorGroup.tsx",
    "src/components/WallpaperEditor.tsx",
    "src/components/ui/alert-dialog.tsx",
    "src/components/ui/button.tsx",
  ];

  const offenders = files.flatMap((file) => {
    const content = readFileSync(resolve(file), "utf8");
    const matches = [
      ...content.matchAll(/rgba\(255,\s*255,\s*255/gi),
      ...content.matchAll(/background:\s*[^;\n?]+?\?\s*UI_COLORS\.accent\b/g),
      ...content.matchAll(/UI_COLORS\.white/g),
      ...content.matchAll(/UI_COLORS\.panelSurface/g),
      ...content.matchAll(/\bshadow-(?:xs|sm|md|lg|xl|2xl)\b/g),
    ];
    return matches.map((match) => `${file}: ${match[0]}`);
  });

  assert.deepEqual(offenders, []);
});

test("command palette uses the localized Vibe Coding Live label", () => {
  const source = readFileSync(resolve("src/components/CommandPalette.tsx"), "utf8");
  const zh = dict.zh as Record<string, string>;
  const en = dict.en as Record<string, string>;

  assert.equal(zh["cmdk.label"], "Vibe Coding Live 命令面板");
  assert.equal(en["cmdk.label"], "Vibe Coding Live command palette");
  assert.match(source, /label=\{t\("cmdk\.label"\)\}/);
  assert.doesNotMatch(source, /Vibe Overlay command palette/);
});

test("reset dialog typography uses the actual app mono family without Chinese-hostile title casing", () => {
  const buttonSource = readFileSync(resolve("src/components/ui/button.tsx"), "utf8");
  const alertSource = readFileSync(resolve("src/components/ui/alert-dialog.tsx"), "utf8");

  assert.match(buttonSource, /\[font-family:var\(--app-font-mono\)\]/);
  assert.match(alertSource, /\[font-family:var\(--app-font-mono\)\]/);
  assert.doesNotMatch(buttonSource, /font-\[var\(--app-font-mono\)\]/);
  assert.doesNotMatch(alertSource, /font-\[var\(--app-font-mono\)\]/);
  assert.doesNotMatch(alertSource, /\buppercase\b/);
  assert.doesNotMatch(alertSource, /tracking-\[0\.12em\]/);
});
