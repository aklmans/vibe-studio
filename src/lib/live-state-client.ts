import type { Locale } from "./i18n";
import type { OverlayState } from "../types";

/** The real, server-reported result of a live-state push. */
export interface LiveStatePublishResult {
  /**
   * The live-state store's revision after this push, or `null` when the API does
   * not report a numeric revision (missing field, wrong type, or an older API).
   * Never coerced to 0 — callers must not display a revision that isn't real.
   */
  revision: number | null;
  /** ISO timestamp the store recorded for this push ("" if the API omits it). */
  updatedAt: string;
}

/**
 * Push the current state to the in-memory live-state store that OBS sources
 * mirror. Returns the store's real revision + updatedAt from the PATCH response
 * (the API already returns them), so callers can show an honest sync status
 * without inventing a revision. Backward compatible: a missing / non-numeric
 * revision becomes `null` (never a faked 0) and a missing updatedAt becomes "".
 * Throws on a non-OK response or network failure.
 */
export async function publishLiveState(
  state: OverlayState,
  locale: Locale,
  signal?: AbortSignal,
): Promise<LiveStatePublishResult> {
  const res = await fetch("/api/live-state", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ locale, state }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`live-state ${res.status}`);
  }
  const data = (await res.json().catch(() => null)) as
    | { revision?: unknown; updatedAt?: unknown }
    | null;
  return {
    revision: typeof data?.revision === "number" ? data.revision : null,
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : "",
  };
}
