import { MOBILE_LAYOUT, WORKBENCH_LAYOUT, type OverlayLayout } from "./overlay-layout";

export type ObsCameraMode = "empty" | "avatar";

export interface ObsSceneItem {
  name: string;
  visible?: boolean;
  [key: string]: unknown;
}

export interface ObsSourceSettings {
  url?: string;
  items?: ObsSceneItem[];
  [key: string]: unknown;
}

export interface ObsSource {
  name: string;
  id?: string;
  settings: ObsSourceSettings;
  [key: string]: unknown;
}

export interface ObsSceneConfig {
  current_scene?: string;
  sources: ObsSource[];
  [key: string]: unknown;
}

export interface ObsWebSocketConfig {
  alerts_enabled?: boolean;
  auth_required?: boolean;
  first_load?: boolean;
  server_enabled?: boolean;
  server_password?: string;
  server_port?: number;
  [key: string]: unknown;
}

export interface PrepareObsSceneOptions {
  port: number;
  sceneName?: string;
  /** Scene geometry + canvas; the 16:9 workbench scene by default. */
  layout?: OverlayLayout;
}

interface PrepareObsSceneResult {
  config: ObsSceneConfig;
  changes: string[];
}

interface PrepareObsWebSocketConfigResult {
  config: ObsWebSocketConfig;
  changes: string[];
}

// Single registry of OBS scene/source names and slot geometry. The prepare
// script (offline scene-JSON edit) and the runtime composition route
// (obs-websocket) must agree on these; AGENTS.md documents the name contract.
export const DEFAULT_SCENE_NAME = "Vibe Live Overlay";
export const EMPTY_FRAME_SOURCE = "Vibe Overlay Empty Frame";
export const AVATAR_FRAME_SOURCE = "Vibe Overlay Avatar Frame";
export const CAMERA_SOURCE = "Vibe Camera Capture";
export const MAIN_DISPLAY_SOURCE = "Vibe Main Display Capture";
export const MAIN_APP_SOURCE = "Vibe Main App Capture";
/** Optional display capture of a second monitor. Created manually in OBS once
 * (macOS Screen Capture named exactly this, pointed at display 2); prepare and
 * the composition route tolerate its absence. */
export const SECOND_SCREEN_SOURCE = "Vibe Second Screen Capture";
/** The portrait (1080×1920) OBS profile + scene collection pair. Both are
 * DERIVED from the landscape ones by live:prepare --layout mobile, so the
 * source and scene names stay identical — the runtime composition contract
 * (obs-composition.ts) works unchanged against either collection. */
export const VERTICAL_PROFILE_NAME = "Vibe Vertical";
export const VERTICAL_SCENE_COLLECTION = "Vibe Vertical";

export const DEFAULT_SCENE_ORDER = [
  MAIN_DISPLAY_SOURCE,
  MAIN_APP_SOURCE,
  CAMERA_SOURCE,
  SECOND_SCREEN_SOURCE,
  AVATAR_FRAME_SOURCE,
  EMPTY_FRAME_SOURCE,
] as const;
// Geometry has a single source of truth in overlay-layout.ts. Prepare writes the
// chosen layout's rects into the offline scene collection; the live
// obs-websocket path (obs-composition.ts) reads the same rects.
export const OBS_BOUNDS_SCALE_INNER = 2;
export const OBS_BOUNDS_SCALE_OUTER = 3;
// OBS alignment bitmask: LEFT(1) | TOP(4) — positions are top-left anchored.
export const OBS_ALIGN_TOP_LEFT = 5;
export const OBS_BOUNDS_ALIGN_CENTER = 0;

export function buildObsOverlayUrl(
  port: number,
  cameraMode: ObsCameraMode,
): string {
  return `http://localhost:${port}/obs/overlay?camera=${cameraMode}`;
}

