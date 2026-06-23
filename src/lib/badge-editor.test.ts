import assert from "node:assert/strict";
import test from "node:test";
import type { BadgeConfig } from "./badges";
import {
  BADGE_PRESETS,
  addBadgePreset,
  moveVisibleBadge,
} from "./badge-editor";

const badges: BadgeConfig[] = [
  { visible: true, iconKey: "claude", iconMode: "brand", label: "Claude", customIconUrl: "" },
  { visible: false, iconKey: "gemini", iconMode: "brand", label: "Gemini", customIconUrl: "" },
  { visible: true, iconKey: "codex", iconMode: "brand", label: "Codex", customIconUrl: "" },
  { visible: true, iconKey: "kimi", iconMode: "brand", label: "Kimi", customIconUrl: "" },
];

test("moveVisibleBadge reorders visible badges while preserving hidden legacy rows", () => {
  const movedUp = moveVisibleBadge(badges, 1, -1);
  assert.deepEqual(
    movedUp.map((badge) => badge.iconKey),
    ["codex", "gemini", "claude", "kimi"],
  );

  const movedDown = moveVisibleBadge(badges, 1, 1);
  assert.deepEqual(
    movedDown.map((badge) => badge.iconKey),
    ["claude", "gemini", "kimi", "codex"],
  );
});

test("moveVisibleBadge ignores out-of-range moves", () => {
  assert.deepEqual(moveVisibleBadge(badges, 0, -1), badges);
  assert.deepEqual(moveVisibleBadge(badges, 2, 1), badges);
});

test("addBadgePreset appends only missing visible icons", () => {
  const preset = BADGE_PRESETS.find((item) => item.id === "claude-codex");
  assert.ok(preset);

  const next = addBadgePreset(badges, preset.keys);
  assert.deepEqual(
    next.map((badge) => badge.iconKey),
    ["claude", "gemini", "codex", "kimi"],
  );

  const withMissing = addBadgePreset(badges, ["claude", "chatgpt", "kimi"]);
  assert.deepEqual(
    withMissing.map((badge) => badge.iconKey),
    ["claude", "gemini", "codex", "kimi", "chatgpt"],
  );
  assert.equal(withMissing.at(-1)?.visible, true);
  assert.equal(withMissing.at(-1)?.iconMode, "brand");
});
