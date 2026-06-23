import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE, DEFAULT_STATE_BY_LOCALE } from "./types";
import { DARK_PRESET, LIGHT_PRESET } from "./lib/theme";
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
  const firstSegment = state.bottomBar.segments[0];
  assert.equal(firstSegment.kind, "text");
  assert.equal(firstSegment.text, "Keep this");
  assert.deepEqual(state.bottomBar.segments[1], DEFAULT_STATE.bottomBar.segments[1]);
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

test("saveOverlayState persists the current light appearance and asset palette", () => {
  const storage = new MemoryStorage();
  saveOverlayState(
    {
      ...DEFAULT_STATE,
      theme: "light",
      colors: { ...LIGHT_PRESET },
    },
    storage,
  );

  const loaded = loadOverlayState(storage);

  assert.equal(loaded.theme, "light");
  assert.deepEqual(loaded.colors, LIGHT_PRESET);
});

test("normalizeOverlayState preserves the live data tab", () => {
  const state = normalizeOverlayState({ activeTab: "live" });

  assert.equal(state.activeTab, "live");
});

test("normalizeOverlayState fills missing fields from the provided locale defaults", () => {
  const state = normalizeOverlayState(
    {
      cover: {
        title: "Custom Title",
      },
      sidebar: {
        sections: [{ title: "Custom Section", bullets: ["Keep"] }],
      },
    },
    DEFAULT_STATE_BY_LOCALE.en,
  );

  assert.equal(state.cover.title, "Custom Title");
  assert.equal(state.cover.todayLabel, "TODAY'S BUILD");
  assert.equal(state.cover.todayTopic, "Multi-Agent Coding Live");
  assert.equal(state.sidebar.sections[0].title, "Custom Section");
  assert.equal(state.sidebar.sections[1].title, "Current Problem");
  assert.equal(state.cover.socials[0].label, "YouTube");
});

test("normalizeOverlayState migrates v0 flat badges and social strings", () => {
  const state = normalizeOverlayState({
    cover: {
      badge1: "Agent A",
      badge2: "Agent B",
      socialBilibili: "@video",
      socialBlog: "blog.example.com",
      socialGithub: "github.com/example",
      socialQQ: "987654321",
    },
  });

  assert.equal(state.cover.badges[0].label, "Agent A");
  assert.equal(state.cover.badges[1].label, "Agent B");
  assert.equal(state.cover.badges[2].label, DEFAULT_STATE.cover.badges[2].label);
  const socialValue = (kind: string) =>
    state.cover.socials.find((social) => social.kind === kind)?.value;
  assert.equal(socialValue("bilibili"), "@video");
  assert.equal(socialValue("blog"), "blog.example.com");
  assert.equal(socialValue("github"), "github.com/example");
  assert.equal(socialValue("qq"), "987654321");
});

test("normalizeOverlayState handles empty arrays and invalid types conservatively", () => {
  const defaultValue = {
    ...DEFAULT_STATE_BY_LOCALE.en,
    theme: "light" as const,
    colors: { ...LIGHT_PRESET },
  };

  const state = normalizeOverlayState(
    {
      sidebar: {
        visible: "yes",
        socialVisible: 1,
        activeSection: 999,
        sectionsDone: [["bad", true], "bad row"],
        sections: [],
      },
      bottomBar: {
        visible: "true",
        segments: [],
      },
      stack: {
        items: ["", 12, "Keep"],
      },
      cover: {
        avatarVisible: "yes",
        badges: [],
        socials: [],
      },
      wallpaper: {
        previewPresetId: "not-a-preset",
        avatarVisible: "no",
      },
      colors: {
        bgDark: "not-a-color",
        textColor: "#123456",
      },
      theme: "invalid-theme",
      activeTab: "invalid-tab",
    },
    defaultValue,
  );

  assert.equal(state.sidebar.visible, defaultValue.sidebar.visible);
  assert.equal(state.sidebar.socialVisible, defaultValue.sidebar.socialVisible);
  assert.equal(state.sidebar.activeSection, 2);
  assert.deepEqual(state.sidebar.sectionsDone[0], [false, true, false]);
  assert.equal(state.sidebar.sections[0].title, "Today's Goal");
  assert.deepEqual(state.bottomBar.segments, defaultValue.bottomBar.segments);
  assert.deepEqual(state.stack.items, ["Keep"]);
  assert.equal(state.cover.avatarVisible, defaultValue.cover.avatarVisible);
  assert.deepEqual(state.cover.badges, defaultValue.cover.badges);
  assert.deepEqual(state.cover.socials, defaultValue.cover.socials);
  assert.equal(state.wallpaper.previewPresetId, defaultValue.wallpaper.previewPresetId);
  assert.equal(state.wallpaper.avatarVisible, defaultValue.wallpaper.avatarVisible);
  assert.equal(state.colors.bgDark, defaultValue.colors.bgDark);
  assert.equal(state.colors.textColor, "#123456");
  assert.equal(state.theme, "light");
  assert.equal(state.activeTab, "overlay");
});


