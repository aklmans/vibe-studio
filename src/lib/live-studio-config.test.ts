import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { DEFAULT_STATE } from "../types";
import {
  configToOverlayState,
  formatLiveStudioConfigJson,
  overlayStateToConfig,
  parseLiveStudioConfigJson,
  validateLiveStudioConfig,
} from "./live-studio-config";

test("parseLiveStudioConfigJson accepts a useful v1 config", () => {
  const config = parseLiveStudioConfigJson(JSON.stringify({
    version: 1,
    title: "Build with Agents",
    subtitle: "Multi-Agent Coding Live",
    author: "Aklman",
    profile: { avatarUrl: "/broadcast-avatar.png", avatarVisible: true },
    cover: { visual: "avatar", portraitUrl: "/avatar.png" },
    badges: ["claude", "codex"],
    stack: ["Codex", "Cursor", "OBS"],
    socials: [
      { icon: "github", label: "GitHub", value: "demo-org/vibe-live" },
      { icon: "website", label: "Website", value: "example.com" },
    ],
    sections: [
      { title: "Today", bullets: ["Prepare", "Build", "Verify"] },
      { title: "Problem", bullets: ["What is stuck?", "What can shrink?", "What to test?"] },
      { title: "Log", bullets: ["Drafted", "Checked", "Ready"] },
    ],
  }));

  assert.equal(config?.title, "Build with Agents");
  assert.equal(config?.profile?.avatarUrl, "/broadcast-avatar.png");
  assert.equal(config?.badges[0], "claude");
  assert.equal(config?.sections.length, 3);
});

test("validateLiveStudioConfig reports missing essentials", () => {
  const result = validateLiveStudioConfig({ version: 1, title: "" });
  assert.equal(result.valid, false);
  assert.match(result.issues.join("\n"), /title/);
  assert.match(result.issues.join("\n"), /subtitle/);
  assert.match(result.issues.join("\n"), /sections/);
});

test("validateLiveStudioConfig rejects unsupported config versions", () => {
  const result = validateLiveStudioConfig({
    version: 2,
    title: "Build",
    subtitle: "Config",
    sections: [{ title: "Goal", bullets: ["Ship"] }],
  });

  assert.equal(result.valid, false);
  assert.match(result.issues.join("\n"), /version/);
  assert.equal(parseLiveStudioConfigJson(JSON.stringify({
    version: 2,
    title: "Build",
    subtitle: "Config",
    sections: [{ title: "Goal", bullets: ["Ship"] }],
  })), null);
});

test("validateLiveStudioConfig rejects unsupported registry and cover values", () => {
  const invalid = {
    version: 1,
    title: "Build",
    subtitle: "Config",
    cover: { visual: "collage" },
    badges: ["claude", "unknown-agent"],
    socials: [{ icon: "not-a-social-icon", label: "Mystery", value: "handle" }],
    sections: [
      { title: "", bullets: ["Ship"] },
      { title: "Empty", bullets: [] },
    ],
  };
  const result = validateLiveStudioConfig(invalid);
  const issues = result.issues.join("\n");

  assert.equal(result.valid, false);
  assert.match(issues, /cover\.visual/);
  assert.match(issues, /badges\[1\]/);
  assert.match(issues, /socials\[0\]\.icon/);
  assert.match(issues, /sections\[0\]\.title/);
  assert.match(issues, /sections\[1\]\.bullets/);
  assert.equal(parseLiveStudioConfigJson(JSON.stringify(invalid)), null);
});

test("badge config accepts LobeHub-backed labels and ignores generic AI placeholders", () => {
  const parsed = parseLiveStudioConfigJson(JSON.stringify({
    version: 1,
    title: "Build",
    subtitle: "Config",
    badges: ["Claude Code", "ChatGPT", "Z.ai", "AI/LLM", "LLM"],
    stack: ["React", "Next.js"],
    socials: [],
    sections: [{ title: "Goal", bullets: ["Ship"] }],
  }));

  assert.deepEqual(parsed?.badges, ["claude-code", "chatgpt", "z-ai"]);

  const genericOnly = validateLiveStudioConfig({
    version: 1,
    title: "Build",
    subtitle: "Config",
    badges: ["AI", "LLM"],
    stack: ["React"],
    socials: [],
    sections: [{ title: "Goal", bullets: ["Ship"] }],
  });
  assert.equal(genericOnly.valid, true);
});

test("badge config rejects non AI/LLM registry keys with allowed-key guidance", () => {
  const result = validateLiveStudioConfig({
    version: 1,
    title: "Build",
    subtitle: "Config",
    badges: ["react", "unknown-agent"],
    stack: ["React", "Next.js"],
    socials: [],
    sections: [{ title: "Goal", bullets: ["Ship"] }],
  });
  const issues = result.issues.join("\n");

  assert.equal(result.valid, false);
  assert.match(issues, /badges\[0\] is not supported/);
  assert.match(issues, /Allowed badge keys:/);
  assert.match(issues, /claude-code/);
  assert.match(issues, /chatgpt/);
});

