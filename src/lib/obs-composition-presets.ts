/*
 * Named composition presets, persisted to localStorage (studio-local, like the
 * studio profile). Pure helpers over an injectable Storage so the parse/validate
 * logic is unit-testable; the UI supplies ids (crypto.randomUUID) since this
 * module stays deterministic. Invalid or conflicting entries are dropped on
 * load, so a hand-edited or stale store can never feed a bad state to OBS.
 */

import {
  hasSourceConflict,
  isCameraSource,
  isMainSource,
  type CompositionState,
} from "./obs-composition";

export interface CompositionPreset {
  id: string;
  name: string;
  state: CompositionState;
}

export const PRESETS_STORAGE_KEY = "vibe-obs-composition-presets";
export const MAX_PRESETS = 12;

function validPreset(value: unknown): CompositionPreset | null {
  if (!value || typeof value !== "object") return null;
  const preset = value as Record<string, unknown>;
  const state = preset.state as Record<string, unknown> | undefined;
  if (typeof preset.id !== "string" || typeof preset.name !== "string" || !state) return null;
  if (!isMainSource(state.main) || !isCameraSource(state.camera)) return null;
  const composed: CompositionState = { main: state.main, camera: state.camera };
  if (hasSourceConflict(composed)) return null;
  return { id: preset.id, name: preset.name, state: composed };
}

export function parsePresets(raw: string | null): CompositionPreset[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(validPreset)
      .filter((preset): preset is CompositionPreset => preset !== null)
      .slice(0, MAX_PRESETS);
  } catch {
    return [];
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadPresets(store: Storage | null = safeStorage()): CompositionPreset[] {
  return parsePresets(store?.getItem(PRESETS_STORAGE_KEY) ?? null);
}

export function savePresets(
  presets: CompositionPreset[],
  store: Storage | null = safeStorage(),
): void {
  try {
    store?.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)));
  } catch {
    /* storage full / unavailable — presets are a convenience, not critical */
  }
}

/** Append a preset (id from the caller), keeping the newest MAX_PRESETS. */
export function addPreset(
  presets: CompositionPreset[],
  id: string,
  name: string,
  state: CompositionState,
): CompositionPreset[] {
  const clean = name.trim() || "Preset";
  return [...presets, { id, name: clean, state }].slice(-MAX_PRESETS);
}

export function removePreset(presets: CompositionPreset[], id: string): CompositionPreset[] {
  return presets.filter((preset) => preset.id !== id);
}
