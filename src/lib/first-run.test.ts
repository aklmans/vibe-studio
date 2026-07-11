import assert from "node:assert/strict";
import test from "node:test";
import { shouldPersistOverlayDraft, shouldShowFirstRun } from "./first-run";

/*
 * F-1 refresh contract, simulated at the logic layer with a tiny storage
 * model: the draft only exists once an autosave was ALLOWED to run.
 */

test("a blank studio shows the wizard and survives a mid-wizard refresh (F-1 §1)", () => {
  // Fresh boot: nothing stored.
  let draftStored = false;
  const boot = () =>
    shouldShowFirstRun({ demoMode: false, hasStoredDraft: draftStored, hasBrandProfile: false });

  assert.equal(boot(), true); // wizard opens

  // While the wizard is open the autosave must not run…
  assert.equal(shouldPersistOverlayDraft({ demoMode: false, firstRunOpen: true }), false);
  // …so a refresh mid-wizard still finds a blank studio: wizard again.
  assert.equal(draftStored, false);
  assert.equal(boot(), true);
});

test("completing or skipping records the decision; the wizard never returns (F-1 §2)", () => {
  let draftStored = false;

  // Both finish and skip close the wizard; persistence resumes and the next
  // autosave writes the draft.
  const firstRunOpen = false;
  if (shouldPersistOverlayDraft({ demoMode: false, firstRunOpen })) draftStored = true;
  assert.equal(draftStored, true);

  // Any number of later boots: no wizard.
  for (let i = 0; i < 3; i += 1) {
    assert.equal(
      shouldShowFirstRun({ demoMode: false, hasStoredDraft: draftStored, hasBrandProfile: false }),
      false,
    );
  }
});

test("existing users never see the wizard (F-1 §3)", () => {
  // A pre-upgrade user has a draft, a brand profile, or both — all suppress it.
  assert.equal(
    shouldShowFirstRun({ demoMode: false, hasStoredDraft: true, hasBrandProfile: false }),
    false,
  );
  assert.equal(
    shouldShowFirstRun({ demoMode: false, hasStoredDraft: false, hasBrandProfile: true }),
    false,
  );
  assert.equal(
    shouldShowFirstRun({ demoMode: false, hasStoredDraft: true, hasBrandProfile: true }),
    false,
  );
});

test("the demo never shows the wizard and always persists (F-1 §4)", () => {
  assert.equal(
    shouldShowFirstRun({ demoMode: true, hasStoredDraft: false, hasBrandProfile: false }),
    false,
  );
  assert.equal(shouldPersistOverlayDraft({ demoMode: true, firstRunOpen: false }), true);
  // firstRunOpen can never be true in demo, but even then the demo persists.
  assert.equal(shouldPersistOverlayDraft({ demoMode: true, firstRunOpen: true }), true);
});
