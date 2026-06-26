import type { TranslationKey } from "../../lib/i18n";

// Pure mapping from a clipboard-write outcome to what the Agent prep shows, kept
// here so the "never claim a copy that didn't happen" contract is unit-testable
// without a browser clipboard and without pinning to component internals.

/** A transcript turn's copy status — drives the assistant bubble's wording. */
export type CopyStatus = "copied" | "manual";

export interface CopyResult {
  /** Status-banner i18n key shown next to the actions. */
  messageKey: TranslationKey;
  /** Status recorded on the appended transcript turn. */
  turnStatus: CopyStatus;
}

/**
 * Resolve the banner message + transcript turn status from whether the clipboard
 * write actually succeeded. Failure never resolves to "copied": the turn is
 * recorded as a manual-copy turn so the transcript cannot claim a copy that did
 * not happen.
 */
export function resolveCopyResult(copied: boolean): CopyResult {
  return copied
    ? { messageKey: "agent.copied", turnStatus: "copied" }
    : { messageKey: "agent.copyFailed", turnStatus: "manual" };
}

/** The assistant bubble's i18n key for a turn of the given copy status. */
export function turnMessageKey(status: CopyStatus): TranslationKey {
  return status === "copied" ? "agent.turnReady" : "agent.turnManual";
}

/** Short, stable snapshot id for a config text — transcript turn metadata. */
export function shortConfigHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8);
}
