import { deepStrictEqual, equal } from "node:assert/strict";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  buildObsOverlayUrl,
  deriveVerticalProfileIni,
  deriveVerticalSceneConfig,
  prepareObsSceneConfig,
  prepareObsWebSocketConfig,
  VERTICAL_PROFILE_NAME,
  VERTICAL_SCENE_COLLECTION,
  type ObsSceneItem,
} from "./live-prepare";
import { MOBILE_LAYOUT } from "./overlay-layout";

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
    "Set overlay frames to 1920x1080",
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

test("prepareObsSceneConfig parks an optional second-screen capture in the camera slot", () => {
  // Absent: tolerated silently — the fixture scene has no second-screen item.
  const withoutSecond = prepareObsSceneConfig(makeObsSceneConfig(), { port: 3000 });
  assert(
    !withoutSecond.changes.some((change) => change.includes("Vibe Second Screen Capture")),
    "absence should not produce changes",
  );

  // Present: positioned at the camera slot (fill + crop-to-bounds), hidden by default.
  const input = makeObsSceneConfig();
  const items = input.sources[0].settings.items as ObsSceneItem[];
  items.push({ name: "Vibe Second Screen Capture", visible: true });

  const { config, changes } = prepareObsSceneConfig(input, { port: 3000 });
  const scene = config.sources.find((source) => source.name === "Vibe Live Overlay");
  const sceneItems = scene?.settings.items as ObsSceneItem[] | undefined;
  assert(sceneItems);

  const second = sceneItems.find((item) => item.name === "Vibe Second Screen Capture");
  assert(second);
  equal(second.visible, false);
  deepStrictEqual(second.pos, { x: 1498, y: 786 });
  deepStrictEqual(second.bounds, { x: 400, y: 272 });
  equal(second.bounds_type, 3); // SCALE_OUTER — fill the slot
  equal(second.bounds_crop, true); // crop the 16:9 overflow to the slot
  assert(changes.includes("Set Vibe Second Screen Capture to camera slot frame"));
  assert(changes.includes("Set Vibe Second Screen Capture hidden"));

  // Ordered between the camera capture and the overlay frames.
  deepStrictEqual(
    sceneItems.map((item) => item.name),
    [
      "Vibe Main Display Capture",
      "Vibe Main App Capture",
      "Vibe Camera Capture",
      "Vibe Second Screen Capture",
      "Vibe Overlay Avatar Frame",
      "Vibe Overlay Empty Frame",
    ],
  );
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

test("prepareObsSceneConfig with the mobile layout writes portrait geometry", () => {
  const { config } = prepareObsSceneConfig(makeObsSceneConfig(), {
    port: 3000,
    layout: MOBILE_LAYOUT,
  });

  const browser = config.sources.find((s) => s.name === "Vibe Overlay Empty Frame");
  equal(browser?.settings.width, 1080);
  equal(browser?.settings.height, 1920);

  const items = config.sources.find((s) => s.name === "Vibe Live Overlay")?.settings
    .items as ObsSceneItem[];
  const main = items.find((item) => item.name === "Vibe Main Display Capture");
  deepStrictEqual(main?.pos, {
    x: MOBILE_LAYOUT.regions.main.left,
    y: MOBILE_LAYOUT.regions.main.top,
  });
  deepStrictEqual(main?.bounds, {
    x: MOBILE_LAYOUT.regions.main.width,
    y: MOBILE_LAYOUT.regions.main.height,
  });

  // A derived portrait scene has no hand-placed camera history — the camera
  // parks into the mobile camera slot (landscape prepare never moves it).
  const camera = items.find((item) => item.name === "Vibe Camera Capture");
  deepStrictEqual(camera?.pos, {
    x: MOBILE_LAYOUT.regions.camera!.left,
    y: MOBILE_LAYOUT.regions.camera!.top,
  });
  equal(camera?.visible, true);
});

test("the landscape prepare leaves the hand-placed camera transform alone", () => {
  const input = makeObsSceneConfig();
  const items = input.sources.find((s) => s.name === "Vibe Live Overlay")!.settings
    .items as ObsSceneItem[];
  const camera = items.find((item) => item.name === "Vibe Camera Capture")!;
  camera.pos = { x: 123, y: 456 };

  const { config } = prepareObsSceneConfig(input, { port: 3000 });
  const outItems = config.sources.find((s) => s.name === "Vibe Live Overlay")!.settings
    .items as ObsSceneItem[];
  const outCamera = outItems.find((item) => item.name === "Vibe Camera Capture")!;
  deepStrictEqual(outCamera.pos, { x: 123, y: 456 });
});

test("deriveVerticalSceneConfig renames the collection and keeps the input pristine", () => {
  const landscape = {
    ...makeObsSceneConfig(),
    name: "Vibe Coding Live Overlay",
    resolution: { x: 1920, y: 1080 },
  };
  const before = JSON.stringify(landscape);

  const { config, changes } = deriveVerticalSceneConfig(landscape, { port: 3000 });

  equal(config.name, VERTICAL_SCENE_COLLECTION);
  deepStrictEqual(config.resolution, { x: 1080, y: 1920 });
  // The scene + source names are the contract the runtime composition relies
  // on — the derived collection keeps them identical.
  equal(config.current_scene, "Vibe Live Overlay");
  const items = config.sources.find((s) => s.name === "Vibe Live Overlay")?.settings
    .items as ObsSceneItem[];
  equal(items.some((item) => item.name === "Vibe Camera Capture"), true);
  equal(changes.some((c) => c.includes("1080x1920")), true);
  // Derivation never mutates the landscape input.
  equal(JSON.stringify(landscape), before);
});

test("deriveVerticalProfileIni swaps the canvas and name, nothing else", () => {
  const landscapeIni = [
    "[General]",
    "Name=Vibe Coding Live Overlay",
    "",
    "[Stream1]",
    "IgnoreRecommended=false",
    "",
    "[Video]",
    "BaseCX=1920",
    "BaseCY=1080",
    "OutputCX=1920",
    "OutputCY=1080",
    "FPSType=0",
    "",
    "[Audio]",
    "SampleRate=48000",
  ].join("\n");

  const { ini, changes } = deriveVerticalProfileIni(landscapeIni);

  const lines = ini.split("\n");
  equal(lines.includes(`Name=${VERTICAL_PROFILE_NAME}`), true);
  equal(lines.includes("BaseCX=1080"), true);
  equal(lines.includes("BaseCY=1920"), true);
  equal(lines.includes("OutputCX=1080"), true);
  equal(lines.includes("OutputCY=1920"), true);
  // Untouched sections carry over verbatim.
  equal(lines.includes("IgnoreRecommended=false"), true);
  equal(lines.includes("SampleRate=48000"), true);
  equal(lines.includes("FPSType=0"), true);
  equal(changes.length, 5);
});
