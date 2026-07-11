import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PresenterIntro from "./PresenterIntro";
import { getLayout } from "../lib/overlay-layout";
import { withAgenda } from "../lib/agenda";
import { DEFAULT_STATE, type OverlayState } from "../types";
import { LocaleProvider } from "../hooks/useLocale";

function renderIntro(state: OverlayState): string {
  const rect = getLayout(state.layout).panels.intro;
  if (!rect) throw new Error("layout has no intro panel");
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: "zh",
      persist: false,
      children: React.createElement(PresenterIntro, { state, rect }),
    }),
  );
}

test("lecture intro card lists the LECTURE agenda; done is manual, not positional", () => {
  const base: OverlayState = { ...DEFAULT_STATE, layout: "lecture-left" };
  const state = withAgenda(base, "lecture", {
    ...base.sidebar.agendas.lecture,
    activeSection: 1,
    activeSectionStartedAt: "2026-07-10T20:15:00.000Z",
  });

  const html = renderIntro(state);

  assert.match(html, /data-testid="overlay-lecture-agenda"/);
  // Rows come from the lecture agenda defaults, not the workbench one.
  assert.match(html, /开场/);
  assert.match(html, /第一部分/);
  assert.doesNotMatch(html, /今日目标/);
  // Driving to section 1 does NOT strike section 0 — completion is manual.
  assert.match(html, /data-testid="lecture-agenda-row-0"/);
  assert.doesNotMatch(html, /line-through/);
  // Current section carries the timer with the 20m plan.
  assert.match(html, /20:00/);
  // Planned minutes render on non-current rows.
  assert.match(html, /10m/);
  // 4 sections ≤ 5-row window → no indicator.
  assert.doesNotMatch(html, /data-testid="lecture-agenda-window"/);

  // Checking a section off manually strikes it.
  const checked = withAgenda(state, "lecture", {
    ...state.sidebar.agendas.lecture,
    completed: [true, false, false, false],
  });
  const checkedHtml = renderIntro(checked);
  assert.match(checkedHtml, /line-through/);
});

test("lecture agenda card windows past 5 sections with a 0X–0Y / 0Z indicator", () => {
  const base: OverlayState = { ...DEFAULT_STATE, layout: "lecture-right" };
  const many = Array.from({ length: 8 }, (_, i) => ({
    title: `第 ${i + 1} 节`,
    bullets: [] as string[],
  }));
  const state = withAgenda(base, "lecture", {
    activeSection: 6,
    activeSectionStartedAt: "",
    sections: many,
    sectionsDone: many.map(() => []),
    completed: many.map(() => false),
  });

  const html = renderIntro(state);

  // Active 6 of 8 with a 5-row window → rows 04–08.
  assert.match(html, /data-testid="lecture-agenda-window"/);
  assert.match(html, /04–08 \/ 08/);
  assert.match(html, /data-testid="lecture-agenda-row-3"/);
  assert.doesNotMatch(html, /data-testid="lecture-agenda-row-2"/);
});

test("the mobile intro card stays identity-only (no agenda checklist)", () => {
  const state: OverlayState = { ...DEFAULT_STATE, layout: "mobile" };
  const html = renderIntro(state);

  assert.match(html, /data-testid="overlay-presenter-intro"/);
  assert.doesNotMatch(html, /data-testid="overlay-lecture-agenda"/);
});
