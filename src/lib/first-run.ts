/**
 * First-run gating — extracted as pure decisions so the refresh contract is
 * testable without a browser:
 *
 *  - The wizard greets only a truly blank private studio (no draft, no brand
 *    profile, not the demo).
 *  - While the wizard is OPEN the studio must NOT persist its draft: the
 *    mount-time autosave would otherwise mark the studio as "seen" and a
 *    refresh/crash mid-wizard would silently dismiss it forever. Completing or
 *    skipping the wizard (both explicit decisions) re-enables persistence, and
 *    the very next autosave records the decision.
 *  - The demo always persists (its own storage key) and never sees the wizard.
 */

export interface FirstRunGateInputs {
  demoMode: boolean;
  hasStoredDraft: boolean;
  hasBrandProfile: boolean;
}

export function shouldShowFirstRun({
  demoMode,
  hasStoredDraft,
  hasBrandProfile,
}: FirstRunGateInputs): boolean {
  return !demoMode && !hasStoredDraft && !hasBrandProfile;
}

export function shouldPersistOverlayDraft({
  demoMode,
  firstRunOpen,
}: {
  demoMode: boolean;
  firstRunOpen: boolean;
}): boolean {
  return demoMode || !firstRunOpen;
}
