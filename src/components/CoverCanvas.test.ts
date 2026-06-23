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
  assert.doesNotMatch(html, /white-space:nowrap[^"]*" aria-label="Cover title"/);
  assert.match(html, /overflow-wrap:break-word[^"]*" aria-label="Cover title"/);
});
