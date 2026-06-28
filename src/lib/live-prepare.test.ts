import { deepStrictEqual, equal } from "node:assert/strict";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  buildObsOverlayUrl,
  prepareObsSceneConfig,
  prepareObsWebSocketConfig,
  type ObsSceneItem,
} from "./live-prepare";

function makeObsSceneConfig() {
  return {
    current_scene: "Vibe Live Overlay",
    sources: [
      {
        name: "Vibe Live Overlay",
        id: "scene",
        settings: {
          items: [
            { name: "Vibe Overlay Empty Frame", visible: false },
            { name: "Vibe Main Display Capture", visible: false },
            { name: "Vibe Camera Capture", visible: false },
            { name: "Vibe Overlay Avatar Frame", visible: true },
            { name: "Vibe Main App Capture", visible: true },
          ],
        },
      },
      {
        name: "Vibe Overlay Empty Frame",
        id: "browser_source",
        settings: {
          url: "http://localhost:3001/obs/overlay?camera=empty",
        },
      },
      {
        name: "Vibe Overlay Avatar Frame",
        id: "browser_source",
        settings: {
          url: "http://localhost:3001/obs/overlay?camera=avatar",
        },
      },
    ],
  };
}

test("buildObsOverlayUrl returns the OBS browser source URL for a camera mode", () => {
  equal(
    buildObsOverlayUrl(3000, "empty"),
    "http://localhost:3000/obs/overlay?camera=empty",
  );
  equal(
    buildObsOverlayUrl(3000, "avatar"),
    "http://localhost:3000/obs/overlay?camera=avatar",
  );
});

test("live prepare script fixes the OBS scene name and resolves branch collections safely", () => {
  const source = readFileSync(resolve("scripts/prepare-live.ts"), "utf8");

  assert.match(source, /const OBS_SCENE = "Vibe Live Overlay";/);
  assert.match(source, /const OBS_PROFILE_CANDIDATES = \[/);
  assert.match(source, /const OBS_SCENE_COLLECTION_CANDIDATES = \[/);
  assert.match(source, /"Vibe Live Overlay",\s+"Vibe Studio Overlay",\s+"Vibe Coding Live Overlay"/);
  assert.match(source, /function resolveObsSceneCollection/);
  assert.match(source, /source\.name === OBS_SCENE && source\.settings\?\.items/);
  assert.doesNotMatch(source, /const OBS_(?:PROFILE|SCENE_COLLECTION) = "Vibe Studio Overlay";/);
});

test("prepareObsSceneConfig updates overlay URLs and resets the live scene layering", () => {
  const { config, changes } = prepareObsSceneConfig(makeObsSceneConfig(), {
    port: 3000,
  });

  const emptySource = config.sources.find(
    (source) => source.name === "Vibe Overlay Empty Frame",
  );
  const avatarSource = config.sources.find(
    (source) => source.name === "Vibe Overlay Avatar Frame",
  );
  const scene = config.sources.find(
    (source) => source.name === "Vibe Live Overlay",
  );

  const sceneItems = scene?.settings.items as ObsSceneItem[] | undefined;
  assert(sceneItems);

  equal(
    emptySource?.settings.url,
    "http://localhost:3000/obs/overlay?camera=empty",
  );
  equal(
    avatarSource?.settings.url,
    "http://localhost:3000/obs/overlay?camera=avatar",
  );

  deepStrictEqual(
    sceneItems.map((item) => [item.name, item.visible]),
    [
      ["Vibe Main Display Capture", true],
      ["Vibe Main App Capture", true],
      ["Vibe Camera Capture", true],
      ["Vibe Overlay Avatar Frame", false],
      ["Vibe Overlay Empty Frame", true],
    ],
  );
  deepStrictEqual(changes, [
    "Set Vibe Overlay Empty Frame URL",
    "Set Vibe Overlay Avatar Frame URL",
    "Reset Vibe Live Overlay source order",
    "Set Vibe Main Display Capture to main screen frame",
    "Set Vibe Main App Capture to main screen frame",
    "Set Vibe Overlay Empty Frame visible",
    "Set Vibe Overlay Avatar Frame hidden",
    "Set Vibe Camera Capture visible",
    "Set Vibe Main Display Capture visible",
    "Set Vibe Main App Capture visible",
  ]);
});

test("prepareObsSceneConfig aligns main captures to a 16:9 screen frame", () => {
  const { config } = prepareObsSceneConfig(makeObsSceneConfig(), {
    port: 3000,
  });
  const scene = config.sources.find(
    (source) => source.name === "Vibe Live Overlay",
  );
  const sceneItems = scene?.settings.items as ObsSceneItem[] | undefined;
  assert(sceneItems);

  for (const sourceName of [
    "Vibe Main Display Capture",
    "Vibe Main App Capture",
  ]) {
    const item: ObsSceneItem | undefined = sceneItems.find(
      (candidate) => candidate.name === sourceName,
    );
    assert(item, sourceName);
    deepStrictEqual(item.pos, { x: 24, y: 24 });
    deepStrictEqual(item.bounds, { x: 1440, y: 810 });
    equal(item.bounds_type, 2);
    equal(item.bounds_crop, false);
    equal(item.align, 5);
    equal(item.bounds_align, 0);
  }
});

test("prepareObsWebSocketConfig enables automation without changing authentication", () => {
  const { config, changes } = prepareObsWebSocketConfig({
    alerts_enabled: true,
    auth_required: true,
    first_load: true,
    server_enabled: false,
    server_password: "secret",
    server_port: 4455,
  });

  deepStrictEqual(config, {
    alerts_enabled: false,
    auth_required: true,
    first_load: false,
    server_enabled: true,
    server_password: "secret",
    server_port: 4455,
  });
  deepStrictEqual(changes, [
    "Enable OBS WebSocket server",
    "Disable OBS WebSocket startup alerts",
    "Mark OBS WebSocket as initialized",
  ]);
});
