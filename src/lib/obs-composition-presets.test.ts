import assert from "node:assert/strict";
import { deepStrictEqual, equal } from "node:assert/strict";
import test from "node:test";

import type { CompositionState } from "./obs-composition";
import {
  addPreset,
  loadPresets,
  MAX_PRESETS,
  parsePresets,
  PRESETS_STORAGE_KEY,
  removePreset,
  savePresets,
  type CompositionPreset,
} from "./obs-composition-presets";

/** Minimal in-memory Storage. */
function fakeStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

const S = (main: CompositionState["main"], camera: CompositionState["camera"]): CompositionState => ({
  main,
  camera,
});

test("parsePresets keeps valid entries and drops junk / conflicts", () => {
  const raw = JSON.stringify([
    { id: "a", name: "Coding", state: S("display-1", "camera") },
    { id: "b", name: "Bad state", state: { main: "screen", camera: "camera" } },
    { id: "c", name: "Conflict", state: S("display-1", "display-1") },
    { id: "d", name: "Swapped", state: S("display-2", "display-1") },
    "not an object",
    { id: "e" },
  ]);
  const presets = parsePresets(raw);
  deepStrictEqual(
    presets.map((p) => p.id),
    ["a", "d"],
  );
});

test("parsePresets tolerates absent / malformed storage", () => {
  deepStrictEqual(parsePresets(null), []);
  deepStrictEqual(parsePresets("not json"), []);
  deepStrictEqual(parsePresets(JSON.stringify({ not: "array" })), []);
});

test("load / save round-trips through storage under the pinned key", () => {
  const store = fakeStorage();
  const presets: CompositionPreset[] = [{ id: "a", name: "Coding", state: S("display-1", "camera") }];
  savePresets(presets, store);
  assert(store.getItem(PRESETS_STORAGE_KEY));
  deepStrictEqual(loadPresets(store), presets);
});

test("addPreset appends with the caller's id and caps at MAX_PRESETS", () => {
  let presets: CompositionPreset[] = [];
  for (let i = 0; i < MAX_PRESETS + 3; i++) {
    presets = addPreset(presets, `id-${i}`, `Preset ${i}`, S("display-1", "camera"));
  }
  equal(presets.length, MAX_PRESETS);
  // Newest kept, oldest evicted.
  equal(presets[0].id, "id-3");
  equal(presets[presets.length - 1].id, `id-${MAX_PRESETS + 2}`);
});

test("addPreset falls back to a name when blank; removePreset drops by id", () => {
  const added = addPreset([], "x", "   ", S("app", "off"));
  equal(added[0].name, "Preset");
  deepStrictEqual(added[0].state, S("app", "off"));
  deepStrictEqual(removePreset(added, "x"), []);
  deepStrictEqual(removePreset(added, "missing"), added);
});
