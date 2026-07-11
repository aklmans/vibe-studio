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
import { DEMO_STATE_BY_LOCALE, DEFAULT_STATE } from "../types";
import CommandPalette from "./CommandPalette";
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

test("session config center wires the mode switch, both modes and the JSON drawer", () => {
  const source = readFileSync(resolve("src/components/live-data/LiveDataManager.tsx"), "utf8");
  // Shell = an Agent / Settings mode segmented + the two modes + the global JSON
  // drawer. The editors and the source-of-truth bar live inside Settings.
  assert.match(source, /<LineSegmented/);
  assert.match(source, /<SettingsView/);
  assert.match(source, /<AgentView/);
  assert.match(source, /<ConfigJsonDrawer/);
  const formSource = readFileSync(resolve("src/components/live-data/SettingsView.tsx"), "utf8");
  assert.match(formSource, /<SourceOfTruthBar/); // source-of-truth now lives in Data & Sync
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
          sidebar: {
            ...DEFAULT_STATE.sidebar,
            agendas: {
              ...DEFAULT_STATE.sidebar.agendas,
              workbench: { ...DEFAULT_STATE.sidebar.agendas.workbench, activeSection: 1 },
            },
          },
        },
        onChange: () => {},
      }),
    }),
  );

  // The sections manager: wrapping chips select the section, one editor shows,
  // and the structure controls (add / move / remove) are present.
  assert.match(html, /data-testid="inspector-sections-chip-1"[^>]*aria-pressed="true"/);
  assert.match(html, /data-testid="inspector-sections-chip-0"[^>]*aria-pressed="false"/);
  assert.match(html, /data-testid="inspector-sections-editor-1"/);
  assert.doesNotMatch(html, /data-testid="inspector-sections-editor-0"/);
  assert.match(html, /data-testid="inspector-sections-add"/);
  assert.match(html, /data-testid="inspector-sections-move-up"/);
  assert.match(html, /data-testid="inspector-sections-remove"/);
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
        onReset: () => {},
      }),
    }),
  );

  assert.match(html, /data-testid="live-data-sections-manager"/);
  assert.match(html, /data-testid="live-data-sections-chip-0"[^>]*aria-pressed="true"/);
  assert.match(html, /data-testid="live-data-sections-chip-1"[^>]*aria-pressed="false"/);
  assert.match(html, /data-testid="live-data-sections-editor-0"/);
  assert.doesNotMatch(html, /data-testid="live-data-sections-editor-1"/);
  assert.match(html, /data-testid="live-data-sections-add"/);
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
  // The selectors + color rows live in the shared StudioAppearanceControls,
  // the single home for the Session Config Studio Appearance group.
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

