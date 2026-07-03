/*
 * Composition orchestration over an ObsConnection — the testable middle layer
 * between the pure ops (obs-composition.ts) and the websocket transport
 * (obs-ws.ts). The route opens a connection and delegates here; tests drive
 * these functions with a fake connection instead of a live OBS.
 */

import {
  AVATAR_FRAME_SOURCE,
  CAMERA_SOURCE,
  DEFAULT_SCENE_NAME,
  EMPTY_FRAME_SOURCE,
  MAIN_DISPLAY_SOURCE,
  SECOND_SCREEN_SOURCE,
} from "./live-prepare";
import {
  compositionOps,
  inferCompositionState,
  type CompositionState,
} from "./obs-composition";
import {
  OBS_ERROR_RESOURCE_NOT_FOUND,
  ObsRequestError,
  type ObsConnection,
} from "./obs-ws";

/** Resolve a source's scene-item id; null when the source is absent (600). */
async function getSceneItemId(
  connection: ObsConnection,
  sourceName: string,
): Promise<number | null> {
  try {
    const data = await connection.request("GetSceneItemId", {
      sceneName: DEFAULT_SCENE_NAME,
      sourceName,
    });
    return typeof data.sceneItemId === "number" ? data.sceneItemId : null;
  } catch (error) {
    if (error instanceof ObsRequestError && error.code === OBS_ERROR_RESOURCE_NOT_FOUND) {
      return null;
    }
    throw error;
  }
}

async function getSceneItemEnabled(
  connection: ObsConnection,
  sceneItemId: number,
): Promise<boolean> {
  const data = await connection.request("GetSceneItemEnabled", {
    sceneName: DEFAULT_SCENE_NAME,
    sceneItemId,
  });
  return data.sceneItemEnabled === true;
}

export interface CompositionProbeResult {
  current: CompositionState;
  /** Managed sources absent from the scene (e.g. the optional second screen). */
  missingSources: string[];
}

export async function probeComposition(
  connection: ObsConnection,
): Promise<CompositionProbeResult> {
  const managed = [
    CAMERA_SOURCE,
    SECOND_SCREEN_SOURCE,
    AVATAR_FRAME_SOURCE,
    EMPTY_FRAME_SOURCE,
    MAIN_DISPLAY_SOURCE,
  ];
  const ids = new Map<string, number | null>();
  for (const source of managed) {
    ids.set(source, await getSceneItemId(connection, source));
  }
  const missingSources = managed.filter((source) => ids.get(source) === null);

  const enabledOf = async (source: string): Promise<boolean> => {
    const id = ids.get(source);
    return typeof id === "number" ? getSceneItemEnabled(connection, id) : false;
  };

  let mainDisplayPositionY: number | null = null;
  const mainId = ids.get(MAIN_DISPLAY_SOURCE);
  if (typeof mainId === "number") {
    const data = await connection.request("GetSceneItemTransform", {
      sceneName: DEFAULT_SCENE_NAME,
      sceneItemId: mainId,
    });
    const transform =
      data.sceneItemTransform && typeof data.sceneItemTransform === "object"
        ? (data.sceneItemTransform as Record<string, unknown>)
        : null;
    mainDisplayPositionY =
      typeof transform?.positionY === "number" ? transform.positionY : null;
  }

  return {
    current: inferCompositionState({
      cameraEnabled: await enabledOf(CAMERA_SOURCE),
      secondScreenEnabled: await enabledOf(SECOND_SCREEN_SOURCE),
      avatarFrameEnabled: await enabledOf(AVATAR_FRAME_SOURCE),
      mainDisplayPositionY,
    }),
    missingSources,
  };
}

export interface CompositionApplyResult {
  ok: boolean;
  /** Managed sources absent from the scene (informational). */
  missingSources: string[];
  /** Sources this state needs enabled but the scene does not have — apply refused. */
  missingRequired: string[];
}

export async function applyComposition(
  connection: ObsConnection,
  state: CompositionState,
): Promise<CompositionApplyResult> {
  const ops = compositionOps(state);
  const ids = new Map<string, number | null>();
  for (const op of ops.enables) {
    ids.set(op.source, await getSceneItemId(connection, op.source));
  }

  const missingSources = [...ids.entries()]
    .filter(([, id]) => id === null)
    .map(([source]) => source);
  const missingRequired = ops.enables
    .filter((op) => op.enabled && ids.get(op.source) === null)
    .map((op) => op.source);
  if (missingRequired.length > 0) {
    // Refuse rather than half-apply: the selected content cannot be shown.
    return { ok: false, missingSources, missingRequired };
  }

  for (const op of ops.enables) {
    const id = ids.get(op.source);
    if (typeof id !== "number") continue; // absent + not required → skip
    await connection.request("SetSceneItemEnabled", {
      sceneName: DEFAULT_SCENE_NAME,
      sceneItemId: id,
      sceneItemEnabled: op.enabled,
    });
  }
  for (const op of ops.transforms) {
    const id = ids.get(op.source);
    if (typeof id !== "number") continue;
    await connection.request("SetSceneItemTransform", {
      sceneName: DEFAULT_SCENE_NAME,
      sceneItemId: id,
      sceneItemTransform: op.transform,
    });
  }

  await ensureSecondScreenBelowFrames(connection, ids);
  return { ok: true, missingSources, missingRequired: [] };
}

/**
 * A manually-added second-screen source lands on top of the scene — above the
 * overlay frames — which would cover the chrome. One targeted index fix tucks
 * it directly below the empty frame; the full order stays prepare's job.
 */
async function ensureSecondScreenBelowFrames(
  connection: ObsConnection,
  ids: Map<string, number | null>,
): Promise<void> {
  const secondId = ids.get(SECOND_SCREEN_SOURCE);
  const emptyId = ids.get(EMPTY_FRAME_SOURCE);
  if (typeof secondId !== "number" || typeof emptyId !== "number") return;

  const indexOf = async (sceneItemId: number): Promise<number | null> => {
    const data = await connection.request("GetSceneItemIndex", {
      sceneName: DEFAULT_SCENE_NAME,
      sceneItemId,
    });
    return typeof data.sceneItemIndex === "number" ? data.sceneItemIndex : null;
  };

  const secondIndex = await indexOf(secondId);
  const emptyIndex = await indexOf(emptyId);
  if (secondIndex === null || emptyIndex === null || secondIndex <= emptyIndex) return;

  await connection.request("SetSceneItemIndex", {
    sceneName: DEFAULT_SCENE_NAME,
    sceneItemId: secondId,
    sceneItemIndex: emptyIndex,
  });
}
