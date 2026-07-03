/*
 * Composition orchestration over an ObsConnection — the testable middle layer
 * between the pure ops (obs-composition.ts) and the websocket transport
 * (obs-ws.ts). The route opens a connection and delegates here; tests drive
 * these functions with a fake connection instead of a live OBS.
 */

import {
  AVATAR_FRAME_SOURCE,
  DEFAULT_SCENE_NAME,
  EMPTY_FRAME_SOURCE,
  SECOND_SCREEN_SOURCE,
} from "./live-prepare";
import {
  CAPTURE_SOURCE_NAME,
  compositionOps,
  inferCompositionState,
  MANAGED_CAPTURES,
  type CaptureProbe,
  type CaptureChoice,
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

async function getSceneItemPositionY(
  connection: ObsConnection,
  sceneItemId: number,
): Promise<number | null> {
  const data = await connection.request("GetSceneItemTransform", {
    sceneName: DEFAULT_SCENE_NAME,
    sceneItemId,
  });
  const transform =
    data.sceneItemTransform && typeof data.sceneItemTransform === "object"
      ? (data.sceneItemTransform as Record<string, unknown>)
      : null;
  return typeof transform?.positionY === "number" ? transform.positionY : null;
}

export interface CompositionProbeResult {
  current: CompositionState;
  /** Managed sources absent from the scene (so the UI can annotate/disable). */
  missingSources: string[];
}

export async function probeComposition(
  connection: ObsConnection,
): Promise<CompositionProbeResult> {
  const captureSources = MANAGED_CAPTURES.map((choice) => CAPTURE_SOURCE_NAME[choice]);
  const ids = new Map<string, number | null>();
  for (const source of [...captureSources, AVATAR_FRAME_SOURCE, EMPTY_FRAME_SOURCE]) {
    ids.set(source, await getSceneItemId(connection, source));
  }
  const missingSources = [...captureSources, EMPTY_FRAME_SOURCE].filter(
    (source) => ids.get(source) === null,
  );

  const enabledOf = async (source: string): Promise<boolean> => {
    const id = ids.get(source);
    return typeof id === "number" ? getSceneItemEnabled(connection, id) : false;
  };

  const captures = {} as Record<CaptureChoice, CaptureProbe>;
  for (const choice of MANAGED_CAPTURES) {
    const source = CAPTURE_SOURCE_NAME[choice];
    const enabled = await enabledOf(source);
    // Position only matters for the enabled capture that occupies a region.
    const id = ids.get(source);
    const positionY =
      enabled && typeof id === "number" ? await getSceneItemPositionY(connection, id) : null;
    captures[choice] = { enabled, positionY };
  }

  return {
    current: inferCompositionState({
      captures,
      avatarFrameEnabled: await enabledOf(AVATAR_FRAME_SOURCE),
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
 * The second-screen capture is the one source created by hand in OBS, so it
 * lands on top of the scene — above the overlay frames — which would cover the
 * chrome. One targeted index fix tucks it directly below the empty frame; the
 * prepare-created captures keep the order prepare gives them.
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
