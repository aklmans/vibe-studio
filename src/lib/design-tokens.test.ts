import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_THEME_CSS_VARIABLES,
  APP_THEME_TOKENS,
  applyAppAppearance,
  getAppAppearanceBootScript,
  getAppThemeCssVariables,
  getAppThemeTokens,
} from "./design-tokens";

test("app appearance exposes distinct warm light and dark shell tokens", () => {
  assert.equal(getAppThemeTokens("dark").shellBg, "#1a1a1a");
  assert.equal(getAppThemeTokens("light").shellBg, "#f7f4ee");
  assert.equal(getAppThemeTokens("light").text, "#1a1a1a");
  assert.equal(getAppThemeTokens("dark").text, "#fafafa");
  assert.equal(APP_THEME_TOKENS.light.accent, "#c95f3d");
  assert.equal(APP_THEME_TOKENS.dark.accent, "#e8835b");
});

test("app appearance tokens map to CSS variables used by the shell", () => {
  const lightVars = getAppThemeCssVariables("light");
  const darkVars = getAppThemeCssVariables("dark");

  assert.equal(lightVars["--live-shell-bg"], APP_THEME_TOKENS.light.shellBg);
  assert.equal(lightVars["--live-app-surface"], APP_THEME_TOKENS.light.appSurface);
  assert.equal(lightVars["--background"], APP_THEME_TOKENS.light.tailwind.background);
  assert.equal(darkVars["--live-shell-bg"], APP_THEME_TOKENS.dark.shellBg);
  assert.equal(darkVars["--background"], APP_THEME_TOKENS.dark.tailwind.background);
  assert.equal(APP_THEME_CSS_VARIABLES.shellBg, "var(--live-shell-bg)");
  assert.equal(APP_THEME_CSS_VARIABLES.accent, "var(--live-accent)");
});

test("applyAppAppearance writes appearance variables to a root element", () => {
  const written = new Map<string, string>();
  const root = {
    dataset: {} as Record<string, string>,
    style: {
      setProperty(name: string, value: string) {
        written.set(name, value);
      },
    },
  };

  applyAppAppearance("light", root);

  assert.equal(root.dataset.appearance, "light");
  assert.equal(written.get("--live-shell-bg"), APP_THEME_TOKENS.light.shellBg);
  assert.equal(written.get("--foreground"), APP_THEME_TOKENS.light.tailwind.foreground);
  assert.equal(written.get("--ring"), APP_THEME_TOKENS.light.tailwind.ring);
});

function runAppearanceBootScript(rawState: string | null) {
  const written = new Map<string, string>();
  let requestedKey = "";
  const root = {
    dataset: {} as Record<string, string>,
    style: {
      setProperty(name: string, value: string) {
        written.set(name, value);
      },
    },
  };
  const document = {
    documentElement: root,
  };
  const localStorage = {
    getItem(key: string) {
      requestedKey = key;
      return rawState;
    },
  };

  new Function("document", "localStorage", getAppAppearanceBootScript())(
    document,
    localStorage,
  );

  return { root, requestedKey, written };
}

test("appearance boot script reads saved light theme before hydration", () => {
  const { root, requestedKey, written } = runAppearanceBootScript(
    JSON.stringify({ theme: "light" }),
  );

  assert.equal(requestedKey, "vibe-overlay-state");
  assert.equal(root.dataset.appearance, "light");

  for (const [name, value] of Object.entries(getAppThemeCssVariables("light"))) {
    assert.equal(written.get(name), value, name);
  }
});

test("appearance boot script writes dark variables from app tokens", () => {
  const { root, written } = runAppearanceBootScript(
    JSON.stringify({ theme: "dark" }),
  );

  assert.equal(root.dataset.appearance, "dark");

  for (const [name, value] of Object.entries(getAppThemeCssVariables("dark"))) {
    assert.equal(written.get(name), value, name);
  }
});

test("appearance boot script migrates legacy theme values and falls back dark", () => {
  assert.equal(
    runAppearanceBootScript(JSON.stringify({ theme: "editorial" })).root.dataset
      .appearance,
    "light",
  );
  assert.equal(
    runAppearanceBootScript(JSON.stringify({ theme: "neon" })).root.dataset
      .appearance,
    "dark",
  );
  assert.equal(
    runAppearanceBootScript(JSON.stringify({ theme: "unknown" })).root.dataset
      .appearance,
    "dark",
  );
  assert.equal(
    runAppearanceBootScript("{bad json").root.dataset.appearance,
    "dark",
  );
});
