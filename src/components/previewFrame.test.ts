import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_STATE_BY_LOCALE } from "../types";
import { LIGHT_PRESET } from "../lib/theme";
import {
  calculatePreviewScale,
  formatPreviewMetrics,
  stateForLocaleChange,
} from "./OverlayBuilderApp";
import * as previewFrameModule from "./OverlayBuilderApp";

test("preview scale is derived from current native dimensions", () => {
  const container = { w: 1504, h: 742 };

  assert.equal(
    calculatePreviewScale(container, 1920, 1080),
    Math.min(container.w / 1920, container.h / 1080),
  );
  assert.equal(
    calculatePreviewScale(container, 3840, 2160),
    Math.min(container.w / 3840, container.h / 2160),
  );
});

test("preview metrics are formatted consistently", () => {
  assert.equal(
    formatPreviewMetrics({
      containerW: 1504,
      containerH: 742,
      scale: 0.3434895833333333,
      canvasW: 1319,
      canvasH: 742,
    }),
    "container 1504×742 · scale 0.3435 · canvas 1319×742",
  );
});

test("preview header layout allows metadata to wrap instead of overlapping", () => {
  const styles = (
    previewFrameModule as typeof previewFrameModule & {
      PREVIEW_HEADER_STYLES?: Record<string, Record<string, unknown>>;
    }
  ).PREVIEW_HEADER_STYLES;

  assert.ok(styles, "preview header styles should be exported for layout contract tests");
  assert.equal(styles.header?.flexWrap, "wrap");
  assert.equal(styles.leftGroup?.minWidth, 0);
  assert.equal(styles.hint?.whiteSpace, "normal");
  assert.equal(styles.rightGroup?.flexWrap, "wrap");
  assert.notEqual(styles.metrics?.whiteSpace, "nowrap");
  assert.equal(styles.metrics?.textAlign, "right");
});

test("locale changes keep the user's broadcast config, appearance and asset palette", () => {
  const current = {
    ...DEFAULT_STATE_BY_LOCALE.zh,
    cover: {
      ...DEFAULT_STATE_BY_LOCALE.zh.cover,
      title: "Custom Session",
      todayLabel: "我的标签",
      todayTopic: "用户自己的主题",
    },
    sidebar: {
      ...DEFAULT_STATE_BY_LOCALE.zh.sidebar,
      agendas: {
        ...DEFAULT_STATE_BY_LOCALE.zh.sidebar.agendas,
        workbench: {
          ...DEFAULT_STATE_BY_LOCALE.zh.sidebar.agendas.workbench,
          sections: [
            { title: "自定义段落", bullets: ["保留这一条"] },
            ...DEFAULT_STATE_BY_LOCALE.zh.sidebar.agendas.workbench.sections.slice(1),
          ],
        },
      },
    },
    theme: "light" as const,
    colors: { ...LIGHT_PRESET },
    activeTab: "wallpaper" as const,
  };

  const next = stateForLocaleChange(current, "en");

  assert.equal(next.theme, "light");
  assert.deepEqual(next.colors, LIGHT_PRESET);
  assert.equal(next.activeTab, "wallpaper");
  assert.equal(next.cover.title, "Custom Session");
  assert.equal(next.cover.todayLabel, "我的标签");
  assert.equal(next.cover.todayTopic, "用户自己的主题");
  assert.equal(next.sidebar.agendas.workbench.sections[0].title, "自定义段落");
  assert.deepEqual(next.sidebar.agendas.workbench.sections[0].bullets, ["保留这一条"]);
});

test("live-data persistence is keyed by the session locale, not UI language changes", () => {
  const src = readFileSync(resolve("src/components/OverlayBuilderApp.tsx"), "utf8");

  assert.match(src, /const liveDataLocaleRef = useRef\(locale\)/);
  assert.match(src, /fetchCurrentLiveData\(liveDataLocaleRef\.current/);
  assert.match(src, /saveRemoteLiveData\(liveDataLocaleRef\.current/);
  assert.match(src, /startRemoteLiveSession\(liveDataLocaleRef\.current/);
  assert.match(src, /endRemoteLiveSession\(liveDataLocaleRef\.current/);
  assert.doesNotMatch(src, /fetchCurrentLiveData\(locale/);
  assert.doesNotMatch(src, /saveRemoteLiveData\(locale/);
  assert.doesNotMatch(src, /startRemoteLiveSession\(locale/);
  assert.doesNotMatch(src, /endRemoteLiveSession\(locale/);
});
