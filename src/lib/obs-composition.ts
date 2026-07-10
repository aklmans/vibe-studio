/*
 * Declarative composition for the local/private Studio.
 *
 * The overlay is a transparent frame; OBS owns the real captures underneath. A
 * composition assigns a source to each of the two regions — the main 16:9 frame
 * and the camera cutout — and these helpers translate that into declarative
 * obs-websocket ops (source enables + scene-item transforms). Every apply sends
 * the FULL desired state, so the route is idempotent and never depends on what
 * OBS currently shows.
 *
 * "Display selection" is by pre-created source, not dynamic monitor poking:
 * display-1 = Vibe Main Display Capture, display-2 = Vibe Second Screen
 * Capture. The operator points each at a monitor once in OBS; this layer only
 * routes sources between regions. Pure and client-safe (no node imports).
 */

import {
  AVATAR_FRAME_SOURCE,
  CAMERA_SOURCE,
  EMPTY_FRAME_SOURCE,
  MAIN_APP_SOURCE,
  MAIN_DISPLAY_SOURCE,
  OBS_ALIGN_TOP_LEFT,
  OBS_BOUNDS_ALIGN_CENTER,
  SECOND_SCREEN_SOURCE,
} from "./live-prepare";
import {
  WORKBENCH_LAYOUT,
  type OverlayLayout,
  type Rect,
  type RegionId,
} from "./overlay-layout";

// obs-websocket v5 encodes the bounds-type enum as a STRING (the C enum name),
// NOT the integer stored in the scene-collection JSON that live-prepare.ts
// edits. Sending the integer yields obs-websocket 401 "boundsType must be a
// string". alignment / boundsAlignment stay numeric bitmasks in both worlds.
const WS_BOUNDS_SCALE_INNER = "OBS_BOUNDS_SCALE_INNER";
const WS_BOUNDS_SCALE_OUTER = "OBS_BOUNDS_SCALE_OUTER";

// A capture that can occupy a region.
export type CaptureChoice = "display-1" | "display-2" | "app" | "camera";
// The main 16:9 frame carries a capture (never the avatar theme).
export type MainSource = "display-1" | "display-2" | "app";
// The camera cutout carries a capture, the avatar theme, or nothing.
export type CameraSource = "display-1" | "display-2" | "camera" | "avatar" | "off";

export interface CompositionState {
  main: MainSource;
  camera: CameraSource;
}

export const DEFAULT_COMPOSITION: CompositionState = {
  main: "display-1",
  camera: "camera",
};

/** Choice → OBS source name. The single crossing between abstract regions and
 * OBS's named scene items; live-prepare.ts owns the names. */
export const CAPTURE_SOURCE_NAME: Record<CaptureChoice, string> = {
  "display-1": MAIN_DISPLAY_SOURCE,
  "display-2": SECOND_SCREEN_SOURCE,
  app: MAIN_APP_SOURCE,
  camera: CAMERA_SOURCE,
};

/** Every capture this layer manages (enable + transform); frames are separate. */
export const MANAGED_CAPTURES: readonly CaptureChoice[] = [
  "display-1",
  "display-2",
  "app",
  "camera",
];

const MAIN_SOURCES: readonly MainSource[] = ["display-1", "display-2", "app"];
const CAMERA_SOURCES: readonly CameraSource[] = [
  "display-1",
  "display-2",
  "camera",
  "avatar",
  "off",
];

export function isMainSource(value: unknown): value is MainSource {
  return typeof value === "string" && (MAIN_SOURCES as readonly string[]).includes(value);
}

export function isCameraSource(value: unknown): value is CameraSource {
  return typeof value === "string" && (CAMERA_SOURCES as readonly string[]).includes(value);
}

/** The camera value when it names a capture (not the avatar theme or off). */
function cameraCapture(camera: CameraSource): CaptureChoice | null {
  return camera === "avatar" || camera === "off" ? null : camera;
}

/** Only display captures can be swapped or collide across regions. */
function isDisplay(choice: string): boolean {
  return choice === "display-1" || choice === "display-2";
}

/** OBS can't show one capture in two regions — reject main === camera capture. */
export function hasSourceConflict(state: CompositionState): boolean {
  const cam = cameraCapture(state.camera);
  return cam !== null && cam === state.main;
}

/** Swap is meaningful only when both regions hold a display capture. */
export function canSwap(state: CompositionState): boolean {
  return isDisplay(state.main) && isDisplay(state.camera);
}

export function swapRegions(state: CompositionState): CompositionState {
  if (!canSwap(state)) return state;
  return { main: state.camera as MainSource, camera: state.main as CameraSource };
}

/**
 * Resolve a would-be selection so the regions never claim the same capture.
 * When `changed` names the region the user just touched, the OTHER region
 * yields; the touched pick always wins. Used by the UI so posted state is
 * always conflict-free, and as a safety net in inference.
 */
export function normalizeComposition(
  state: CompositionState,
  changed: "main" | "camera" = "camera",
): CompositionState {
  if (!hasSourceConflict(state)) return state;
  if (changed === "main") {
    // Free the camera: fall back to the webcam, or off if none makes sense.
    return { ...state, camera: "camera" };
  }
  // The user set the camera → move main off the shared display to the other one.
  return { ...state, main: state.main === "display-1" ? "display-2" : "display-1" };
}

/** obs-websocket v5 SetSceneItemTransform payload (partial transform). */
export type SlotTransform = Record<string, string | number | boolean>;

