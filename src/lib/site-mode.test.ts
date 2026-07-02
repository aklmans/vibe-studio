import assert from "node:assert/strict";
import test from "node:test";
import { getSiteMode, isShowcase } from "./site-mode";

test("getSiteMode defaults to app when the flag is unset", () => {
  assert.equal(getSiteMode({}), "app");
  assert.equal(isShowcase({}), false);
});

test("getSiteMode treats 1/true (any case, trimmed) as showcase", () => {
  for (const value of ["1", "true", "TRUE", "True", "  true  ", " 1 "]) {
    assert.equal(getSiteMode({ VIBE_SHOWCASE: value }), "showcase", value);
    assert.equal(isShowcase({ VIBE_SHOWCASE: value }), true, value);
  }
});

test("getSiteMode stays app for empty or non-affirmative values", () => {
  for (const value of ["", "0", "false", "off", "no", "yes", "app", "showcase"]) {
    assert.equal(getSiteMode({ VIBE_SHOWCASE: value }), "app", value);
    assert.equal(isShowcase({ VIBE_SHOWCASE: value }), false, value);
  }
});
