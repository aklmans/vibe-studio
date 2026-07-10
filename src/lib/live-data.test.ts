import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE_BY_LOCALE } from "../types";
import {
  applyLiveDataToOverlayState,
  normalizeLiveDataSnapshot,
  overlayStateToLiveData,
} from "./live-data";

test("overlayStateToLiveData extracts only stream data from overlay state", () => {
  const base = DEFAULT_STATE_BY_LOCALE.en;
  const state = {
    ...base,
    sidebar: {
      ...base.sidebar,
      activeSection: 1,
      sectionsDone: [
        [true, false, false],
        [false, true, false],
        [false, false, true],
      ],
    },
    liveSession: {
      startedAt: "2026-05-10T16:00:00.000Z",
    },
    cover: {
      ...base.cover,
      title: "Do not persist visual title here",
    },
  };

  const liveData = overlayStateToLiveData(state, {
    id: "session-1",
    dateKey: "2026-05-10",
    locale: "en",
    title: "Live 2026-05-10",
    status: "live",
    startedAt: "2026-05-10T16:00:00.000Z",
    endedAt: null,
    createdAt: "2026-05-10T15:00:00.000Z",
    updatedAt: "2026-05-10T16:01:00.000Z",
  });

  assert.equal(liveData.session.id, "session-1");
  assert.equal(liveData.activeSection, 1);
  assert.equal(liveData.sections[0]?.tasks[0]?.done, true);
  assert.equal(liveData.sections[1]?.tasks[1]?.done, true);
  assert.equal(liveData.sections[2]?.tasks[2]?.done, true);
  assert.deepEqual(liveData.stackItems, base.stack.items.map((item) => item.label));
  assert.deepEqual(liveData.bottomBar.segments, base.bottomBar.segments);
  assert.equal("cover" in liveData, false);
});

test("applyLiveDataToOverlayState updates stream data while preserving visual settings", () => {
  const base = {
    ...DEFAULT_STATE_BY_LOCALE.en,
    activeTab: "live" as const,
    cover: {
      ...DEFAULT_STATE_BY_LOCALE.en.cover,
      title: "Keep this visual title",
    },
  };

  const next = applyLiveDataToOverlayState(base, {
    session: {
      id: "session-2",
      dateKey: "2026-05-11",
      locale: "en",
      title: "Live 2026-05-11",
      status: "ended",
      startedAt: "2026-05-11T16:00:00.000Z",
      endedAt: "2026-05-11T18:00:00.000Z",
      createdAt: "2026-05-11T15:00:00.000Z",
      updatedAt: "2026-05-11T18:00:00.000Z",
    },
    activeSection: 2,
    sections: [
      { title: "Goal", tasks: [{ text: "Ship DB", done: true }] },
      { title: "Problem", tasks: [{ text: "Keep simple", done: false }] },
      { title: "Log", tasks: [{ text: "Verified", done: true }] },
    ],
    bottomBar: {
      visible: false,
      segments: {
        workbench: [{ kind: "text", title: "Now", text: "Database-backed" }],
        lecture: [{ kind: "live" }],
        mobile: [{ kind: "live" }],
      },
    },
    stackItems: ["Next.js", "Postgres"],
  });

  assert.equal(next.activeTab, "live");
  assert.equal(next.cover.title, "Keep this visual title");
  assert.equal(next.sidebar.activeSection, 2);
  assert.equal(next.sidebar.sections[0]?.title, "Goal");
  assert.deepEqual(next.sidebar.sections[0]?.bullets, ["Ship DB"]);
  assert.deepEqual(next.sidebar.sectionsDone[0], [true]);
  assert.equal(next.bottomBar.visible, false);
  assert.deepEqual(next.bottomBar.segments.workbench, [
    { kind: "text", title: "Now", text: "Database-backed" },
  ]);
  assert.deepEqual(next.bottomBar.segments.lecture, [{ kind: "live" }]);
  assert.deepEqual(next.stack.items.map((item) => item.label), ["Next.js", "Postgres"]);
  assert.equal(next.stack.items[0].iconKey, "nextdotjs");
  assert.equal(next.liveSession.startedAt, "2026-05-11T16:00:00.000Z");
});

