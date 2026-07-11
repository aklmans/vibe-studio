import assert from "node:assert/strict";
import test from "node:test";
import { exportFileName, slugifyTitle } from "./export-filename";

test("slugifyTitle keeps CJK, strips hostile characters, falls back when empty", () => {
  assert.equal(slugifyTitle("Rust from Scratch"), "rust-from-scratch");
  assert.equal(slugifyTitle("从零写一个博客引擎"), "从零写一个博客引擎");
  assert.equal(slugifyTitle('a/b\\c:d*e?"f<g>h|i'), "a-b-c-d-e-f-g-h-i");
  assert.equal(slugifyTitle("  "), "vibe-live");
  assert.equal(slugifyTitle("!!!"), "vibe-live");
  assert.ok(slugifyTitle("x".repeat(200)).length <= 60);
});

test("exportFileName composes slug + surface + date (review P2-11)", () => {
  const date = new Date(2026, 6, 10); // 2026-07-10 local
  assert.equal(
    exportFileName("Rust from Scratch", "cover", date),
    "rust-from-scratch-cover-2026-07-10.png",
  );
  assert.equal(exportFileName("", "overlay", date), "vibe-live-overlay-2026-07-10.png");
});
