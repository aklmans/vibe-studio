/*
 * Declarative camera-slot composition for the local/private Studio.
 *
 * The overlay is a transparent frame; OBS owns the real captures underneath.
 * These helpers translate a small composition state — what occupies the camera
 * slot (webcam / second screen / avatar theme) and whether the main and slot
 * captures are swapped — into declarative obs-websocket operations (source
 * enables + scene-item transforms). Every apply sends the FULL desired state,
 * so the route is idempotent and never depends on what OBS currently shows.
 *
 * Pure and client-safe (no node imports): the Inspector imports the types and
 * defaults; the server route (src/app/api/obs/composition/route.ts) executes
 * the ops. MAIN_APP_SOURCE is intentionally unmanaged in Phase 1 — the main
 * slot always carries MAIN_DISPLAY_SOURCE; a main-slot source selector is a
 * Phase 2 concern.
 */

import {
  AVATAR_FRAME_SOURCE,
  CAMERA_SLOT_FRAME,
  CAMERA_SOURCE,
  EMPTY_FRAME_SOURCE,
  MAIN_DISPLAY_SOURCE,
  MAIN_SCREEN_FRAME,
  OBS_ALIGN_TOP_LEFT,
  OBS_BOUNDS_ALIGN_CENTER,
  SECOND_SCREEN_SOURCE,
} from "./live-prepare";

// obs-websocket v5 encodes the bounds-type enum as a STRING (the C enum name),
// NOT the integer stored in the scene-collection JSON that live-prepare.ts
// edits. Sending the integer yields obs-websocket 401 "boundsType must be a
// string". alignment / boundsAlignment stay numeric bitmasks in both worlds.
const WS_BOUNDS_SCALE_INNER = "OBS_BOUNDS_SCALE_INNER";
const WS_BOUNDS_SCALE_OUTER = "OBS_BOUNDS_SCALE_OUTER";

export type CameraSlotChoice = "camera" | "second-screen" | "avatar";
export type CompositionLayout = "standard" | "swapped";

export interface CompositionState {
  /** What occupies the camera cutout (or the avatar-frame theme). */
  cameraSlot: CameraSlotChoice;
  /** "swapped" puts the slot capture in the main frame and the main display in the slot. */
  layout: CompositionLayout;
}

export const DEFAULT_COMPOSITION: CompositionState = {
  cameraSlot: "camera",
  layout: "standard",
};

export function isCameraSlotChoice(value: unknown): value is CameraSlotChoice {
  return value === "camera" || value === "second-screen" || value === "avatar";
}

export function isCompositionLayout(value: unknown): value is CompositionLayout {
  return value === "standard" || value === "swapped";
}

/** The avatar theme is a full-frame browser source — there is no capture to swap. */
export function canSwapLayout(cameraSlot: CameraSlotChoice): boolean {
  return cameraSlot !== "avatar";
}

interface SlotRect {
  left: number;
  top: number;
  width: number;
  height: number;
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
export function slotTransform(slot: SlotRect, fit: "contain" | "cover"): SlotTransform {
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

export function compositionOps(state: CompositionState): CompositionOps {
  const capture =
    state.cameraSlot === "second-screen"
      ? SECOND_SCREEN_SOURCE
      : state.cameraSlot === "camera"
        ? CAMERA_SOURCE
        : null;
  const swapped = state.layout === "swapped" && capture !== null;

  const enables: SourceEnableOp[] = [
    // Theme: exactly one overlay frame browser source is visible.
    { source: EMPTY_FRAME_SOURCE, enabled: state.cameraSlot !== "avatar" },
    { source: AVATAR_FRAME_SOURCE, enabled: state.cameraSlot === "avatar" },
    // Captures: only the selected slot capture is on; the main display always is.
    { source: CAMERA_SOURCE, enabled: state.cameraSlot === "camera" },
    { source: SECOND_SCREEN_SOURCE, enabled: state.cameraSlot === "second-screen" },
    { source: MAIN_DISPLAY_SOURCE, enabled: true },
  ];

  const transforms: SourceTransformOp[] = [
    {
      source: MAIN_DISPLAY_SOURCE,
      transform: swapped
        ? slotTransform(CAMERA_SLOT_FRAME, "cover")
        : slotTransform(MAIN_SCREEN_FRAME, "contain"),
    },
  ];
  if (capture) {
    transforms.push({
      source: capture,
      transform: swapped
        ? slotTransform(MAIN_SCREEN_FRAME, "contain")
        : slotTransform(CAMERA_SLOT_FRAME, "cover"),
    });
  }

  return { enables, transforms };
}

/** What the status GET reads from OBS to reconstruct the current state. */
export interface CompositionProbe {
  cameraEnabled: boolean;
  secondScreenEnabled: boolean;
  avatarFrameEnabled: boolean;
  /** Scene-item positionY of the main display capture, when readable. */
  mainDisplayPositionY: number | null;
}

/**
 * Reconstruct the composition from live OBS flags so the Inspector reflects
 * reality on mount instead of assuming defaults. The layout heuristic: the
 * main display parked below the midpoint between the two slots means swapped.
 */
export function inferCompositionState(probe: CompositionProbe): CompositionState {
  const cameraSlot: CameraSlotChoice = probe.avatarFrameEnabled
    ? "avatar"
    : probe.secondScreenEnabled
      ? "second-screen"
      : "camera";
  const midpointY = (MAIN_SCREEN_FRAME.top + CAMERA_SLOT_FRAME.top) / 2;
  const swapped =
    typeof probe.mainDisplayPositionY === "number" &&
    probe.mainDisplayPositionY > midpointY;
  return {
    cameraSlot,
    layout: swapped && canSwapLayout(cameraSlot) ? "swapped" : "standard",
  };
}