test("topbar search language and theme share the editorial website tool style", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "zh",
      persist: false,
      children: React.createElement(TopBar, {
        state: DEFAULT_STATE,
        onChange: () => {},
        exporting: null,
        onExportAll: () => {},
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
        onExportAll: () => {},
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

test("export all is offered in the menu + command palette and wired through the app", () => {
  // The TopBar export dropdown is a closed-by-default portal, so assert the
  // wiring at the source: an "Export All" row + the onExportAll prop.
  const menuSrc = readFileSync(resolve("src/components/topbar/ExportMenu.tsx"), "utf8");
  assert.match(menuSrc, /itemRow\(t\("export\.all"\), onExportAll, "all"\)/);
  assert.match(menuSrc, /onExportAll: \(\) => void/);

  // The command palette exposes "Export All" inline (it renders when open).
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(CommandPalette, {
        open: true,
        state: DEFAULT_STATE,
        onClose: () => {},
        onChange: () => {},
        onExportAll: () => {},
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
  assert.match(html, /data-testid="cmdk-export-all"/);
  assert.match(html, /Export All/);

  // The app implements one action that exports every artifact, and forwards it
  // to both the TopBar and the command palette.
  const appSrc = readFileSync(resolve("src/components/OverlayBuilderApp.tsx"), "utf8");
  assert.match(appSrc, /const handleExportAll = useCallback/);
  for (const fn of [
    "exportFullOverlay",
    "exportCover",
    "exportPoster",
    "exportWallpaper",
    "exportSidebar",
    "exportBottomBar",
  ]) {
    assert.match(appSrc, new RegExp(`await ${fn}\\(`));
  }
  const allWirings = appSrc.match(/onExportAll=\{handleExportAll\}/g) ?? [];
  assert.equal(allWirings.length, 2); // TopBar + command palette
});

test("command palette follows the website search overlay structure", () => {
  const source = readFileSync(resolve("src/components/CommandPalette.tsx"), "utf8");

  assert.match(source, /top:\s*80/);
  // The frame is unified with the Session Config dialog: a soft hairline + rounded.
  assert.match(source, /border:\s*`1px solid \$\{UI_COLORS\.border\}`/);
  assert.match(source, /borderRadius:\s*12/);
  // The scrim matches too: the shared overlay scrim + a light blur, no frost.
  assert.match(source, /background:\s*UI_COLORS\.overlayScrim/);
  assert.doesNotMatch(source, /saturate/);
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
        onExportAll: () => {},
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
  assert.match(html, /data-testid="cmdk-dialog"[^>]*border:1px solid var\(--live-border\)/);
  assert.match(html, /data-testid="cmdk-dialog"[^>]*border-radius:12px/);
  assert.match(html, /data-testid="cmdk-input"[^>]*font-family:var\(--app-font-serif\)/);
  assert.match(html, /data-testid="cmdk-tab-poster"/);
  assert.match(html, /data-current="true"/);
  assert.match(html, /border-left:1\.5px solid transparent/);
  assert.match(html, /background:var\(--live-input-inset\)/);
  // The scrim is unified with the Session Config dialog: overlay scrim + blur(3px).
  assert.match(html, /data-testid="cmdk-scrim"[^>]*backdrop-filter:blur\(3px\)/);
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
        state: DEMO_STATE_BY_LOCALE.zh,
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
        state: DEMO_STATE_BY_LOCALE.zh,
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
  // OverlayInspector delegates its pickers (SectionsManager chips, per-segment
  // editors) so it has no segmented control of its own — it only needs to stay
  // clear of the heavy WorkbenchSegmented.
  const files = [
    "src/components/BadgesEditor.tsx",
    "src/components/SocialsEditor.tsx",
    "src/components/BottomBarSegmentEditor.tsx",
    "src/components/inspector/groups/OverlayInspector.tsx",
    "src/components/inspector/groups/WallpaperInspector.tsx",
    "src/components/live-data/SettingsView.tsx",
  ];
  const usesLineSegmented = new Set([
    "src/components/BadgesEditor.tsx",
    "src/components/SocialsEditor.tsx",
    "src/components/BottomBarSegmentEditor.tsx",
    "src/components/inspector/groups/WallpaperInspector.tsx",
    "src/components/live-data/SettingsView.tsx",
  ]);

  for (const file of files) {
    const source = readFileSync(resolve(file), "utf8");
    assert.doesNotMatch(source, /WorkbenchSegmented/);
    if (usesLineSegmented.has(file)) {
      assert.match(source, /LineSegmented/);
    }
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
        state: DEMO_STATE_BY_LOCALE.zh,
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

test("sections manager edits without driving the live agenda (review P0-3)", () => {
  const SECTIONS_SRC = readFileSync(resolve("src/components/SectionsManager.tsx"), "utf8");
  const DRIVE_SRC = readFileSync(resolve("src/components/inspector/AgendaDrivePanel.tsx"), "utf8");

  // Picking a chip in the manager is an editing selection — it must never
  // drive the on-air section or restart its timer. Driving stays in the
  // Broadcast agenda drive console.
  assert.doesNotMatch(SECTIONS_SRC, /driveAgendaTo/);
  assert.match(SECTIONS_SRC, /setSelectedRaw\(index\)/);
  assert.match(SECTIONS_SRC, /liveIndex=\{live\}/);
  assert.match(DRIVE_SRC, /driveAgendaTo|drive\(/);

  // The live section carries a quiet marker distinct from the edit selection.
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(OverlayInspector, {
        state: {
          ...DEFAULT_STATE,
          sidebar: {
            ...DEFAULT_STATE.sidebar,
            agendas: {
              ...DEFAULT_STATE.sidebar.agendas,
              workbench: { ...DEFAULT_STATE.sidebar.agendas.workbench, activeSection: 1 },
            },
          },
        },
        onChange: () => {},
      }),
    }),
  );
  assert.match(html, /data-testid="inspector-sections-chip-1-live-dot"/);
  assert.match(html, /data-testid="inspector-sections-live-tag"/);
  // Manual completion is a labeled control with a >=24px hit area.
  assert.match(html, /data-testid="inspector-sections-completed"[^>]*aria-label="/);
  assert.match(html, /data-testid="inspector-sections-completed"[^>]*style="width:24px;height:24px/);
});
