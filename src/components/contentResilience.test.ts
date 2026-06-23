import assert from "node:assert/strict";
import test from "node:test";
import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_STATE, type OverlayState } from "../types";
import { LocaleProvider } from "../hooks/useLocale";
import type { SocialConfig } from "../lib/socials";
import type { BadgeConfig } from "../lib/badges";
import { WALLPAPER_PRESETS } from "../lib/wallpaper";
import CoverCanvas from "./CoverCanvas";
import PosterCanvas from "./PosterCanvas";
import WallpaperCanvas from "./WallpaperCanvas";
import OverlayCanvas from "./OverlayCanvas";
import SocialList from "./SocialList";
import SocialCard from "./shared/SocialCard";
import BadgeToolbar from "./shared/BadgeToolbar";
import BottomBarSegments from "./BottomBarSegments";
import { editorialPalette } from "./lib/editorial-palette";

// ── Content pressure-test fixtures ──────────────────────────────────────────
// Real livestream copy is not the friendly default. These cover the three
// classes that historically broke the fixed canvases.

const LONG_URL =
  "https://www.youtube.com/@an-extremely-long-channel-handle-2018-coding-live";
const LONG_TOKEN =
  "wss://realtime.example.internal/v1/streams/abcdefghijklmnopqrstuvwxyz0123456789";
const LONG_STACK_ITEM =
  "@workspace/super-long-package-name-without-breakpoints-for-live-bottom-bar";

const STRESS_SOCIALS: SocialConfig[] = [
  { visible: true, kind: "youtube", label: "YouTube", value: LONG_URL, customColor: "" },
  { visible: true, kind: "discord", label: "Discord", value: "https://discord.gg/UJjzvHck", customColor: "" },
  { visible: true, kind: "custom", label: "VERYLONGCUSTOMLABELNAME", value: LONG_TOKEN, customColor: "#e0815c" },
  { visible: true, kind: "github", label: "GitHub", value: "https://github.com/aklmans/vibe-coding-live-overlay-builder", customColor: "" },
];

const STRESS_BADGES: BadgeConfig[] = [
  { visible: true, kind: "custom", label: "Claude-Opus-4.6-extended-thinking-preview-build", customIconUrl: "" },
  { visible: true, kind: "codex", label: "Codex", customIconUrl: "" },
];

function coverState(patch: Partial<OverlayState["cover"]>): OverlayState {
  return { ...DEFAULT_STATE, cover: { ...DEFAULT_STATE.cover, ...patch } };
}

// Class 1 — short title, very long subtitle / hook.
const SHORT_TITLE_LONG_SUBTITLE = coverState({
  title: "Live",
  todayTopic:
    "一场关于多 Agent 协作、上下文工程、评测闭环、长时任务编排与导出保真度的超长中文直播主题，长到必须换行才能放进固定安全区",
  hookText: LONG_TOKEN,
});

// Class 2 — long unbroken Chinese title.
const LONG_CHINESE_TITLE = coverState({
  title:
    "用一群智能体把这个非常非常长的中文标题硬塞进固定尺寸的封面安全区里看看会不会溢出断层或者被裁掉",
});

// Class 3 — English technical title plus long link / handle / token.
const LONG_TECH_TITLE_LINKS = coverState({
  title:
    "Multi-Agent-Orchestration-Pipeline-With-A-Very-Long-Unbroken-Identifier",
  todayTopic: LONG_TOKEN,
  socials: STRESS_SOCIALS,
  badges: STRESS_BADGES,
});

const FIXTURES: ReadonlyArray<readonly [string, OverlayState]> = [
  ["short title + long subtitle", SHORT_TITLE_LONG_SUBTITLE],
  ["long Chinese title", LONG_CHINESE_TITLE],
  ["tech title + long links/tokens", LONG_TECH_TITLE_LINKS],
];

function renderWithLocale(node: ReactNode): string {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: node,
    }),
  );
}

// ── 1. Nothing throws or renders empty under stress ─────────────────────────

