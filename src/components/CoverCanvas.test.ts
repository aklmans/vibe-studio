import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CoverCanvas from "./CoverCanvas";
import { DEFAULT_STATE } from "../types";

test("CoverCanvas renders a theme-aware typographic surface, not the photo template", () => {
  // The legacy Bilibili photo still ships as a possible future preset…
  assert.equal(existsSync("public/cover-bg.png"), true);

  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.match(html, /width:1280px/);
  assert.match(html, /height:720px/);
  // …but the default cover is now driven by editorialPalette(state.colors):
  // background = bgDark, no photo background div.
  assert.match(html, /background:#1a1a1a/);
  assert.doesNotMatch(html, /cover-bg\.png/);
});

test("CoverCanvas avoids boxed blur overlays in exported cover art", () => {
  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.doesNotMatch(html, /filter:blur\(2px\)/);
  assert.doesNotMatch(html, /backdrop-filter:blur/);
  assert.doesNotMatch(html, /text-shadow:/);
});

test("CoverCanvas renders an editorial typographic stack", () => {
  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.doesNotMatch(html, /aria-label="Cover category"/);
  assert.match(html, /data-testid="cover-title-stage"/);
  // Mono eyebrow + upright serif title from the theme-aware typographic stack;
  // the title wraps within the fixed canvas bounds instead of forcing one line.
  assert.match(html, /aria-label="Cover eyebrow"/);
  assert.match(html, /font-family:ui-serif[^"]*" aria-label="Cover title"/);
  assert.doesNotMatch(
    html,
    /white-space:nowrap[^"]*" aria-label="Cover title"/,
  );
  assert.match(html, /overflow-wrap:break-word[^"]*" aria-label="Cover title"/);
});


const coverWithVisual = (visual: "avatar" | "scene" | "title", patch = {}) =>
  renderToStaticMarkup(
    React.createElement(CoverCanvas, {
      state: {
        ...DEFAULT_STATE,
        cover: { ...DEFAULT_STATE.cover, visual, ...patch },
      },
    }),
  );

test("CoverCanvas defaults to the avatar type and renders avatar.png", () => {
  // DEFAULT_STATE.cover.visual === "avatar".
  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.match(html, /data-testid="cover-portrait-image"/);
  assert.match(html, /src="\/avatar\.png"/);
  assert.match(html, /object-fit:cover/);
  assert.doesNotMatch(html, /data-testid="cover-scene-image"/);
  assert.doesNotMatch(html, /vibe-studio-bg\.png/);
});

test("CoverCanvas (scene type) renders the studio subject as a background layer", () => {
  const html = coverWithVisual("scene");

  assert.match(html, /data-testid="cover-scene-image"/);
  assert.match(html, /src="\/vibe-studio-bg\.png"/);
  assert.match(html, /object-fit:contain/);
  assert.match(html, /position:absolute/);
  // Oversized + anchored low-left so the figure + desk bleed off the corner.
  assert.match(html, /left:-140px/);
  assert.match(html, /bottom:-200px/);
  assert.match(html, /width:1560px/);
  assert.match(html, /height:880px/);
  assert.match(html, /pointer-events:none/);
  // Not the avatar/title layers.
  assert.doesNotMatch(html, /data-testid="cover-portrait-image"/);
});

test("CoverCanvas (avatar type) renders a portrait panel from portraitUrl, not the scene", () => {
  const html = coverWithVisual("avatar", { portraitUrl: "/avatar.png" });

  assert.match(html, /data-testid="cover-identity-lockup"[^>]*max-width:996px/);
  assert.match(html, /data-testid="cover-portrait-image"/);
  assert.match(html, /src="\/avatar\.png"/);
  assert.match(html, /alt=""/);
  // A full-bleed photo panel: object-fit cover, no circular avatar card.
  assert.match(html, /object-fit:cover/);
  assert.doesNotMatch(html, /border-radius:50%/);
  // The scene layer is absent in avatar mode.
  assert.doesNotMatch(html, /data-testid="cover-scene-image"/);
  assert.doesNotMatch(html, /vibe-studio-bg\.png/);
});

test("CoverCanvas (avatar type) keeps a replaced portrait image working", () => {
  const html = coverWithVisual("avatar", {
    portraitUrl: "data:image/png;base64,AAAA",
  });
  assert.match(html, /src="data:image\/png;base64,AAAA"/);
  assert.doesNotMatch(html, /src="\/avatar\.png"/);
});

test("CoverCanvas falls back to visual defaults when cover image URLs are cleared", () => {
  const avatar = coverWithVisual("avatar", { portraitUrl: "" });
  assert.match(avatar, /src="\/avatar\.png"/);

  const scene = coverWithVisual("scene", { sceneUrl: "" });
  assert.match(scene, /src="\/vibe-studio-bg\.png"/);
});

test("CoverCanvas (title type) renders no subject image at all", () => {
  const html = coverWithVisual("title");

  // Pure typographic cover — every image layer is unmounted, not just hidden.
  assert.doesNotMatch(html, /data-testid="cover-scene-image"/);
  assert.doesNotMatch(html, /data-testid="cover-portrait-image"/);
  assert.doesNotMatch(html, /vibe-studio-bg\.png/);
  assert.doesNotMatch(html, /\/avatar\.jpg/);
  // …but the editorial title stack is still present.
  assert.match(html, /data-testid="cover-title-stage"/);
  assert.match(html, /data-testid="cover-identity-lockup"/);
});
