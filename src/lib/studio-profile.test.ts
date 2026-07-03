import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE_BY_LOCALE } from "../types";
import type { ColorTokens } from "./theme";
import {
  STUDIO_PROFILE_STORAGE_KEY,
  applyStudioProfileToState,
  clearStudioProfile,
  loadStudioProfile,
  profileFromState,
  saveStudioProfile,
} from "./studio-profile";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const DEMO_DEFAULT = DEFAULT_STATE_BY_LOCALE.en;

// A distinctive custom palette so a round-trip proves colors are carried, not
// silently swapped for a preset.
const BRAND_COLORS: ColorTokens = {
  bgDark: "#101014",
  bgPanel: "#1b1b22",
  textColor: "#f5f5f7",
  mutedText: "#a0a0aa",
  subtleText: "#6c6c78",
  borderColor: "#33333d",
  cyanAccent: "#7fd1c0",
  pinkAccent: "#e07aa0",
  warmAccent: "#e8c07a",
};

test("studio profile load falls back to null for missing, invalid, or malformed data", () => {
  const storage = new MemoryStorage();
  assert.equal(loadStudioProfile(storage), null);

  storage.setItem(STUDIO_PROFILE_STORAGE_KEY, "{bad json");
  assert.equal(loadStudioProfile(storage), null);

  storage.setItem(STUDIO_PROFILE_STORAGE_KEY, JSON.stringify({ version: 2, socials: "nope" }));
  assert.equal(loadStudioProfile(storage), null);
});

test("studio profile persists a normalized brand profile (identity + palette) separate from overlay state", () => {
  const storage = new MemoryStorage();
  const profile = {
    version: 2 as const,
    author: "Private Host",
    avatarUrl: "/private-avatar.png",
    avatarVisible: true,
    socialVisible: true,
    socials: [
      { visible: true, iconKey: "github" as const, iconMode: "mono" as const, label: "GitHub", value: "private-handle", customColor: "" },
    ],
    theme: "light" as const,
    colors: BRAND_COLORS,
  };

  saveStudioProfile(profile, storage);
  const raw = storage.getItem(STUDIO_PROFILE_STORAGE_KEY);
  assert.ok(raw);
  assert.doesNotMatch(raw, /sidebar|bottomBar|sectionsDone|liveSession/);

  const loaded = loadStudioProfile(storage);
  assert.deepEqual(loaded, profile);

  clearStudioProfile(storage);
  assert.equal(loadStudioProfile(storage), null);
});

test("a legacy v1 profile (identity only) still loads, normalized to v2 without a palette", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    STUDIO_PROFILE_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      author: "Legacy Host",
      avatarUrl: "/legacy.png",
      avatarVisible: true,
      socialVisible: false,
      socials: [],
    }),
  );
  const loaded = loadStudioProfile(storage);
  assert.equal(loaded?.version, 2);
  assert.equal(loaded?.author, "Legacy Host");
  assert.equal("theme" in (loaded ?? {}), false);
  assert.equal("colors" in (loaded ?? {}), false);
});

test("studio profile applies brand palette + identity over defaults without changing stream content", () => {
  const profiled = applyStudioProfileToState(DEMO_DEFAULT, {
    version: 2,
    author: "Private Host",
    avatarUrl: "/private-avatar.png",
    avatarVisible: true,
    socialVisible: true,
    socials: [
      { visible: true, iconKey: "website", iconMode: "mono", label: "Website", value: "private.example", customColor: "" },
    ],
    theme: "light",
    colors: BRAND_COLORS,
  });

  // Identity.
  assert.equal(profiled.cover.hookText, "with Private Host");
  assert.equal(profiled.cover.avatarUrl, "/private-avatar.png");
  assert.deepEqual(profiled.cover.socials.map((s) => s.value), ["private.example"]);
  // Brand palette.
  assert.equal(profiled.theme, "light");
  assert.deepEqual(profiled.colors, BRAND_COLORS);
  // Stream content untouched.
  assert.equal(profiled.cover.title, DEMO_DEFAULT.cover.title);
  assert.deepEqual(profiled.sidebar.sections, DEMO_DEFAULT.sidebar.sections);
});

test("a palette-less profile leaves the current theme/colors untouched on apply", () => {
  const themed = { ...DEMO_DEFAULT, theme: "light" as const, colors: BRAND_COLORS };
  const profiled = applyStudioProfileToState(themed, {
    version: 2,
    author: "Host",
    avatarUrl: "/a.png",
    avatarVisible: true,
    socialVisible: true,
    socials: [],
    // no theme/colors
  });
  assert.equal(profiled.theme, "light");
  assert.deepEqual(profiled.colors, BRAND_COLORS);
});

test("profileFromState extracts identity + the current brand palette", () => {
  const state = {
    ...applyStudioProfileToState(DEMO_DEFAULT, {
      version: 2,
      author: "Private Host",
      avatarUrl: "/private-avatar.png",
      avatarVisible: false,
      socialVisible: false,
      socials: [
        { visible: true, iconKey: "github", iconMode: "mono", label: "GitHub", value: "private-handle", customColor: "" },
      ],
    }),
    theme: "dark" as const,
    colors: BRAND_COLORS,
  };

  const profile = profileFromState({
    ...state,
    cover: { ...state.cover, title: "Stream-specific title" },
  });

  assert.deepEqual(profile, {
    version: 2,
    author: "Private Host",
    avatarUrl: "/private-avatar.png",
    avatarVisible: false,
    socialVisible: false,
    socials: [
      { visible: true, iconKey: "github", iconMode: "mono", label: "GitHub", value: "private-handle", customColor: "" },
    ],
    theme: "dark",
    colors: BRAND_COLORS,
  });
});
