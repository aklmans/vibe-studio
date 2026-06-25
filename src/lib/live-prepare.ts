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
}

interface PrepareObsSceneResult {
  config: ObsSceneConfig;
  changes: string[];
}

interface PrepareObsWebSocketConfigResult {
  config: ObsWebSocketConfig;
  changes: string[];
}

const DEFAULT_SCENE_NAME = "Vibe Live Overlay";
const EMPTY_FRAME_SOURCE = "Vibe Overlay Empty Frame";
const AVATAR_FRAME_SOURCE = "Vibe Overlay Avatar Frame";
const CAMERA_SOURCE = "Vibe Camera Capture";
const MAIN_DISPLAY_SOURCE = "Vibe Main Display Capture";
const MAIN_APP_SOURCE = "Vibe Main App Capture";

const DEFAULT_SCENE_ORDER = [
  MAIN_DISPLAY_SOURCE,
  MAIN_APP_SOURCE,
  CAMERA_SOURCE,
  AVATAR_FRAME_SOURCE,
  EMPTY_FRAME_SOURCE,
] as const;
const MAIN_SCREEN_FRAME = {
  left: 24,
  top: 24,
  width: 1440,
  height: 810,
} as const;
const OBS_BOUNDS_SCALE_INNER = 2;
const OBS_ALIGN_CENTER = 5;
const OBS_BOUNDS_ALIGN_CENTER = 0;

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
  const config = structuredClone(input) as ObsSceneConfig;
  const changes: string[] = [];

  const emptyFrame = findSource(config, EMPTY_FRAME_SOURCE);
  const avatarFrame = findSource(config, AVATAR_FRAME_SOURCE);
  const scene = findSource(config, sceneName);

  emptyFrame.settings.url = buildObsOverlayUrl(options.port, "empty");
  changes.push(`Set ${EMPTY_FRAME_SOURCE} URL`);

  avatarFrame.settings.url = buildObsOverlayUrl(options.port, "avatar");
  changes.push(`Set ${AVATAR_FRAME_SOURCE} URL`);

  const items = scene.settings.items;
  if (!items) {
    throw new Error(`OBS scene "${sceneName}" has no scene items.`);
  }

  scene.settings.items = orderSceneItems(items, DEFAULT_SCENE_ORDER);
  changes.push(`Reset ${sceneName} source order`);

  setMainScreenFrame(scene.settings.items, MAIN_DISPLAY_SOURCE, changes);
  setMainScreenFrame(scene.settings.items, MAIN_APP_SOURCE, changes);
  setSceneItemVisibility(scene.settings.items, EMPTY_FRAME_SOURCE, true, changes);
  setSceneItemVisibility(scene.settings.items, AVATAR_FRAME_SOURCE, false, changes);
  setSceneItemVisibility(scene.settings.items, CAMERA_SOURCE, true, changes);
  setSceneItemVisibility(scene.settings.items, MAIN_DISPLAY_SOURCE, true, changes);
  setSceneItemVisibility(scene.settings.items, MAIN_APP_SOURCE, true, changes);

  return { config, changes };
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
  changes: string[],
): void {
  const item = items.find((candidate) => candidate.name === sourceName);
  if (!item) {
    throw new Error(`OBS scene item "${sourceName}" was not found.`);
  }

  item.pos = { x: MAIN_SCREEN_FRAME.left, y: MAIN_SCREEN_FRAME.top };
  item.bounds = { x: MAIN_SCREEN_FRAME.width, y: MAIN_SCREEN_FRAME.height };
  item.bounds_type = OBS_BOUNDS_SCALE_INNER;
  item.bounds_crop = false;
  item.bounds_align = OBS_BOUNDS_ALIGN_CENTER;
  item.align = OBS_ALIGN_CENTER;
  item.rot = 0;
  item.scale = { x: 1, y: 1 };
  item.crop_left = 0;
  item.crop_top = 0;
  item.crop_right = 0;
  item.crop_bottom = 0;
  changes.push(`Set ${sourceName} to main screen frame`);
}
