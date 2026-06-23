import assert from "node:assert/strict";
import test from "node:test";

import { DARK_PRESET, LIGHT_PRESET } from "../../lib/theme";
import { editorialPalette } from "./editorial-palette";

function alphaFromHex(hex: string): number {
  const alpha = hex.slice(7, 9);
  assert.match(alpha, /^[0-9a-f]{2}$/i);
  return Number.parseInt(alpha, 16);
}

test("editorial palette exposes clear line hierarchy in dark and light", () => {
  for (const colors of [DARK_PRESET, LIGHT_PRESET]) {
    const palette = editorialPalette(colors);

    assert.equal(palette.lineStrong.startsWith(colors.borderColor), true);
    assert.equal(palette.line.startsWith(colors.borderColor), true);
    assert.equal(palette.lineSoft.startsWith(colors.borderColor), true);
    assert.equal(palette.activeRule, colors.pinkAccent);
    assert.ok(alphaFromHex(palette.lineStrong) > alphaFromHex(palette.line));
    assert.ok(alphaFromHex(palette.line) > alphaFromHex(palette.lineSoft));
  }
});

test("editorial palette wraps the legacy accent fields as semantic marks", () => {
  for (const colors of [DARK_PRESET, LIGHT_PRESET]) {
    const palette = editorialPalette(colors);

    // The persisted (legacy neon-era) fields are exposed under intent-revealing
    // names so render code never reads cyan/pink/warm directly.
    assert.equal(palette.primaryMark, colors.pinkAccent);
    assert.equal(palette.supportMark, colors.cyanAccent);
    assert.equal(palette.amberMark, colors.warmAccent);

    // accent / activeRule stay aliases of the primary mark.
    assert.equal(palette.accent, palette.primaryMark);
    assert.equal(palette.activeRule, palette.primaryMark);
  }
});
