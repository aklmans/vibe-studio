import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE } from "../types";
import { overlayStateToConfig } from "./live-studio-config";
import {
  applyConfigText,
  beginEditing,
  displayedConfigText,
  initialDriftState,
  isChangedUnderneath,
  parseConfigText,
  projectConfigText,
  resyncToState,
} from "./session-config-drift";

const withTitle = (title: string) => ({
  ...DEFAULT_STATE,
  cover: { ...DEFAULT_STATE.cover, title },
});

test("synced projection follows the current state (no mount-time drift)", () => {
  const a = projectConfigText(withTitle("Alpha"));
  const b = projectConfigText(withTitle("Bravo"));
  assert.notEqual(a, b);
  assert.match(a, /"title": "Alpha"/);
  // Synced view shows the live projection, so an external state change updates it.
  assert.equal(displayedConfigText(initialDriftState, a), a);
  assert.equal(displayedConfigText(initialDriftState, b), b);
});

test("editing detaches a buffer from the projection", () => {
  const projected = projectConfigText(DEFAULT_STATE);
  const drift = beginEditing(initialDriftState, projected, `${projected}\n// edit`);
  assert.equal(drift.mode, "editing");
  assert.equal(drift.baseProjection, projected);
  assert.equal(displayedConfigText(drift, projected), `${projected}\n// edit`);
});

test("a form change under an editing buffer is flagged, not silently merged", () => {
  const base = projectConfigText(withTitle("Original"));
  const drift = beginEditing(
    initialDriftState,
    base,
    base.replace("Original", "USER EDIT"),
  );
  // The form changes the underlying config while the buffer is open.
  const changedProjection = projectConfigText(withTitle("Form Changed"));
  assert.equal(isChangedUnderneath(drift, changedProjection), true);
  // The user's buffer is preserved — not overwritten by the form projection.
  const shown = displayedConfigText(drift, changedProjection);
  assert.match(shown, /USER EDIT/);
  assert.doesNotMatch(shown, /Form Changed/);
});

test("the base projection is captured once, not on every keystroke", () => {
  const base = projectConfigText(withTitle("Original"));
  let drift = beginEditing(initialDriftState, base, "draft-1");
  // A second keystroke (still editing) keeps the original base projection.
  drift = beginEditing(drift, projectConfigText(withTitle("Moved")), "draft-2");
  assert.equal(drift.baseProjection, base);
  assert.equal(drift.draft, "draft-2");
});

test("resync drops the buffer and returns to the current projection", () => {
  const drift = beginEditing(initialDriftState, "x", "dirty buffer");
  const resynced = resyncToState();
  assert.equal(resynced.mode, "synced");
  const projected = projectConfigText(withTitle("Now"));
  assert.equal(displayedConfigText(resynced, projected), projected);
  assert.equal(isChangedUnderneath(resynced, projected), false);
});

test("apply writes a valid config to state and returns to synced", () => {
  const text = projectConfigText(withTitle("Before")).replace(
    "Before",
    "AFTER APPLY",
  );
  const result = applyConfigText(DEFAULT_STATE, text);
  assert.equal(result.ok, true);
  assert.equal(result.nextState?.cover.title, "AFTER APPLY");
  assert.equal(result.nextDrift.mode, "synced");
});

test("apply rejects invalid JSON without producing a state", () => {
  const result = applyConfigText(DEFAULT_STATE, "{ not json ");
  assert.equal(result.ok, false);
  assert.equal(result.nextState, null);
  assert.equal(result.parse.ok, false);
  if (!result.parse.ok) assert.equal(result.parse.reason, "json");
});

test("parse reports empty input distinctly", () => {
  const parse = parseConfigText("   ");
  assert.equal(parse.ok, false);
  if (!parse.ok) assert.equal(parse.reason, "empty");
});

test("v1 config is the portable core, not the whole Session Config page", () => {
  const config = overlayStateToConfig(DEFAULT_STATE) as unknown as Record<
    string,
    unknown
  >;
  // Runtime / display fields are intentionally NOT part of v1.
  assert.equal("bottomBar" in config, false);
  assert.equal("liveSession" in config, false);
  assert.equal("activeSection" in config, false);
  assert.equal("sectionsDone" in config, false);

  // And Apply rebuilds those runtime fields to v1 defaults rather than
  // preserving them — so "form and JSON are the same config" must never be
  // mistaken for "the JSON owns the entire page".
  const runtimeState = {
    ...DEFAULT_STATE,
    sidebar: { ...DEFAULT_STATE.sidebar, activeSection: 2 },
    bottomBar: {
      ...DEFAULT_STATE.bottomBar,
      segments: {
        ...DEFAULT_STATE.bottomBar.segments,
        workbench: [DEFAULT_STATE.bottomBar.segments.workbench[0]],
      },
    },
  };
  const applied = applyConfigText(
    runtimeState,
    projectConfigText(runtimeState),
  ).nextState;
  assert.equal(applied?.sidebar.activeSection, 0);
  assert.equal(applied?.bottomBar.segments.workbench.length, 3);
});