test("normalizeOverlayState migrates the old built-in cover avatar to the current broadcast avatar", () => {
  const migrated = normalizeOverlayState({
    cover: {
      avatarUrl: "/avatar.jpg",
    },
  });

  assert.equal(migrated.cover.avatarUrl, "/avatar.png");

  const custom = normalizeOverlayState({
    cover: {
      avatarUrl: "/custom-subject.png",
    },
  });

  assert.equal(custom.cover.avatarUrl, "/custom-subject.png");
});

test("normalizeOverlayState derives the cover visual type from legacy state", () => {
  // New default → avatar cover.
  assert.equal(normalizeOverlayState({}).cover.visual, "avatar");

  // Legacy avatarVisible=false → pure title cover.
  assert.equal(
    normalizeOverlayState({ cover: { avatarVisible: false } }).cover.visual,
    "title",
  );

  // Legacy built-in /avatar.jpg headshot → avatar type; it migrates to the
  // current /avatar.png asset for both the cover portrait and shared avatar.
  const legacy = normalizeOverlayState({
    cover: { avatarUrl: "/avatar.jpg", avatarVisible: true },
  });
  assert.equal(legacy.cover.visual, "avatar");
  assert.equal(legacy.cover.portraitUrl, "/avatar.png");
  assert.equal(legacy.cover.avatarUrl, "/avatar.png");

  // Legacy studio scene url → scene type.
  assert.equal(
    normalizeOverlayState({
      cover: { avatarUrl: "/vibe-studio-bg.png", avatarVisible: true },
    }).cover.visual,
    "scene",
  );

  // An explicit persisted visual type always wins.
  assert.equal(
    normalizeOverlayState({ cover: { visual: "title" } }).cover.visual,
    "title",
  );
});

test("normalizeOverlayState keeps cover portraits and scene subjects separate by default", () => {
  const def = normalizeOverlayState({});

  assert.equal(def.cover.visual, "avatar");
  assert.equal(def.cover.portraitUrl, "/avatar.png");
  assert.equal(def.cover.sceneUrl, "/vibe-studio-bg.png");
  assert.equal(def.cover.avatarUrl, "/avatar.png");
});

test("normalizeOverlayState keeps cover images compatible and replaceable", () => {
  // Both built-in assets resolve to sensible defaults.
  const def = normalizeOverlayState({});
  assert.equal(def.cover.sceneUrl, "/vibe-studio-bg.png");
  assert.equal(def.cover.portraitUrl, "/avatar.png");

  // An old custom subject keeps showing on the cover (sceneUrl inherits it).
  const custom = normalizeOverlayState({
    cover: { avatarUrl: "/custom-subject.png" },
  });
  assert.equal(custom.cover.sceneUrl, "/custom-subject.png");

  // Explicit per-type replacements survive a round-trip.
  const replaced = normalizeOverlayState({
    cover: {
      visual: "avatar",
      portraitUrl: "data:image/png;base64,AAA",
      sceneUrl: "data:image/png;base64,BBB",
    },
  });
  assert.equal(replaced.cover.portraitUrl, "data:image/png;base64,AAA");
  assert.equal(replaced.cover.sceneUrl, "data:image/png;base64,BBB");
});

test("normalizeOverlayState migrates legacy neon/editorial themes to dark/light", () => {
  const fromNeon = normalizeOverlayState({ theme: "neon" }, DEFAULT_STATE);
  assert.equal(fromNeon.theme, "dark");
  assert.deepEqual(fromNeon.colors, { ...DARK_PRESET });

  const fromEditorial = normalizeOverlayState(
    { theme: "editorial" },
    DEFAULT_STATE,
  );
  assert.equal(fromEditorial.theme, "light");
  assert.deepEqual(fromEditorial.colors, { ...LIGHT_PRESET });
});

test("normalizeOverlayState migrates legacy theme names without dropping custom colors", () => {
  const state = normalizeOverlayState(
    { theme: "neon", colors: { bgDark: "#20201e", pinkAccent: "#d86f4b" } },
    DEFAULT_STATE,
  );

  assert.equal(state.theme, "dark");
  assert.equal(state.colors.bgDark, "#20201e");
  assert.equal(state.colors.pinkAccent, "#d86f4b");
  assert.equal(state.colors.textColor, DARK_PRESET.textColor);
});
