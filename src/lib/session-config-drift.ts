import type { OverlayState } from "../types";
import type { BarProfileId } from "./overlay-layout";
import {
  configToOverlayState,
  formatLiveStudioConfigJson,
  overlayStateToConfig,
  parseLiveStudioConfigJson,
  validateLiveStudioConfig,
  type LiveStudioConfig,
} from "./live-studio-config";

/*
 * Pure drift state machine for the Session Config JSON view.
 *
 * Authority is OverlayState. The JSON view is a projection of it ("synced")
 * until the user edits, which detaches a buffer ("editing"). Apply is the only
 * write back to state; Discard/Resync drops the buffer. This is the testable
 * core that SessionConfigEditor wires to React state — no React, no i18n.
 *
 * v1 scope: the projection is the *portable core* (title / subtitle / author /
 * cover / badges / stack / socials / sections). It intentionally does NOT carry
 * bottom-bar segments, live-session start time, active section, or done states.
 */

export type DriftMode = "synced" | "editing";

export interface DriftState {
  mode: DriftMode;
  draft: string;
  /** Projection the editing buffer started from, to detect underlying change. */
  baseProjection: string;
}

export const initialDriftState: DriftState = {
  mode: "synced",
  draft: "",
  baseProjection: "",
};

/** Project the current OverlayState to the v1 config JSON text (synced view). */
export function projectConfigText(state: OverlayState): string {
  return formatLiveStudioConfigJson(overlayStateToConfig(state));
}

/** Text shown in the editor: live projection when synced, the buffer when editing. */
export function displayedConfigText(drift: DriftState, projected: string): string {
  return drift.mode === "editing" ? drift.draft : projected;
}

/** True when the form changed the config underneath an open editing buffer. */
export function isChangedUnderneath(drift: DriftState, projected: string): boolean {
  return drift.mode === "editing" && projected !== drift.baseProjection;
}

/** Transition to editing on user input. Captures the base projection once. */
export function beginEditing(
  drift: DriftState,
  projected: string,
  nextDraft: string,
): DriftState {
  return {
    mode: "editing",
    draft: nextDraft,
    baseProjection: drift.mode === "editing" ? drift.baseProjection : projected,
  };
}

/** Drop the buffer and return to the synced projection of the current state. */
export function resyncToState(): DriftState {
  return initialDriftState;
}

export type ConfigParse =
  | { ok: true; config: LiveStudioConfig }
  | { ok: false; reason: "empty" }
  | { ok: false; reason: "json"; detail: string }
  | { ok: false; reason: "schema"; issues: string[] };

/** Parse + validate config text without applying. i18n-free. */
export function parseConfigText(text: string): ConfigParse {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (error) {
    return {
      ok: false,
      reason: "json",
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  const validation = validateLiveStudioConfig(parsed);
  if (!validation.valid) {
    return { ok: false, reason: "schema", issues: validation.issues };
  }

  const config = parseLiveStudioConfigJson(trimmed);
  if (!config) return { ok: false, reason: "schema", issues: validation.issues };
  return { ok: true, config };
}

export interface ApplyConfigResult {
  ok: boolean;
  parse: ConfigParse;
  nextState: OverlayState | null;
  /** Drift after a successful apply — synced (the applied config is now state). */
  nextDrift: DriftState;
}

/** Apply config text to a state, returning the next state + the synced drift. */
export function applyConfigText(
  state: OverlayState,
  text: string,
  /** Which scene's agenda receives the config sections (default: active). */
  sectionsProfile?: BarProfileId,
): ApplyConfigResult {
  const parse = parseConfigText(text);
  if (!parse.ok) {
    return { ok: false, parse, nextState: null, nextDrift: initialDriftState };
  }
  return {
    ok: true,
    parse,
    nextState: configToOverlayState(state, parse.config, sectionsProfile),
    nextDrift: initialDriftState,
  };
}
