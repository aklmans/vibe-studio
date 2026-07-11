import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE_BY_LOCALE, DEMO_STATE_BY_LOCALE, type OverlayState } from "../types";
import { prepareNextSessionState } from "./next-session";
import type { StudioProfile } from "./studio-profile";

function richState(): OverlayState {
  const base = DEMO_STATE_BY_LOCALE.en;
  return {
    ...base,
    layout: "lecture-left",
    theme: "light",
    liveSession: { startedAt: "2026-07-10T12:00:00.000Z" },
    cover: { ...base.cover, title: "Rust from Scratch", hookText: "with 阿彬" },
    stack: { items: [{ label: "Rust", iconKey: "react", iconMode: "mono" }] },
  };
}

const PROFILE: StudioProfile = {
  version: 3,
  author: "阿彬",
  avatarUrl: "/avatar.png",
  avatarVisible: true,
  socialVisible: true,
  socials: [
    { visible: true, iconKey: "bilibili", iconMode: "mono", label: "B站", value: "space-1", customColor: "" },
  ],
};

test("prepare next session clears content but keeps brand + presentation", () => {
  const state = richState();
  const next = prepareNextSessionState(state, PROFILE, "en");

  // Cleared back to locale defaults.
  assert.equal(next.cover.title, DEFAULT_STATE_BY_LOCALE.en.cover.title);
  assert.equal(next.stack.items[0].label, DEFAULT_STATE_BY_LOCALE.en.stack.items[0].label);
  assert.equal(
    next.sidebar.agendas.lecture.sections.length,
    DEFAULT_STATE_BY_LOCALE.en.sidebar.agendas.lecture.sections.length,
  );
  assert.equal(next.liveSession.startedAt, "");

  // Brand survives.
  assert.equal(next.cover.hookText, "with 阿彬");
  assert.equal(next.cover.avatarUrl, "/avatar.png");
  assert.equal(next.cover.socials[0].value, "space-1");

  // Presentation survives.
  assert.equal(next.layout, "lecture-left");
  assert.equal(next.theme, "light");
  assert.deepEqual(next.mainScreen, state.mainScreen);
  assert.deepEqual(next.bottomBar.segments.lecture, state.bottomBar.segments.lecture);
});

test("prepare next session keeps identity even without a saved profile", () => {
  const state = richState();
  const next = prepareNextSessionState(state, null, "en");

  // Identity is derived from the current state — a host who never pressed
  // "Save as Brand" still keeps their name on the next stream.
  assert.equal(next.cover.hookText, "with 阿彬");
  assert.equal(next.cover.title, DEFAULT_STATE_BY_LOCALE.en.cover.title);
  assert.equal(next.layout, "lecture-left");
});