test("normalizeLiveDataSnapshot folds adjacent duplicate stream data", () => {
  const duplicated = {
    session: {
      id: "session-dup",
      dateKey: "2026-06-27",
      locale: "zh" as const,
      title: "Dup",
      status: "draft" as const,
      startedAt: "",
      endedAt: null,
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
    },
    activeSection: 5,
    sections: [
      {
        title: "今日目标",
        tasks: [
          { text: "配置直播画面", done: false },
          { text: "优化 AI 工作流", done: false },
          { text: "边做边解释", done: false },
        ],
      },
      {
        title: "今日目标",
        tasks: [
          { text: "配置直播画面", done: false },
          { text: "优化 AI 工作流", done: false },
          { text: "边做边解释", done: false },
        ],
      },
      {
        title: "当前问题",
        tasks: [
          { text: "哪一步最卡？", done: false },
          { text: "如何更简单？", done: false },
          { text: "下一步测什么？", done: false },
        ],
      },
      {
        title: "当前问题",
        tasks: [
          { text: "哪一步最卡？", done: false },
          { text: "如何更简单？", done: false },
          { text: "下一步测什么？", done: false },
        ],
      },
      {
        title: "输出记录",
        tasks: [
          { text: "已更新布局", done: false },
          { text: "已验证效果", done: false },
          { text: "下一步继续简化", done: false },
        ],
      },
      {
        title: "输出记录",
        tasks: [
          { text: "已更新布局", done: false },
          { text: "已验证效果", done: true },
          { text: "下一步继续简化", done: false },
        ],
      },
    ],
    bottomBar: {
      visible: true,
      segments: {
        workbench: [
          { kind: "live" as const },
          { kind: "live" as const },
          { kind: "progress" as const, sectionIndex: 5 },
          { kind: "progress" as const, sectionIndex: 5 },
          { kind: "stack" as const },
          { kind: "stack" as const },
        ],
        lecture: [{ kind: "live" as const }, { kind: "live" as const }],
        mobile: [{ kind: "live" as const }],
      },
    },
    stackItems: [
      "Claude Opus 4.7",
      "Claude Opus 4.7",
      "Cursor",
      "Cursor",
      "React + Vite",
      "React + Vite",
    ],
  };

  const normalized = normalizeLiveDataSnapshot(duplicated);

  assert.deepEqual(
    normalized.sections.map((section) => section.title),
    ["今日目标", "当前问题", "输出记录"],
  );
  assert.equal(normalized.activeSection, 2);
  assert.deepEqual(normalized.sections[2]?.tasks.map((task) => task.done), [false, true, false]);
  assert.deepEqual(normalized.bottomBar.segments.workbench, [
    { kind: "live" },
    { kind: "progress", sectionIndex: 2 },
    { kind: "stack" },
  ]);
  // Every profile is normalized independently — the lecture dup folds too.
  assert.deepEqual(normalized.bottomBar.segments.lecture, [{ kind: "live" }]);
  assert.deepEqual(normalized.stackItems, ["Claude Opus 4.7", "Cursor", "React + Vite"]);
});

test("applyLiveDataToOverlayState normalizes duplicated persisted snapshots", () => {
  const base = DEFAULT_STATE_BY_LOCALE.zh;
  const next = applyLiveDataToOverlayState(base, {
    session: {
      id: "session-dup",
      dateKey: "2026-06-27",
      locale: "zh",
      title: "Dup",
      status: "draft",
      startedAt: "",
      endedAt: null,
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
    },
    activeSection: 5,
    sections: [
      { title: "今日目标", tasks: [{ text: "配置直播画面", done: false }] },
      { title: "今日目标", tasks: [{ text: "配置直播画面", done: false }] },
      { title: "当前问题", tasks: [{ text: "哪一步最卡？", done: false }] },
      { title: "当前问题", tasks: [{ text: "哪一步最卡？", done: false }] },
      { title: "输出记录", tasks: [{ text: "已验证效果", done: true }] },
      { title: "输出记录", tasks: [{ text: "已验证效果", done: true }] },
    ],
    bottomBar: {
      visible: true,
      segments: {
        lecture: [{ kind: "live" }],
        mobile: [{ kind: "live" }],
        workbench: [
        { kind: "live" },
        { kind: "live" },
        { kind: "progress", sectionIndex: 5 },
        { kind: "progress", sectionIndex: 5 },
        { kind: "stack" },
        { kind: "stack" },
        ],
      },
    },
    stackItems: [
      "Claude Opus 4.7",
      "Claude Opus 4.7",
      "Cursor",
      "Cursor",
      "React + Vite",
      "React + Vite",
    ],
  });

  assert.deepEqual(
    next.sidebar.sections.map((section) => section.title),
    ["今日目标", "当前问题", "输出记录"],
  );
  assert.equal(next.sidebar.activeSection, 2);
  assert.deepEqual(next.bottomBar.segments.workbench, [
    { kind: "live" },
    { kind: "progress", sectionIndex: 2 },
    { kind: "stack" },
  ]);
  assert.deepEqual(next.stack.items.map((item) => item.label), [
    "Claude Opus 4.7",
    "Cursor",
    "React + Vite",
  ]);
});
