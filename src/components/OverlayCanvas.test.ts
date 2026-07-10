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
      agendas: {
        ...DEFAULT_STATE.sidebar.agendas,
        workbench: {
          ...DEFAULT_STATE.sidebar.agendas.workbench,
          activeSection: 1,
          sections: [
            DEFAULT_STATE.sidebar.agendas.workbench.sections[0],
            {
              title: "当前问题",
              bullets: ["为什么重要？", "适合我吗？", "下一步做什么？"],
            },
            DEFAULT_STATE.sidebar.agendas.workbench.sections[2],
          ],
          sectionsDone: [
            ...DEFAULT_STATE.sidebar.agendas.workbench.sectionsDone.slice(0, 1),
            [true, false, false],
            ...DEFAULT_STATE.sidebar.agendas.workbench.sectionsDone.slice(2),
          ],
        },
      },
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

test("OverlayCanvas main screen frame matches a 3840x2160 capture ratio", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(OverlayCanvas, { state: DEFAULT_STATE }),
    }),
  );

  assert.match(
    html,
    /left:24px;top:24px;width:1440px;height:810px/,
  );
});

test("OverlayCanvas main screen is a transparent OBS frame, not a filled placeholder", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "en",
      persist: false,
      children: React.createElement(OverlayCanvas, { state: DEFAULT_STATE }),
    }),
  );

  assert.match(html, /data-testid="overlay-backdrop"/);
  assert.match(html, /M24 24H1464V834H24Z/);
  assert.match(html, /data-testid="overlay-main-screen-frame"[^>]*background:transparent/);
  assert.doesNotMatch(html, /VIBE STUDIO/);
});
