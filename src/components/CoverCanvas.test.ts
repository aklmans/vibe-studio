import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CoverCanvas from "./CoverCanvas";
import { DEFAULT_STATE } from "../types";

test("CoverCanvas uses the Bilibili cover background asset", () => {
  assert.equal(existsSync("public/cover-bg.png"), true);

  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.match(html, /\/cover-bg\.png/);
  assert.match(html, /width:1280px/);
  assert.match(html, /height:720px/);
});

test("CoverCanvas avoids boxed blur overlays in exported cover art", () => {
  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.doesNotMatch(html, /filter:blur\(2px\)/);
  assert.doesNotMatch(html, /backdrop-filter:blur/);
  assert.doesNotMatch(html, /text-shadow:/);
});

test("CoverCanvas centers cover copy in the right-side title safe area", () => {
  const html = renderToStaticMarkup(
    React.createElement(CoverCanvas, { state: DEFAULT_STATE }),
  );

  assert.doesNotMatch(html, /aria-label="Cover category"/);
  assert.match(
    html,
    /data-testid="cover-title-stage" style="position:absolute;top:178px;left:460px;width:650px/,
  );
  // Editorial cover title: upright serif display copy that can wrap inside the
  // fixed title safe area instead of overflowing as a forced single line.
  assert.match(html, /font-family:ui-serif/);
  assert.match(html, /font-size:58px/);
  assert.doesNotMatch(html, /white-space:nowrap[^"]*" aria-label="Cover title"/);
  assert.match(html, /overflow-wrap:break-word[^"]*" aria-label="Cover title"/);
});