export function prepareObsSceneConfig(
  input: ObsSceneConfig,
  options: PrepareObsSceneOptions,
): PrepareObsSceneResult {
  const sceneName = options.sceneName ?? DEFAULT_SCENE_NAME;
  const layout = options.layout ?? WORKBENCH_LAYOUT;
  const mainFrame = layout.regions.main;
  const cameraFrame = layout.regions.camera ?? null;
  const config = structuredClone(input) as ObsSceneConfig;
  const changes: string[] = [];

  const emptyFrame = findSource(config, EMPTY_FRAME_SOURCE);
  const avatarFrame = findSource(config, AVATAR_FRAME_SOURCE);
  const scene = findSource(config, sceneName);

  emptyFrame.settings.url = buildObsOverlayUrl(options.port, "empty");
  changes.push(`Set ${EMPTY_FRAME_SOURCE} URL`);

  avatarFrame.settings.url = buildObsOverlayUrl(options.port, "avatar");
  changes.push(`Set ${AVATAR_FRAME_SOURCE} URL`);

  // Browser sources render at the layout's canvas — /obs/overlay draws a
  // portrait page once the Studio's scene layout is mobile, so the source
  // viewport must match (1920×1080 landscape, 1080×1920 portrait).
  for (const frame of [emptyFrame, avatarFrame]) {
    frame.settings.width = layout.canvas.width;
    frame.settings.height = layout.canvas.height;
  }
  changes.push(`Set overlay frames to ${layout.canvas.width}x${layout.canvas.height}`);

  const items = scene.settings.items;
  if (!items) {
    throw new Error(`OBS scene "${sceneName}" has no scene items.`);
  }

  scene.settings.items = orderSceneItems(items, DEFAULT_SCENE_ORDER);
  changes.push(`Reset ${sceneName} source order`);

  setMainScreenFrame(scene.settings.items, MAIN_DISPLAY_SOURCE, mainFrame, changes);
  setMainScreenFrame(scene.settings.items, MAIN_APP_SOURCE, mainFrame, changes);
  setSceneItemVisibility(scene.settings.items, EMPTY_FRAME_SOURCE, true, changes);
  setSceneItemVisibility(scene.settings.items, AVATAR_FRAME_SOURCE, false, changes);
  setSceneItemVisibility(scene.settings.items, CAMERA_SOURCE, true, changes);
  setSceneItemVisibility(scene.settings.items, MAIN_DISPLAY_SOURCE, true, changes);
  setSceneItemVisibility(scene.settings.items, MAIN_APP_SOURCE, true, changes);

  // The camera's transform in the LANDSCAPE scene is the user's own manual
  // placement — prepare never touches it there. A derived portrait scene has
  // no hand-placed history, so the camera parks into the layout's camera slot.
  if (cameraFrame && layout.id !== WORKBENCH_LAYOUT.id) {
    setCameraSlotFrame(scene.settings.items, CAMERA_SOURCE, cameraFrame, changes);
  }

  // The second-screen capture is optional (created manually in OBS). When
  // present, park it in the camera slot and keep it hidden — the runtime
  // composition route then only toggles visibility, never re-derives geometry.
  if (
    cameraFrame &&
    scene.settings.items.some((item) => item.name === SECOND_SCREEN_SOURCE)
  ) {
    setCameraSlotFrame(scene.settings.items, SECOND_SCREEN_SOURCE, cameraFrame, changes);
    setSceneItemVisibility(scene.settings.items, SECOND_SCREEN_SOURCE, false, changes);
  }

  return { config, changes };
}

/**
 * Derive the portrait scene collection from the (already working) landscape
 * one: same sources, same scene name, same source-name contract — only the
 * collection name, the canvas resolution, the browser-source viewports and
 * the item geometry change. The input is never mutated.
 */
export function deriveVerticalSceneConfig(
  landscape: ObsSceneConfig,
  options: { port: number; sceneName?: string },
): PrepareObsSceneResult {
  const { config, changes } = prepareObsSceneConfig(landscape, {
    port: options.port,
    sceneName: options.sceneName,
    layout: MOBILE_LAYOUT,
  });

  config.name = VERTICAL_SCENE_COLLECTION;
  changes.push(`Set collection name to ${VERTICAL_SCENE_COLLECTION}`);
  if (toRecordValue(config.resolution)) {
    config.resolution = { x: MOBILE_LAYOUT.canvas.width, y: MOBILE_LAYOUT.canvas.height };
    changes.push(
      `Set collection resolution to ${MOBILE_LAYOUT.canvas.width}x${MOBILE_LAYOUT.canvas.height}`,
    );
  }

  return { config, changes };
}

/**
 * Derive the portrait profile's basic.ini from the landscape profile: rename
 * it and swap the base + output canvas to 1080×1920. Every other line (stream
 * service, encoder, audio) carries over unchanged.
 */
