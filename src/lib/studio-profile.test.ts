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

test("studio profile persists a normalized brand profile (identity + palette + header) separate from overlay state", () => {
  const storage = new MemoryStorage();
  const profile = {
    version: 3 as const,
    author: "Private Host",
    avatarUrl: "/private-avatar.png",
    avatarVisible: true,
    socialVisible: true,
    socials: [
      { visible: true, iconKey: "github" as const, iconMode: "mono" as const, label: "GitHub", value: "private-handle", customColor: "" },
    ],
    theme: "light" as const,
    colors: BRAND_COLORS,
    logoUrl: "/private-logo.png",
    seriesName: "Private Lecture Series",
    presenterLines: ["Chair of Nothing", "Institute of Everything"],
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

test("a legacy v1 profile (identity only) still loads, normalized to v3 with no optional groups", () => {
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
  assert.equal(loaded?.version, 3);
  assert.equal(loaded?.author, "Legacy Host");
  for (const key of ["theme", "colors", "logoUrl", "seriesName", "presenterLines"]) {
    assert.equal(key in (loaded ?? {}), false, `${key} must stay absent`);
  }
});

test("a legacy v2 profile keeps its palette but must not clear the brand header on apply", () => {
  const before = {
    ...DEMO_DEFAULT,
    brand: { logoUrl: "/keep.png", seriesName: "Keep", presenterLines: ["Keep me"] },
  };
  const profiled = applyStudioProfileToState(before, {
    version: 2,
    author: "Host",
    avatarUrl: "/a.png",
    avatarVisible: true,
    socialVisible: true,
    socials: [],
    theme: "light",
    colors: BRAND_COLORS,
  });
  assert.equal(profiled.theme, "light");
  assert.deepEqual(profiled.brand, before.brand);
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
  assert.deepEqual(profiled.sidebar.agendas.workbench.sections, DEMO_DEFAULT.sidebar.agendas.workbench.sections);
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

test("profileFromState extracts identity + the current brand palette + the header", () => {
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
    brand: {
      logoUrl: "/private-logo.png",
      seriesName: "Private Lecture Series",
      presenterLines: ["Chair of Nothing"],
    },
  };

  const profile = profileFromState({
    ...state,
    cover: { ...state.cover, title: "Stream-specific title" },
  });

  assert.deepEqual(profile, {
    version: 3,
    author: "Private Host",
    avatarUrl: "/private-avatar.png",
    avatarVisible: false,
    socialVisible: false,
    socials: [
      { visible: true, iconKey: "github", iconMode: "mono", label: "GitHub", value: "private-handle", customColor: "" },
    ],
    theme: "dark",
    colors: BRAND_COLORS,
    logoUrl: "/private-logo.png",
    seriesName: "Private Lecture Series",
    presenterLines: ["Chair of Nothing"],
  });
});

test("a v3 profile restores the lecture header + presenter lines on apply", () => {
  const profiled = applyStudioProfileToState(DEMO_DEFAULT, {
    version: 3,
    author: "Private Host",
    avatarUrl: "/a.png",
    avatarVisible: true,
    socialVisible: true,
    socials: [],
    logoUrl: "/logo.png",
    seriesName: "Frontiers of Public Policy",
    presenterLines: ["School of Social Sciences", "Director, Digital Economy Centre"],
  });
  assert.deepEqual(profiled.brand, {
    logoUrl: "/logo.png",
    seriesName: "Frontiers of Public Policy",
    presenterLines: ["School of Social Sciences", "Director, Digital Economy Centre"],
  });
  // Stream content is untouched.
  assert.equal(profiled.cover.title, DEMO_DEFAULT.cover.title);
});
