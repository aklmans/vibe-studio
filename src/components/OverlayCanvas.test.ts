import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OverlayCanvas from "./OverlayCanvas";
import { DEFAULT_STATE } from "../types";
import { LocaleProvider } from "../hooks/useLocale";

test("OverlayCanvas shows current focus card when camera frame is hidden", () => {
  const state = {
    ...DEFAULT_STATE,
    mainScreen: {
      ...DEFAULT_STATE.mainScreen,
      cameraVisible: false,
    },
    sidebar: {
      ...DEFAULT_STATE.sidebar,
      activeSection: 1,
      sections: [
        DEFAULT_STATE.sidebar.sections[0],
        {
          title: "当前问题",
          bullets: ["为什么重要？", "适合我吗？", "下一步做什么？"],
        },
        DEFAULT_STATE.sidebar.sections[2],
      ],
      sectionsDone: [
        ...DEFAULT_STATE.sidebar.sectionsDone.slice(0, 1),
        [true, false, false],
        ...DEFAULT_STATE.sidebar.sectionsDone.slice(2),
      ],
    },
    cover: {
      ...DEFAULT_STATE.cover,
      todayTopic: "读懂长期 Agent",
    },
  };

  const html = renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      {
        initialLocale: "zh",
        persist: false,
        children: React.createElement(OverlayCanvas, { state }),
      },
    ),
  );

  assert.match(html, /CURRENT FOCUS|当前焦点/);
  assert.match(html, /读懂长期 Agent/);
  assert.match(html, /适合我吗？/);
  assert.match(html, /下一步做什么？/);
  assert.doesNotMatch(html, /aria-label="[^"]*Camera/);
});