export function deriveVerticalProfileIni(landscapeIni: string): {
  ini: string;
  changes: string[];
} {
  const changes: string[] = [];
  const canvas = MOBILE_LAYOUT.canvas;
  const replacements: Record<string, string> = {
    BaseCX: String(canvas.width),
    BaseCY: String(canvas.height),
    OutputCX: String(canvas.width),
    OutputCY: String(canvas.height),
  };

  let section = "";
  const lines = landscapeIni.split("\n").map((line) => {
    const sectionMatch = line.match(/^\[(.+)\]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      return line;
    }
    const kv = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!kv) return line;
    const [, key] = kv;
    if (section === "General" && key === "Name") {
      changes.push(`Set profile name to ${VERTICAL_PROFILE_NAME}`);
      return `Name=${VERTICAL_PROFILE_NAME}`;
    }
    if (section === "Video" && key in replacements) {
      changes.push(`Set ${key}=${replacements[key]}`);
      return `${key}=${replacements[key]}`;
    }
    return line;
  });

  return { ini: lines.join("\n"), changes };
}

function toRecordValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export function prepareObsWebSocketConfig(
  input: ObsWebSocketConfig,
): PrepareObsWebSocketConfigResult {
  const config = structuredClone(input) as ObsWebSocketConfig;
  const changes: string[] = [];

  if (config.server_enabled !== true) {
    config.server_enabled = true;
    changes.push("Enable OBS WebSocket server");
  }
  if (config.alerts_enabled !== false) {
    config.alerts_enabled = false;
    changes.push("Disable OBS WebSocket startup alerts");
  }
  if (config.first_load !== false) {
    config.first_load = false;
    changes.push("Mark OBS WebSocket as initialized");
  }

  return { config, changes };
}

function findSource(config: ObsSceneConfig, sourceName: string): ObsSource {
  const source = config.sources.find((candidate) => candidate.name === sourceName);
  if (!source) {
    throw new Error(`OBS source "${sourceName}" was not found.`);
  }
  return source;
}

function orderSceneItems(
  items: ObsSceneItem[],
  preferredOrder: readonly string[],
): ObsSceneItem[] {
  const preferredNames = new Set(preferredOrder);
  const byName = new Map(items.map((item) => [item.name, item]));
  const unknownItems = items.filter((item) => !preferredNames.has(item.name));
  const orderedItems = preferredOrder
    .map((name) => byName.get(name))
    .filter((item): item is ObsSceneItem => Boolean(item));

  return [...unknownItems, ...orderedItems];
}

function setSceneItemVisibility(
  items: ObsSceneItem[],
  sourceName: string,
  visible: boolean,
  changes: string[],
): void {
  const item = items.find((candidate) => candidate.name === sourceName);
  if (!item) {
    throw new Error(`OBS scene item "${sourceName}" was not found.`);
  }

  item.visible = visible;
  changes.push(`Set ${sourceName} ${visible ? "visible" : "hidden"}`);
}

function setMainScreenFrame(
  items: ObsSceneItem[],
  sourceName: string,
  frame: { left: number; top: number; width: number; height: number },
  changes: string[],
): void {
  const item = items.find((candidate) => candidate.name === sourceName);
  if (!item) {
    throw new Error(`OBS scene item "${sourceName}" was not found.`);
  }

  item.pos = { x: frame.left, y: frame.top };
  item.bounds = { x: frame.width, y: frame.height };
  item.bounds_type = OBS_BOUNDS_SCALE_INNER;
  item.bounds_crop = false;
  item.bounds_align = OBS_BOUNDS_ALIGN_CENTER;
  item.align = OBS_ALIGN_TOP_LEFT;
  item.rot = 0;
  item.scale = { x: 1, y: 1 };
  item.crop_left = 0;
  item.crop_top = 0;
  item.crop_right = 0;
  item.crop_bottom = 0;
  changes.push(`Set ${sourceName} to main screen frame`);
}

// Park a capture in the camera cutout: fill the slot (SCALE_OUTER) and crop
// the overflow to the bounds, so a capture reads as a clean window inside the
// overlay's camera chrome.
function setCameraSlotFrame(
  items: ObsSceneItem[],
  sourceName: string,
  frame: { left: number; top: number; width: number; height: number },
  changes: string[],
): void {
  const item = items.find((candidate) => candidate.name === sourceName);
  if (!item) {
    throw new Error(`OBS scene item "${sourceName}" was not found.`);
  }

  item.pos = { x: frame.left, y: frame.top };
  item.bounds = { x: frame.width, y: frame.height };
  item.bounds_type = OBS_BOUNDS_SCALE_OUTER;
  item.bounds_crop = true;
  item.bounds_align = OBS_BOUNDS_ALIGN_CENTER;
  item.align = OBS_ALIGN_TOP_LEFT;
  item.rot = 0;
  item.scale = { x: 1, y: 1 };
  item.crop_left = 0;
  item.crop_top = 0;
  item.crop_right = 0;
  item.crop_bottom = 0;
  changes.push(`Set ${sourceName} to camera slot frame`);
}
