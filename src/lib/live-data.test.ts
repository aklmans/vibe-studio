import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE_BY_LOCALE } from "../types";
import {
  applyLiveDataToOverlayState,
  normalizeLiveDataSnapshot,
  overlayStateToLiveData,
  type LiveAgendaData,
} from "./live-data";

const EMPTY_AGENDA: LiveAgendaData = { activeSection: 0, sections: [] };

test("overlayStateToLiveData extracts every profile's agenda from overlay state", () => {
  const base = DEFAULT_STATE_BY_LOCALE.en;
  const state = {
    ...base,
    sidebar: {
      ...base.sidebar,
      agendas: {
        ...base.sidebar.agendas,
        workbench: {
          ...base.sidebar.agendas.workbench,
          activeSection: 1,
          sectionsDone: [
            [true, false, false],
            [false, true, false],
            [false, false, true],
          ],
        },
        lecture: {
          ...base.sidebar.agendas.lecture,
          activeSection: 2,
          completed: [true, false, false, false],
        },
      },
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
  assert.equal(liveData.agendas.workbench.activeSection, 1);
  assert.equal(liveData.agendas.workbench.sections[0]?.tasks[0]?.done, true);
  assert.equal(liveData.agendas.workbench.sections[1]?.tasks[1]?.done, true);
  assert.equal(liveData.agendas.workbench.sections[2]?.tasks[2]?.done, true);
  // The lecture scene's agenda persists too — with its own active index.
  assert.equal(liveData.agendas.lecture.activeSection, 2);
  assert.equal(
    liveData.agendas.lecture.sections.length,
    base.sidebar.agendas.lecture.sections.length,
  );
  assert.equal(liveData.agendas.lecture.sections[0]?.minutes, 5);
  // Manual completion persists per section.
  assert.equal(liveData.agendas.lecture.sections[0]?.done, true);
  assert.equal("done" in (liveData.agendas.lecture.sections[1] ?? {}), false);
  assert.deepEqual(liveData.stackItems, base.stack.items.map((item) => item.label));
  assert.deepEqual(liveData.bottomBar.segments, base.bottomBar.segments);
  assert.equal("cover" in liveData, false);
});

test("applyLiveDataToOverlayState updates per-profile agendas while preserving visuals + timers", () => {
  const base = {
    ...DEFAULT_STATE_BY_LOCALE.en,
    activeTab: "live" as const,
    cover: {
      ...DEFAULT_STATE_BY_LOCALE.en.cover,
      title: "Keep this visual title",
    },
    sidebar: {
      ...DEFAULT_STATE_BY_LOCALE.en.sidebar,
      agendas: {
        ...DEFAULT_STATE_BY_LOCALE.en.sidebar.agendas,
        lecture: {
          ...DEFAULT_STATE_BY_LOCALE.en.sidebar.agendas.lecture,
          // A running lecture timer — the snapshot must not clobber it.
          activeSectionStartedAt: "2026-05-11T16:30:00.000Z",
        },
      },
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
    agendas: {
      workbench: {
        activeSection: 2,
        sections: [
          { title: "Goal", tasks: [{ text: "Ship DB", done: true }] },
          { title: "Problem", tasks: [{ text: "Keep simple", done: false }] },
          { title: "Log", tasks: [{ text: "Verified", done: true }] },
        ],
      },
      lecture: {
        activeSection: 1,
        sections: [
          { title: "开场", minutes: 5, done: true, tasks: [] },
          { title: "主体", minutes: 30, tasks: [] },
        ],
      },
      mobile: EMPTY_AGENDA,
    },
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
  assert.equal(next.sidebar.agendas.workbench.activeSection, 2);
  assert.equal(next.sidebar.agendas.workbench.sections[0]?.title, "Goal");
  assert.deepEqual(next.sidebar.agendas.workbench.sections[0]?.bullets, ["Ship DB"]);
  assert.deepEqual(next.sidebar.agendas.workbench.sectionsDone[0], [true]);
  // The lecture agenda landed in its own profile, minutes intact…
  assert.equal(next.sidebar.agendas.lecture.activeSection, 1);
  assert.equal(next.sidebar.agendas.lecture.sections[1]?.minutes, 30);
  assert.deepEqual(next.sidebar.agendas.lecture.completed, [true, false]);
  assert.deepEqual(next.sidebar.agendas.lecture.sections[0]?.bullets, []);
  // …and the runtime section timer survived the apply.
  assert.equal(
    next.sidebar.agendas.lecture.activeSectionStartedAt,
    "2026-05-11T16:30:00.000Z",
  );
  assert.equal(next.bottomBar.visible, false);
  assert.deepEqual(next.bottomBar.segments.workbench, [
    { kind: "text", title: "Now", text: "Database-backed" },
  ]);
  assert.deepEqual(next.bottomBar.segments.lecture, [{ kind: "live" }]);
  assert.deepEqual(next.stack.items.map((item) => item.label), ["Next.js", "Postgres"]);
  assert.equal(next.stack.items[0].iconKey, "nextdotjs");
  assert.equal(next.liveSession.startedAt, "2026-05-11T16:00:00.000Z");
});

test("normalizeLiveDataSnapshot folds adjacent duplicates per profile", () => {
  const dupSection = (title: string, tasks: { text: string; done: boolean }[]) => ({
    title,
    tasks,
  });
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
    agendas: {
      workbench: {
        activeSection: 5,
        sections: [
          dupSection("今日目标", [{ text: "配置直播画面", done: false }]),
          dupSection("今日目标", [{ text: "配置直播画面", done: false }]),
          dupSection("当前问题", [{ text: "哪一步最卡？", done: false }]),
          dupSection("当前问题", [{ text: "哪一步最卡？", done: false }]),
          dupSection("输出记录", [{ text: "已验证效果", done: false }]),
          dupSection("输出记录", [{ text: "已验证效果", done: true }]),
        ],
      },
      lecture: {
        activeSection: 3,
        sections: [
          dupSection("开场", []),
          dupSection("开场", []),
          dupSection("主体", []),
          dupSection("答疑", []),
        ],
      },
      mobile: EMPTY_AGENDA,
    },
    bottomBar: {
      visible: true,
      segments: {
        workbench: [
          { kind: "live" as const },
          { kind: "live" as const },
          { kind: "progress" as const, sectionIndex: 5 },
          { kind: "progress" as const, sectionIndex: 5 },
          { kind: "stack" as const },
        ],
        // The lecture bar's progress indexes the LECTURE agenda: dup section 1
        // folds into 0, so index 1 (主体) remaps to 1 in the deduped list.
        lecture: [
          { kind: "live" as const },
          { kind: "progress" as const, sectionIndex: 2 },
        ],
        mobile: [{ kind: "live" as const }],
      },
    },
    stackItems: ["Cursor", "Cursor", "React + Vite"],
  };

  const normalized = normalizeLiveDataSnapshot(duplicated);

  assert.deepEqual(
    normalized.agendas.workbench.sections.map((section) => section.title),
    ["今日目标", "当前问题", "输出记录"],
  );
  assert.equal(normalized.agendas.workbench.activeSection, 2);
  // The done flag from the folded duplicate survives the merge.
  assert.deepEqual(
    normalized.agendas.workbench.sections[2]?.tasks.map((task) => task.done),
    [true],
  );
  assert.deepEqual(normalized.bottomBar.segments.workbench, [
    { kind: "live" },
    { kind: "progress", sectionIndex: 2 },
    { kind: "stack" },
  ]);

  // The lecture agenda dedupes independently, and ITS bar remaps against the
  // lecture indexMap — not the workbench one.
  assert.deepEqual(
    normalized.agendas.lecture.sections.map((section) => section.title),
    ["开场", "主体", "答疑"],
  );
  assert.equal(normalized.agendas.lecture.activeSection, 2);
  assert.deepEqual(normalized.bottomBar.segments.lecture, [
    { kind: "live" },
    { kind: "progress", sectionIndex: 1 },
  ]);
  assert.deepEqual(normalized.stackItems, ["Cursor", "React + Vite"]);
});