/**
 * "contain" fits the source inside the slot (16:9 → 16:9 main frame, exact).
 * "cover" fills the slot and crops the overflow to the bounds — a 16:9 capture
 * in the 400×272 camera slot loses ≈8–9% on each side (accepted trade-off).
 * cropToBounds requires OBS ≥ 30.2 (same capability prepare writes offline as
 * bounds_crop).
 */
export function slotTransform(slot: Rect, fit: "contain" | "cover"): SlotTransform {
  return {
    positionX: slot.left,
    positionY: slot.top,
    boundsType: fit === "cover" ? WS_BOUNDS_SCALE_OUTER : WS_BOUNDS_SCALE_INNER,
    boundsWidth: slot.width,
    boundsHeight: slot.height,
    boundsAlignment: OBS_BOUNDS_ALIGN_CENTER,
    alignment: OBS_ALIGN_TOP_LEFT,
    rotation: 0,
    cropLeft: 0,
    cropRight: 0,
    cropTop: 0,
    cropBottom: 0,
    cropToBounds: fit === "cover",
  };
}

export interface SourceEnableOp {
  source: string;
  enabled: boolean;
}

export interface SourceTransformOp {
  source: string;
  transform: SlotTransform;
}

export interface CompositionOps {
  enables: SourceEnableOp[];
  transforms: SourceTransformOp[];
}

export function compositionOps(
  state: CompositionState,
  layout: OverlayLayout = WORKBENCH_LAYOUT,
): CompositionOps {
  // A layout without a camera region (mobile) has nowhere to park a camera
  // source: its choice is ignored, and the avatar theme frame stays off.
  const cameraRegion = layout.regions.camera ?? null;
  const mainSourceName = CAPTURE_SOURCE_NAME[state.main];
  const camChoice = cameraRegion ? cameraCapture(state.camera) : null;
  const camSourceName = camChoice ? CAPTURE_SOURCE_NAME[camChoice] : null;

  // A capture is enabled iff it is assigned to a region.
  const assigned = new Set<string>([mainSourceName]);
  if (camSourceName) assigned.add(camSourceName);

  const avatarTheme = cameraRegion !== null && state.camera === "avatar";
  const enables: SourceEnableOp[] = [
    // Theme: exactly one overlay frame browser source is visible.
    { source: AVATAR_FRAME_SOURCE, enabled: avatarTheme },
    { source: EMPTY_FRAME_SOURCE, enabled: !avatarTheme },
    // Captures.
    ...MANAGED_CAPTURES.map((choice) => {
      const source = CAPTURE_SOURCE_NAME[choice];
      return { source, enabled: assigned.has(source) };
    }),
  ];

  const transforms: SourceTransformOp[] = [
    { source: mainSourceName, transform: slotTransform(layout.regions.main, "contain") },
  ];
  // camSourceName === mainSourceName would be a conflict; guard defensively.
  if (cameraRegion && camSourceName && camSourceName !== mainSourceName) {
    transforms.push({
      source: camSourceName,
      transform: slotTransform(cameraRegion, "cover"),
    });
  }

  return { enables, transforms };
}

/** Per-capture flags the status GET reads from OBS to reconstruct the state. */
export interface CaptureProbe {
  enabled: boolean;
  /**
   * Scene-item positionX, or null when unreadable. Required to tell apart
   * regions that sit side by side (the camera-left / camera-right layouts);
   * without it we can only separate vertically stacked regions.
   */
  positionX: number | null;
  /** Scene-item positionY, or null when unreadable. */
  positionY: number | null;
}

export interface CompositionProbe {
  captures: Record<CaptureChoice, CaptureProbe>;
  avatarFrameEnabled: boolean;
}

/**
 * Which region a capture currently sits in. Apply parks a source exactly on its
 * region's top-left, so the nearest region wins. When positionX is unreadable we
 * fall back to splitting on Y, which is only correct while the layout stacks its
 * regions vertically (workbench) — a side-by-side layout needs the X.
 */
function regionForCapture(
  layout: OverlayLayout,
  positionX: number | null,
  positionY: number,
): RegionId {
  const { main, camera } = layout.regions;
  if (!camera) return "main"; // single-region layout: everything is the main slot
  if (positionX === null) {
    return positionY < (main.top + camera.top) / 2 ? "main" : "camera";
  }
  const distance = (r: Rect) => (positionX - r.left) ** 2 + (positionY - r.top) ** 2;
  return distance(main) <= distance(camera) ? "main" : "camera";
}

/**
 * Reconstruct {main, camera} from live OBS so the Inspector reflects reality on
 * mount, by matching each enabled capture to the region it is parked on.
 */
export function inferCompositionState(
  probe: CompositionProbe,
  layout: OverlayLayout = WORKBENCH_LAYOUT,
): CompositionState {
  let main: MainSource = "display-1";
  let cameraCap: CaptureChoice | null = null;

  for (const choice of MANAGED_CAPTURES) {
    const capture = probe.captures[choice];
    if (!capture.enabled || capture.positionY === null) continue;
    if (regionForCapture(layout, capture.positionX, capture.positionY) === "main") {
      if (isMainSource(choice)) main = choice;
    } else {
      cameraCap = choice;
    }
  }

  const camera: CameraSource = !layout.regions.camera
    ? "off" // no camera region in this layout; a stale avatar frame is noise
    : probe.avatarFrameEnabled
      ? "avatar"
      : cameraCap && isCameraSource(cameraCap)
        ? cameraCap
        : "off";

  return normalizeComposition({ main, camera }, "main");
}