test("configToOverlayState applies all broadcast surfaces", () => {
  const next = configToOverlayState({
    ...DEFAULT_STATE,
    bottomBar: {
      visible: false,
      segments: [{ kind: "text", title: "Old", text: "Old" }],
    },
    cover: {
      ...DEFAULT_STATE.cover,
      avatarUrl: "/old-shared-avatar.png",
      avatarVisible: false,
    },
    wallpaper: {
      ...DEFAULT_STATE.wallpaper,
      avatarVisible: false,
    },
  }, {
    version: 1,
    title: "Config Driven Studio",
    subtitle: "One file, every surface",
    author: "Aklman",
    profile: {
      avatarUrl: "/broadcast-avatar.png",
      avatarVisible: true,
    },
    cover: {
      visual: "scene",
      portraitUrl: "/cover-portrait.png",
      sceneUrl: "/vibe-studio-bg.png",
    },
    badges: ["claude", "codex", "kimi"],
    stack: ["Codex", "Next.js", "OBS"],
    socials: [{ icon: "github", label: "GitHub", value: "demo-org/vibe-live" }],
    sections: [
      { title: "Goal", bullets: ["A", "B", "C"] },
      { title: "Problem", bullets: ["D", "E", "F"] },
      { title: "Log", bullets: ["G", "H", "I"] },
    ],
  });

  assert.equal(next.cover.title, "Config Driven Studio");
  assert.equal(next.cover.todayTopic, "One file, every surface");
  assert.equal(next.cover.hookText, "with Aklman");
  assert.equal(next.cover.visual, "scene");
  assert.equal(next.cover.avatarUrl, "/broadcast-avatar.png");
  assert.equal(next.cover.avatarVisible, true);
  assert.equal(next.wallpaper.avatarVisible, true);
  assert.equal(next.cover.portraitUrl, "/cover-portrait.png");
  assert.equal(next.cover.sceneUrl, "/vibe-studio-bg.png");
  assert.deepEqual(next.sidebar.sections.map((s) => s.title), ["Goal", "Problem", "Log"]);
  assert.deepEqual(next.sidebar.sectionsDone, [
    [false, false, false],
    [false, false, false],
    [false, false, false],
  ]);
  assert.deepEqual(next.stack.items.map((item) => item.label), ["Codex", "Next.js", "OBS"]);
  assert.equal(next.cover.badges.length, 3);
  assert.equal(next.cover.socials[0]?.value, "demo-org/vibe-live");
  assert.equal(next.bottomBar.visible, true);
  assert.deepEqual(next.bottomBar.segments, [
    { kind: "live" },
    { kind: "progress", sectionIndex: 0 },
    { kind: "stack" },
  ]);
});

test("configToOverlayState respects an explicit empty badges array", () => {
  const next = configToOverlayState(DEFAULT_STATE, {
    version: 1,
    title: "No Badge Stream",
    subtitle: "Use badges only when they match",
    author: "Aklman",
    profile: {
      avatarUrl: "/broadcast-avatar.png",
      avatarVisible: true,
    },
    cover: {
      visual: "avatar",
      portraitUrl: "/cover-portrait.png",
      sceneUrl: "/vibe-studio-bg.png",
    },
    badges: [],
    stack: ["Claude Opus", "Codex", "React + Vite"],
    socials: [],
    sections: [{ title: "Goal", bullets: ["A"] }],
  });

  assert.deepEqual(next.cover.badges, []);
});

test("overlayStateToConfig exports a reusable config", () => {
  const config = overlayStateToConfig(DEFAULT_STATE);
  const json = formatLiveStudioConfigJson(config);
  const parsed = parseLiveStudioConfigJson(json);
  assert.equal(parsed?.version, 1);
  assert.equal(parsed?.title, DEFAULT_STATE.cover.title);
  assert.deepEqual(parsed?.profile, {
    avatarUrl: DEFAULT_STATE.cover.avatarUrl,
    avatarVisible: DEFAULT_STATE.cover.avatarVisible,
  });
  assert.equal(parsed?.sections.length, DEFAULT_STATE.sidebar.sections.length);
});

test("example live studio config is parseable and valid", () => {
  const raw = readFileSync(resolve("docs/live-session.config.example.json"), "utf8");
  const parsed = parseLiveStudioConfigJson(raw);
  const validation = validateLiveStudioConfig(JSON.parse(raw));

  assert.equal(validation.valid, true);
  assert.equal(parsed?.version, 1);
  assert.equal(parsed?.title, "Building With Agents");
});

test("section minutes round-trip config -> state -> config, and bad values are rejected", () => {
  const config = parseLiveStudioConfigJson(
    JSON.stringify({
      version: 1,
      title: "T",
      subtitle: "S",
      badges: [],
      stack: [],
      socials: [],
      sections: [
        { title: "One", minutes: 30, bullets: ["a"] },
        { title: "Two", bullets: ["b"] }, // unplanned stays unplanned
        { title: "Three", minutes: 12.9, bullets: ["c"] }, // floors to 12
      ],
    }),
  );
  assert.ok(config);
  assert.equal(config.sections[0].minutes, 30);
  assert.equal(config.sections[1].minutes, undefined);
  assert.equal(config.sections[2].minutes, 12);

  const state = configToOverlayState(DEFAULT_STATE, config);
  assert.equal(state.sidebar.sections[0].minutes, 30);
  assert.equal(state.sidebar.sections[1].minutes, undefined);
  // Applying a config resets the section timer for a fresh agenda.
  assert.equal(state.sidebar.activeSectionStartedAt, "");

  const back = overlayStateToConfig(state);
  assert.equal(back.sections[0].minutes, 30);
  assert.equal("minutes" in back.sections[1], false);

  const validation = validateLiveStudioConfig({
    version: 1,
    title: "T",
    subtitle: "S",
    badges: [],
    stack: [],
    socials: [],
    sections: [{ title: "One", minutes: -5, bullets: ["a"] }],
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.includes("minutes")));
});
