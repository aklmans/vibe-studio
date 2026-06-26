import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { cssAlpha, UI_COLORS } from "../lib/design-tokens";
import { dict } from "../lib/i18n";
import { parseLiveStudioConfigJson } from "../lib/live-studio-config";
import { LocaleProvider } from "../hooks/useLocale";
import { DEFAULT_STATE } from "../types";
import CommandPalette from "./CommandPalette";
import SettingsDrawer from "./SettingsDrawer";
import TopBar from "./topbar/TopBar";
import BadgesEditor from "./BadgesEditor";
import SocialsEditor from "./SocialsEditor";
import StackEditor from "./StackEditor";
import OverlayInspector from "./inspector/groups/OverlayInspector";
import CoverInspector from "./inspector/groups/CoverInspector";
import PosterInspector from "./inspector/groups/PosterInspector";
import WallpaperInspector from "./inspector/groups/WallpaperInspector";
import LiveDataManager from "./live-data/LiveDataManager";
import { SectionInput, ToggleButton } from "./shared/Field";

test("shared text inputs use the editorial inset control surface", () => {
  const html = renderToStaticMarkup(
    React.createElement(SectionInput, {
      label: "Title",
      value: "Vibe Studio",
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
    "src/components/live-data/SessionConfigEditor.tsx",
    "src/components/inspector/BrandIdentityEditor.tsx",
    "src/components/inspector/InspectorGroup.tsx",
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

test("command palette uses the localized Vibe Studio label", () => {
  const source = readFileSync(resolve("src/components/CommandPalette.tsx"), "utf8");
  const zh = dict.zh as Record<string, string>;
  const en = dict.en as Record<string, string>;

  assert.equal(zh["cmdk.label"], "Vibe Studio 命令面板");
  assert.equal(en["cmdk.label"], "Vibe Studio command palette");
  assert.match(source, /label=\{t\("cmdk\.label"\)\}/);
  assert.doesNotMatch(source, /Vibe Overlay command palette/);
});


test("command palette reset opens settings instead of resetting immediately", () => {
  const source = readFileSync(resolve("src/components/CommandPalette.tsx"), "utf8");

  assert.doesNotMatch(source, /onSelect=\{run\(onReset\)\}/);
  assert.match(source, /onSelect=\{run\(\(\) => \{\s*onOpenSettings\(\);\s*\}\)\}/);
});

test("overlay live editing is split into focused inspector groups", () => {
  const source = readFileSync(resolve("src/components/inspector/groups/OverlayInspector.tsx"), "utf8");

  assert.match(source, /testId="group-overlay-live-session"/);
  assert.match(source, /testId="group-overlay-stack"/);
  assert.match(source, /testId="group-overlay-bottom-bar"/);
  assert.doesNotMatch(source, /testId="group-overlay-live-bar"/);
  assert.match(source, /title=\{t\("group\.liveSession"\)\}/);
  assert.match(source, /title=\{t\("group\.stack"\)\}/);
  assert.match(source, /title=\{t\("group\.bottomBarSegments"\)\}/);
});

test("tab shortcuts include Session Config in the visible tab order", () => {
  const source = readFileSync(resolve("src/components/OverlayBuilderApp.tsx"), "utf8");

  assert.match(source, /import \{ APP_TABS/);
  assert.match(source, /const TAB_ORDER = APP_TABS;/);
  assert.doesNotMatch(source, /const TAB_ORDER = CANVAS_TABS;/);
});

test("editor hints explain which surfaces consume shared fields", () => {
  const coverSource = readFileSync(resolve("src/components/inspector/groups/CoverInspector.tsx"), "utf8");
  const posterSource = readFileSync(resolve("src/components/inspector/groups/PosterInspector.tsx"), "utf8");
  const socialSource = readFileSync(resolve("src/components/SocialsEditor.tsx"), "utf8");
  const bottomSource = readFileSync(resolve("src/components/BottomBarSegmentEditor.tsx"), "utf8");
  const zh = dict.zh as Record<string, string>;
  const en = dict.en as Record<string, string>;

  assert.match(coverSource, /t\("mapping\.todayTopic"\)/);
  assert.match(posterSource, /t\("mapping\.todayTopic"\)/);
  assert.match(socialSource, /t\("mapping\.socials"\)/);
  assert.match(bottomSource, /t\("mapping\.bottomTopic"\)/);
  assert.match(bottomSource, /t\("mapping\.bottomStack"\)/);
  assert.match(zh["mapping.todayTopic"], /封面/);
  assert.match(en["mapping.socials"], /Sidebar/);
});

test("unused wallpaper editor module is removed from the workbench", () => {
  assert.equal(existsSync(resolve("src/components/WallpaperEditor.tsx")), false);
});

test("surface inspectors default to a focused first-screen workflow", () => {
  const cover = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(CoverInspector, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );
  assert.match(cover, /data-testid="group-cover-copy"/);
  assert.match(cover, /data-testid="cover-visual"/);
  assert.match(cover, /data-testid="cover-title"/);
  assert.match(cover, /data-testid="cover-subtitle"/);
  assert.match(cover, /data-testid="cover-today-label"/);
  assert.match(cover, /data-testid="cover-today-topic"/);
  assert.doesNotMatch(cover, /data-testid="group-cover-today"/);
  assert.doesNotMatch(cover, /data-testid="cover-social-visible"/);

  const poster = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(PosterInspector, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );
  assert.match(poster, /data-testid="group-poster-copy"/);
  assert.match(poster, /data-testid="poster-title"/);
  assert.match(poster, /data-testid="poster-today-label"/);
  assert.match(poster, /data-testid="poster-today-topic"/);
  assert.doesNotMatch(poster, /data-testid="group-poster-today"/);
  assert.doesNotMatch(poster, /data-testid="poster-manifesto-visible"/);
  assert.doesNotMatch(poster, /data-testid="poster-hook-visible"/);
  assert.doesNotMatch(poster, /data-testid="poster-closing-visible"/);
  assert.doesNotMatch(poster, /data-testid="poster-social-visible"/);

  const wallpaper = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(WallpaperInspector, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );
  assert.match(wallpaper, /data-testid="wallpaper-title"/);
  assert.match(wallpaper, /data-testid="wallpaper-preset-desktop-4k"/);
  assert.doesNotMatch(wallpaper, /data-testid="wallpaper-brand-visible"/);
  assert.doesNotMatch(wallpaper, /data-testid="wallpaper-avatar-visible"/);
});

test("session config center wires the source bar, mode switch, both modes and the JSON drawer", () => {
  const source = readFileSync(resolve("src/components/live-data/LiveDataManager.tsx"), "utf8");
  // Shell = source-of-truth bar + a Manual/Agent mode segmented + the two modes
  // + the global JSON drawer. The editors live inside ManualSettings.
  assert.match(source, /<SourceOfTruthBar/);
  assert.match(source, /<LineSegmented/);
  assert.match(source, /<ManualSettings/);
  assert.match(source, /<AgentView/);
  assert.match(source, /<ConfigJsonDrawer/);
  const formSource = readFileSync(resolve("src/components/live-data/ManualSettings.tsx"), "utf8");
  for (const id of [
    "live-data-sections",
    "live-data-stack",
    "live-data-live-session",
    "live-data-bottom-bar",
  ]) {
    assert.match(formSource, new RegExp(`"${id}"`));
  }
});

test("session config exposes the JSON editor instead of the brief or recipe main path", () => {
  const panelSource = readFileSync(resolve("src/components/live-data/SessionConfigEditor.tsx"), "utf8");
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(LiveDataManager, {
        state: DEFAULT_STATE,
        onChange: () => {},
        dateKey: "2026-06-23",
        persistence: {
          databaseConfigured: false,
          loading: false,
          saving: false,
          error: null,
          savedAt: null,
          session: null,
        },
        onReload: () => {},
        onStartSession: () => {},
        onEndSession: () => {},
        onOpenSettings: () => {},
        onReset: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="session-config-panel"/);
  assert.match(html, /data-testid="config-input"/);
  assert.match(html, /data-testid="config-export"/);
  assert.match(html, /data-testid="config-validate"/);
  assert.match(html, /data-testid="config-apply"/);
  assert.match(html, /Session Config/);
  assert.doesNotMatch(html, /Brief Builder/);
  assert.doesNotMatch(html, /Quick Start/);
  assert.doesNotMatch(html, /Stream Recipe/);
  assert.doesNotMatch(panelSource, /generateLiveBriefDraft/);
  assert.doesNotMatch(panelSource, /applyLiveBriefDraftToOverlayState/);
  assert.doesNotMatch(panelSource, /data-testid="brief-draft-preview"/);
});

test("live studio example config is checked in for agent handoff", () => {
  const raw = readFileSync(resolve("docs/live-session.config.example.json"), "utf8");
  const parsed = parseLiveStudioConfigJson(raw);

  assert.equal(parsed?.title, "Building With Agents");
  assert.equal(parsed?.badges.includes("kimi"), true);
});


test("overlay inspector section tabs show one progress section at a time", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(OverlayInspector, {
        state: {
          ...DEFAULT_STATE,
          sidebar: { ...DEFAULT_STATE.sidebar, activeSection: 1 },
        },
        onChange: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="active-section-1"[^>]*aria-pressed="true"/);
  assert.match(html, /data-testid="overlay-section-panel-1"/);
  assert.doesNotMatch(html, /data-testid="overlay-section-panel-0"/);
  assert.doesNotMatch(html, /data-testid="overlay-section-panel-2"/);
});

test("session config section editor shows one progress section at a time", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(LiveDataManager, {
        state: DEFAULT_STATE,
        onChange: () => {},
        dateKey: "2026-06-23",
        persistence: {
          databaseConfigured: false,
          loading: false,
          saving: false,
          error: null,
          savedAt: null,
          session: null,
        },
        onReload: () => {},
        onStartSession: () => {},
        onEndSession: () => {},
        onOpenSettings: () => {},
        onReset: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="live-data-section-tabs"/);
  assert.match(html, /data-testid="live-data-section-panel-0"/);
  assert.match(html, /data-testid="live-data-section-tab-0"[^>]*aria-pressed="true"/);
  assert.match(html, /data-testid="live-data-section-tab-1"[^>]*aria-pressed="false"/);
  assert.doesNotMatch(html, /data-testid="live-data-section-panel-1"/);
  assert.doesNotMatch(html, /data-testid="live-data-section-panel-2"/);
});

test("social editor uses brand-icon search instead of fixed kind slots", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(SocialsEditor, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="social-add-search"/);
  assert.match(html, /data-testid="social-add-youtube"/);
  assert.match(html, /data-testid="social-add-custom"/);
  assert.match(html, /data-testid="social-0-icon"/);
  assert.match(html, /data-brand-icon="bilibili"/);
  assert.match(html, /data-testid="social-0-mode-brand"/);
  assert.match(html, /data-testid="social-0-remove"/);
  assert.match(html, /data-testid="social-0-move-up"[^>]*disabled=""/);
  assert.match(html, /data-testid="social-0-move-down"/);
  assert.doesNotMatch(html, /data-testid="social-0-kind-/);
  assert.doesNotMatch(html, /data-testid="social-0-visible"/);
  assert.doesNotMatch(html, /role="switch"/);
});

test("social display components render registry icons next to social values", () => {
  const listSource = readFileSync(resolve("src/components/SocialList.tsx"), "utf8");
  const cardSource = readFileSync(resolve("src/components/shared/SocialCard.tsx"), "utf8");

  assert.match(listSource, /BrandIcon/);
  assert.match(cardSource, /BrandIcon/);
  assert.match(listSource, /social\.iconKey/);
  assert.match(cardSource, /social\.iconKey/);
  assert.doesNotMatch(listSource, /social\.kind === "custom"/);
  assert.doesNotMatch(cardSource, /social\.kind === "custom"/);
});

test("studio appearance controls use ruled selectors and color rows instead of shared pills", () => {
  const drawerSource = readFileSync(resolve("src/components/SettingsDrawer.tsx"), "utf8");
  assert.doesNotMatch(drawerSource, /WorkbenchSegmented/);
  assert.doesNotMatch(drawerSource, /ColorInput/);

  // The selectors + color rows now live in the shared StudioAppearanceControls,
  // reused by the drawer and the Session Config Studio Appearance group.
  const source = readFileSync(
    resolve("src/components/live-data/StudioAppearanceControls.tsx"),
    "utf8",
  );
  assert.doesNotMatch(source, /WorkbenchSegmented/);
  assert.doesNotMatch(source, /ColorInput/);
  assert.match(source, /function SettingsSelector/);
  assert.match(source, /function ColorRow/);
  assert.match(source, /boxShadow:\s*isActive\s*\?\s*`inset 0 -2px 0 \$\{UI_COLORS\.accent\}`/);
  assert.match(source, /gridTemplateColumns:\s*"minmax\(0, 1fr\) auto auto"/);
});

test("settings drawer renders semantic ruled controls for selectors and colors", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "zh",
      persist: false,
      children: React.createElement(SettingsDrawer, {
        open: true,
        state: DEFAULT_STATE,
        onClose: () => {},
        onChange: () => {},
        onReset: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="locale-zh"[^>]*aria-pressed="true"/);
  assert.match(html, /data-testid="locale-en"[^>]*aria-pressed="false"/);
  assert.match(html, /data-testid="theme-dark"[^>]*aria-pressed="true"/);
  assert.match(html, /data-testid="color-bg-dark"[^>]*type="color"/);
  assert.match(html, /#1a1a1a/i);
  assert.doesNotMatch(html, /role="switch"[^>]*data-testid="locale-/);
});

test("topbar search language and theme share the editorial website tool style", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "zh",
      persist: false,
      children: React.createElement(TopBar, {
        state: DEFAULT_STATE,
        onChange: () => {},
        exporting: null,
        onExportOverlay: () => {},
        onExportSidebar: () => {},
        onExportBottomBar: () => {},
        onExportCover: () => {},
        onExportPoster: () => {},
        onExportWallpaper: () => {},
        onOpenSettings: () => {},
        onOpenCommandPalette: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="topbar-tools"/);
  assert.match(html, /data-testid="btn-open-cmdk"[^>]*border:0/);
  assert.match(html, /data-testid="btn-toggle-locale"[^>]*border:0/);
  assert.match(html, /data-testid="btn-toggle-locale"[^>]*width:42px/);
  assert.match(html, /data-testid="btn-toggle-theme"[^>]*border:0/);
  assert.match(html, /data-testid="btn-toggle-theme"[^>]*data-theme="dark"/);
  assert.match(html, /data-testid="btn-open-settings"[^>]*border:0/);
  assert.match(html, /data-testid="tab-overlay"[^>]*width:88px/);
  assert.match(html, /data-testid="tab-wallpaper"[^>]*width:104px/);
  assert.match(html, /aria-keyshortcuts="Meta\+K Control\+K"/);
  assert.match(html, />EN<\/button>/);
  assert.match(html, /btn-open-settings[\s\S]*?<svg/);
  assert.match(html, /btn-open-settings[\s\S]*?M9\.671 4\.136/);
  assert.doesNotMatch(html, /data-testid="btn-open-cmdk"[^>]*border:1px solid/);
  assert.doesNotMatch(html, /data-testid="btn-open-settings"[^>]*>⚙<\/button>/);
});


test("export control aligns with the topbar tool language", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(TopBar, {
        state: { ...DEFAULT_STATE, activeTab: "poster" },
        onChange: () => {},
        exporting: null,
        onExportOverlay: () => {},
        onExportSidebar: () => {},
        onExportBottomBar: () => {},
        onExportCover: () => {},
        onExportPoster: () => {},
        onExportWallpaper: () => {},
        onOpenSettings: () => {},
        onOpenCommandPalette: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="btn-export-primary"[^>]*width:186px/);
  assert.match(html, /data-testid="btn-export-primary"[^>]*border:none/);
  assert.match(html, /data-testid="btn-export-menu-toggle"[^>]*border:none/);
  assert.match(html, /data-testid="btn-export-menu-toggle"[\s\S]*?<svg/);
  assert.match(html, />Export Poster<\/button>/);
  assert.doesNotMatch(html, /data-testid="btn-export-primary"[^>]*padding:7px 15px/);
});

test("command palette follows the website search overlay structure", () => {
  const source = readFileSync(resolve("src/components/CommandPalette.tsx"), "utf8");

  assert.doesNotMatch(source, /borderRadius:\s*6/);
  assert.match(source, /top:\s*80/);
  assert.match(source, /border:\s*`0\.5px solid \$\{UI_COLORS\.text\}`/);
  assert.match(source, /gridTemplateColumns:\s*"34px minmax\(0, 1fr\) auto"/);
  assert.match(source, /fontFamily:\s*"var\(--app-font-serif\)"/);
  assert.match(source, /box-shadow: inset 1\.5px 0 0 \$\{UI_COLORS\.accent\};/);
  assert.match(source, /borderLeft:\s*"1\.5px solid transparent"/);
  assert.match(source, /background:\s*UI_COLORS\.inputInset/);
});

test("command palette renders like an editorial search popup", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(CommandPalette, {
        open: true,
        state: { ...DEFAULT_STATE, theme: "light", activeTab: "poster" },
        onClose: () => {},
        onChange: () => {},
        onExportOverlay: () => {},
        onExportCover: () => {},
        onExportPoster: () => {},
        onExportWallpaper: () => {},
        onExportSidebar: () => {},
        onExportBottomBar: () => {},
        onOpenSettings: () => {},
        onReset: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="cmdk-dialog"[^>]*top:80px/);
  assert.match(html, /data-testid="cmdk-dialog"[^>]*border:0\.5px solid var\(--live-text\)/);
  assert.match(html, /data-testid="cmdk-dialog"[^>]*border-radius:0/);
  assert.match(html, /data-testid="cmdk-input"[^>]*font-family:var\(--app-font-serif\)/);
  assert.match(html, /data-testid="cmdk-tab-poster"/);
  assert.match(html, /data-current="true"/);
  assert.match(html, /border-left:1\.5px solid transparent/);
  assert.match(html, /background:var\(--live-input-inset\)/);
  assert.doesNotMatch(html, /border-radius:6px/);
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

test("badge rows use display-label wording, not social-label wording", () => {
  const source = readFileSync(resolve("src/components/BadgesEditor.tsx"), "utf8");

  assert.match(source, /FieldLine label=\{t\("label\.displayLabel"\)\}/);
  assert.doesNotMatch(source, /FieldLine label=\{t\("label\.socialLabel"\)\}/);
});

test("badge editor selects registry icons instead of asking for icon URLs", () => {
  const source = readFileSync(resolve("src/components/BadgesEditor.tsx"), "utf8");

  assert.match(source, /IconSearchPicker/);
  assert.match(source, /searchBadgeIcons/);
  assert.doesNotMatch(source, /BadgeAddResults/);
  assert.doesNotMatch(source, /icon-url/);
  assert.doesNotMatch(source, /label\.iconUrl/);
});

test("badge editor is an add-list workflow instead of fixed visibility slots", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(BadgesEditor, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="badge-add-search"/);
  assert.match(html, /data-testid="badge-add-kimi"/);
  assert.match(html, /data-testid="badge-0-remove"/);
  assert.match(html, /data-testid="badge-0-mode-brand"/);
  assert.doesNotMatch(html, /data-testid="badge-0-visible"/);
  assert.doesNotMatch(html, /role="switch"/);
  assert.doesNotMatch(html, /data-testid="badge-0-icon-search"/);
  assert.doesNotMatch(html, /aria-label="Badge 1 label"/);
});

test("badge editor exposes reorder controls, presets, and an empty hint", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(BadgesEditor, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="badge-0-move-up"[^>]*disabled=""/);
  assert.match(html, /data-testid="badge-0-move-down"/);
  assert.match(html, /data-testid="badge-1-move-down"[^>]*disabled=""/);
  assert.match(html, /data-testid="badge-preset-claude-codex"/);
  assert.match(html, /data-testid="badge-preset-chatgpt-kimi"/);
  assert.match(html, /data-testid="badge-preset-opencode-z-ai"/);
  assert.match(html, /data-testid="badge-preset-claude-code-cursor"/);

  const empty = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(BadgesEditor, {
        state: {
          ...DEFAULT_STATE,
          cover: { ...DEFAULT_STATE.cover, badges: [] },
        },
        onChange: () => {},
      }),
    }),
  );
  assert.match(empty, /data-testid="badge-empty-hint"/);
});

test("right inspector editors use the inspector line segmented control", () => {
  const files = [
    "src/components/BadgesEditor.tsx",
    "src/components/SocialsEditor.tsx",
    "src/components/BottomBarSegmentEditor.tsx",
    "src/components/inspector/groups/OverlayInspector.tsx",
    "src/components/inspector/groups/WallpaperInspector.tsx",
    "src/components/live-data/ManualSettings.tsx",
  ];

  for (const file of files) {
    const source = readFileSync(resolve(file), "utf8");
    assert.doesNotMatch(source, /WorkbenchSegmented/);
    assert.match(source, /LineSegmented/);
  }
});

test("bottom bar helper notes are ruled, not filled inset boxes", () => {
  const source = readFileSync(resolve("src/components/BottomBarSegmentEditor.tsx"), "utf8");

  assert.doesNotMatch(source, /workbenchNoteStyle/);
  assert.match(source, /RuleNote/);
});

test("stack bare tool glyphs keep a generous hit target", () => {
  const source = readFileSync(resolve("src/components/StackEditor.tsx"), "utf8");

  assert.match(source, /minWidth:\s*30/);
  assert.match(source, /minHeight:\s*30/);
  assert.match(source, /border:\s*"none"/);
});


test("wallpaper inspector exposes only one effective avatar visibility toggle", () => {
  const source = readFileSync(
    resolve("src/components/inspector/groups/WallpaperInspector.tsx"),
    "utf8",
  );

  const matches = [...source.matchAll(/testId="wallpaper-avatar-visible"/g)];
  assert.equal(matches.length, 1);
  assert.match(source, /showAvatarToggle=\{false\}/);
});

test("cover visual editor writes cover-only image URLs and reset defaults", () => {
  const source = readFileSync(resolve("src/components/inspector/CoverVisualEditor.tsx"), "utf8");

  assert.match(source, /writeCover\(\{ portraitUrl: v \}\)/);
  assert.match(source, /writeCover\(\{ sceneUrl: v \}\)/);
  assert.doesNotMatch(source, /writeCover\(\{ avatarUrl:/);
  assert.match(source, /clearValue="\/avatar\.png"/);
  assert.match(source, /clearValue="\/vibe-studio-bg\.png"/);
});


test("stack editor uses searchable brand-icon rows instead of plain string-only editing", () => {
  const source = readFileSync(resolve("src/components/StackEditor.tsx"), "utf8");

  assert.match(source, /searchBrandIcons/);
  assert.match(source, /BrandIcon/);
  assert.match(source, /IconSearchPicker/);
  assert.match(source, /data-testid=\{`stack-item-\$\{idx\}-icon`\}/);
});

test("bottom bar stack segment renders icon-backed stack items", () => {
  const source = readFileSync(resolve("src/components/BottomBarSegments.tsx"), "utf8");

  assert.match(source, /BrandIcon/);
  assert.match(source, /stackItemLabel/);
  assert.match(source, /item\.iconKey/);
});


test("badge social and stack editors share the brand icon picker component", () => {
  const pickerSource = readFileSync(resolve("src/components/shared/IconSearchPicker.tsx"), "utf8");
  const badgeSource = readFileSync(resolve("src/components/BadgesEditor.tsx"), "utf8");
  const socialSource = readFileSync(resolve("src/components/SocialsEditor.tsx"), "utf8");
  const stackSource = readFileSync(resolve("src/components/StackEditor.tsx"), "utf8");

  assert.match(pickerSource, /export default function IconSearchPicker/);
  for (const source of [badgeSource, socialSource, stackSource]) {
    assert.match(source, /IconSearchPicker/);
  }

  assert.doesNotMatch(badgeSource, /function BadgeAddResults/);
  assert.doesNotMatch(socialSource, /function SocialAddResults/);
  assert.doesNotMatch(stackSource, /data-testid="stack-add-options"/);
});

test("icon editors expose shared workflow presets", () => {
  const badgeHtml = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(BadgesEditor, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );
  assert.match(badgeHtml, /data-testid="badge-icon-picker"/);
  assert.match(badgeHtml, /data-testid="badge-preset-ai-agents"/);

  const socialHtml = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(SocialsEditor, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );
  assert.match(socialHtml, /data-testid="social-icon-picker"/);
  assert.match(socialHtml, /data-testid="social-preset-social"/);
  assert.match(socialHtml, /data-testid="social-preset-streaming"/);

  const stackHtml = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(StackEditor, {
        state: DEFAULT_STATE,
        onChange: () => {},
      }),
    }),
  );
  assert.match(stackHtml, /data-testid="stack-icon-picker"/);
  assert.match(stackHtml, /data-testid="stack-preset-ai-agents"/);
  assert.match(stackHtml, /data-testid="stack-preset-frontend"/);
  assert.match(stackHtml, /data-testid="stack-preset-streaming"/);
});