test("every broadcast canvas renders all stress fixtures", () => {
  for (const [name, state] of FIXTURES) {
    const cover = renderWithLocale(React.createElement(CoverCanvas, { state }));
    const poster = renderWithLocale(React.createElement(PosterCanvas, { state }));
    const overlay = renderWithLocale(React.createElement(OverlayCanvas, { state }));
    assert.ok(cover.length > 0, `cover ${name}`);
    assert.ok(poster.length > 0, `poster ${name}`);
    assert.ok(overlay.length > 0, `overlay ${name}`);
    for (const preset of WALLPAPER_PRESETS) {
      const wp = renderWithLocale(
        React.createElement(WallpaperCanvas, { state, preset }),
      );
      assert.ok(wp.length > 0, `wallpaper ${preset.id} ${name}`);
    }
  }
});

// ── 2. Titles wrap inside the fixed canvas instead of forcing one line ───────

test("Cover title uses natural wrapping rather than the most aggressive token breaker", () => {
  const html = renderWithLocale(
    React.createElement(CoverCanvas, { state: LONG_CHINESE_TITLE }),
  );
  // Style is serialized before aria-label, so tie the wrap rule to the title
  // element by matching up to the attribute that names it.
  assert.match(html, /overflow-wrap:break-word[^"]*" aria-label="Cover title"/);
  assert.doesNotMatch(html, /overflow-wrap:anywhere[^"]*" aria-label="Cover title"/);
  assert.doesNotMatch(html, /white-space:nowrap[^"]*" aria-label="Cover title"/);
});

test("Poster and Wallpaper titles use natural wrapping before token breaking", () => {
  const poster = renderWithLocale(
    React.createElement(PosterCanvas, { state: LONG_TECH_TITLE_LINKS }),
  );
  assert.match(poster, /overflow-wrap:break-word[^"]*" aria-label="Poster title"/);
  assert.doesNotMatch(poster, /overflow-wrap:anywhere[^"]*" aria-label="Poster title"/);

  const wallpaper = renderWithLocale(
    React.createElement(WallpaperCanvas, {
      state: LONG_TECH_TITLE_LINKS,
      preset: WALLPAPER_PRESETS[0],
    }),
  );
  assert.match(wallpaper, /overflow-wrap:break-word[^"]*" aria-label="Wallpaper title"/);
  assert.doesNotMatch(wallpaper, /overflow-wrap:anywhere[^"]*" aria-label="Wallpaper title"/);
});

// ── 3. Long social values never break the fixed label/value rows ─────────────

test("SocialList caps value width and keeps fixed-size label chips (small)", () => {
  const html = renderToStaticMarkup(
    React.createElement(SocialList, {
      state: coverState({ socials: STRESS_SOCIALS }),
      size: "small",
    }),
  );
  // Value: bounded width + single-line ellipsis.
  assert.match(html, /max-width:240px/);
  assert.match(html, /text-overflow:ellipsis/);
  assert.match(html, /white-space:nowrap/);
  // Label chip: fixed size, clipped (never grows to fit a long custom label).
  assert.match(html, /width:76px/);
  assert.match(html, /overflow:hidden/);
});

test("SocialList caps value width at the large size", () => {
  const html = renderToStaticMarkup(
    React.createElement(SocialList, {
      state: coverState({ socials: STRESS_SOCIALS }),
      size: "large",
    }),
  );
  assert.match(html, /max-width:460px/);
  assert.match(html, /width:96px/);
});

test("SocialCard caps value width and keeps fixed-size label chips", () => {
  const html = renderToStaticMarkup(
    React.createElement(SocialCard, {
      S: (n: number) => n,
      socials: STRESS_SOCIALS,
      colors: DEFAULT_STATE.colors,
      fullWidth: true,
      t: (key: string) => key,
    }),
  );
  assert.match(html, /max-width:520px/);
  assert.match(html, /text-overflow:ellipsis/);
  assert.match(html, /width:132px/);
  assert.match(html, /overflow:hidden/);
});

// ── 4. Badge labels stay bounded ─────────────────────────────────────────────

test("BottomBar stack chips keep long package names inside the fixed slot", () => {
  const state: OverlayState = {
    ...DEFAULT_STATE,
    bottomBar: { ...DEFAULT_STATE.bottomBar, segments: [{ kind: "stack" }] },
    stack: { items: [LONG_STACK_ITEM] },
  };

  const small = renderWithLocale(
    React.createElement(BottomBarSegments, { state, size: "small" }),
  );
  assert.match(small, /max-width:160px/);
  assert.match(small, /text-overflow:ellipsis/);
  assert.match(small, /white-space:nowrap/);

  const large = renderWithLocale(
    React.createElement(BottomBarSegments, { state, size: "large" }),
  );
  assert.match(large, /max-width:220px/);
});

test("BadgeToolbar keeps long badge labels as bounded metadata", () => {
  const html = renderToStaticMarkup(
    React.createElement(BadgeToolbar, {
      badges: STRESS_BADGES,
      readonly: true,
      labelColor: "#ece3d6",
    }),
  );
  assert.match(html, /max-width:180px/);
  assert.match(html, /overflow:hidden/);
  assert.match(html, /text-overflow:ellipsis/);
  assert.match(html, /white-space:nowrap/);
});

// ── 5. No Phase-1/2 regressions leak back into the assets ────────────────────

test("broadcast canvases keep no glow shadows", () => {
  const state = coverState({ socials: STRESS_SOCIALS, badges: STRESS_BADGES });
  const markups = [
    renderWithLocale(React.createElement(CoverCanvas, { state })),
    renderWithLocale(React.createElement(PosterCanvas, { state })),
    renderWithLocale(React.createElement(OverlayCanvas, { state })),
    renderWithLocale(
      React.createElement(WallpaperCanvas, { state, preset: WALLPAPER_PRESETS[0] }),
    ),
  ];
  for (const html of markups) {
    // Outer glows = box-shadow with a 0 0 (no offset) blur. Decommissioned in
    // Phase 2 (cover badge 0 0 30px, focus rail 0 0 8px, camera live 0 0 4px).
    assert.doesNotMatch(html, /box-shadow:[^;"]*\b0 0 \d/);
    assert.doesNotMatch(html, /0 0 30px/);
  }
});

test("Overlay uses explicit broadcast line hierarchy", () => {
  const state: OverlayState = {
    ...coverState({ socials: STRESS_SOCIALS, badges: STRESS_BADGES }),
    sidebar: {
      ...DEFAULT_STATE.sidebar,
      socialVisible: true,
    },
  };
  const html = renderWithLocale(React.createElement(OverlayCanvas, { state }));
  const E = editorialPalette(state.colors);

  assert.match(html, new RegExp(`border:1px solid ${E.lineStrong}`));
  assert.match(html, new RegExp(`border-top:1px solid ${E.line}`));
  assert.match(html, new RegExp(`border-bottom:1px solid ${E.lineSoft}`));
  assert.match(html, new RegExp(`background:${E.activeRule}`));
});

test("social rows render as quiet metadata, not filled platform-color tags", () => {
  const socials: SocialConfig[] = [
    { visible: true, kind: "bilibili", label: "B站", value: "Aklman", customColor: "" },
    { visible: true, kind: "youtube", label: "YouTube", value: "@aklman", customColor: "" },
    { visible: true, kind: "discord", label: "Discord", value: "aklman", customColor: "" },
    { visible: true, kind: "wechat", label: "微信", value: "aklman1", customColor: "" },
  ];
  const list = renderToStaticMarkup(
    React.createElement(SocialList, { state: coverState({ socials }), size: "large" }),
  );
  const card = renderToStaticMarkup(
    React.createElement(SocialCard, {
      S: (n: number) => n,
      socials,
      colors: DEFAULT_STATE.colors,
      t: (key: string) => key,
    }),
  );
  for (const html of [list, card]) {
    assert.doesNotMatch(html, /#E62117/i); // bilibili red fill
    assert.doesNotMatch(html, /#FF0000/i); // youtube red fill
    assert.doesNotMatch(html, /#5865F2/i); // discord blurple fill
    assert.doesNotMatch(html, /#07C160/i); // wechat green fill
  }
});

test("long social URLs are compacted before visual truncation", () => {
  const html = renderToStaticMarkup(
    React.createElement(SocialList, {
      state: coverState({ socials: STRESS_SOCIALS }),
      size: "large",
    }),
  );

  assert.match(html, /youtube\.com\/@an-extremely/);
  assert.match(html, /coding-live/);
  assert.match(html, /…/);
  assert.match(html, /max-width:460px/);
  assert.match(html, /text-overflow:ellipsis/);
});
