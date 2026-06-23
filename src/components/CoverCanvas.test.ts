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


test("CoverCanvas uses the default studio subject image as a background subject layer", () => {
  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.match(html, /data-testid="cover-avatar-image"/);
  assert.match(html, /src="\/vibe-studio-bg\.png"/);
  assert.match(html, /object-fit:contain/);
  assert.match(html, /position:absolute/);
  // The subject is anchored low-left and oversized so it reads as a cropped
  // studio scene (figure + desk bleeding off the bottom-left), not a centered,
  // fully-contained illustration with an empty box above it.
  assert.match(html, /left:-140px/);
  assert.match(html, /bottom:-200px/);
  assert.match(html, /width:1560px/);
  assert.match(html, /height:880px/);
  assert.match(html, /pointer-events:none/);
  assert.doesNotMatch(html, /src="\/avatar\.jpg"/);
});

test("CoverCanvas respects the shared avatar visibility toggle", () => {
  const visibleHtml = renderToStaticMarkup(
    React.createElement(CoverCanvas, {
      state: {
        ...DEFAULT_STATE,
        cover: {
          ...DEFAULT_STATE.cover,
          avatarVisible: true,
          avatarUrl: "/avatar-visible.jpg",
        },
      },
    }),
  );
  assert.match(visibleHtml, /data-testid="cover-identity-lockup"/);
  assert.match(visibleHtml, /data-testid="cover-avatar-lockup"/);
  assert.match(visibleHtml, /data-testid="cover-avatar-image"/);
  assert.match(visibleHtml, /src="\/avatar-visible\.jpg"/);
  assert.match(visibleHtml, /alt=""/);
  assert.match(visibleHtml, /object-fit:contain/);
  assert.match(visibleHtml, /position:absolute/);
  assert.doesNotMatch(visibleHtml, /right:112px/);
  assert.doesNotMatch(visibleHtml, /border-radius:50%/);

  const hiddenHtml = renderToStaticMarkup(
    React.createElement(CoverCanvas, {
      state: {
        ...DEFAULT_STATE,
        cover: {
          ...DEFAULT_STATE.cover,
          avatarVisible: false,
          avatarUrl: "/avatar-hidden.jpg",
        },
      },
    }),
  );
  assert.doesNotMatch(hiddenHtml, /avatar-hidden\.jpg/);
});
