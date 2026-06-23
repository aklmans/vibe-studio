import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "../hooks/useLocale";
import { DEFAULT_STATE } from "../types";
import SidebarSections from "./SidebarSections";

function renderSidebarSections(locale: "zh" | "en") {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, {
      initialLocale: locale,
      persist: false,
      children: React.createElement(SidebarSections, { state: DEFAULT_STATE }),
    }),
  );
}

test("Sidebar current marker is localized in Chinese", () => {
  const html = renderSidebarSections("zh");

  assert.match(html, />当前</);
  assert.doesNotMatch(html, />Now</);
});

test("Sidebar current marker remains clear in English", () => {
  const html = renderSidebarSections("en");

  assert.match(html, />Now</);
});
