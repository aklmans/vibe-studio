import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE } from "./types";
import {
  loadOverlayState,
  normalizeOverlayState,
  saveOverlayState,
} from "./stateStorage";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

test("normalizeOverlayState fills missing nested editor data from defaults", () => {
  const state = normalizeOverlayState({
    sidebar: {
      visible: false,
      sections: [{ title: "自定义标题", bullets: ["保留这一条"] }],
    },
    bottomBar: {
      visible: true,
      segments: [{ title: "Now", text: "Keep this" }],
    },
    colors: {
      bgDark: "#000000",
    },
    activeTab: "cover",
  });

  assert.equal(state.sidebar.visible, false);
  assert.equal(state.sidebar.sections[0].title, "自定义标题");
  assert.deepEqual(state.sidebar.sections[0].bullets, ["保留这一条"]);
  assert.equal(
    state.sidebar.sections[1].title,
    DEFAULT_STATE.sidebar.sections[1].title,
  );
  assert.equal(state.bottomBar.segments[0].text, "Keep this");
  assert.equal(
    state.bottomBar.segments[1].title,
    DEFAULT_STATE.bottomBar.segments[1].title,
  );
  assert.equal(state.colors.bgDark, "#000000");
  assert.equal(state.colors.textColor, DEFAULT_STATE.colors.textColor);
  assert.equal(state.activeTab, "cover");
});

test("loadOverlayState falls back to defaults for invalid stored JSON", () => {
  const storage = new MemoryStorage();
  storage.setItem("vibe-overlay-state", "{bad json");

  assert.deepEqual(loadOverlayState(storage), DEFAULT_STATE);
});

test("saveOverlayState writes normalized JSON", () => {
  const storage = new MemoryStorage();
  saveOverlayState({ ...DEFAULT_STATE, activeTab: "cover" }, storage);

  const saved = storage.getItem("vibe-overlay-state");
  assert.ok(saved);
  assert.equal(JSON.parse(saved).activeTab, "cover");
});
