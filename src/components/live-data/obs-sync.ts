// OBS / live-state push status shown in the source-of-truth bar. Kept as small
// pure helpers so "never fabricate a revision" and "synced shows the real
// revision + last-pushed time" are unit-testable without a browser.

export type ObsSyncStatus = "idle" | "syncing" | "synced" | "error";

export interface ObsSyncState {
  status: ObsSyncStatus;
  /** The live-state store's real revision, or null when nothing has synced. */
  revision: number | null;
  /** ISO timestamp of the last successful push, or null. */
  lastPushedAt: string | null;
  /** Last push error message, or null. */
  error: string | null;
}

export const IDLE_OBS_SYNC: ObsSyncState = {
  status: "idle",
  revision: null,
  lastPushedAt: null,
  error: null,
};

/** HH:MM:SS for a push timestamp, or "" when absent / unparseable. */
export function formatPushedTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

/**
 * The detail shown after the status word: the real revision + last-pushed time,
 * and only when actually synced. Never fabricates a revision — idle / syncing /
 * error render no number at all.
 */
export function obsSyncDetail(obsSync: ObsSyncState): string {
  if (obsSync.status !== "synced") return "";
  const rev = obsSync.revision != null ? `rev ${obsSync.revision}` : "";
  const time = formatPushedTime(obsSync.lastPushedAt);
  return [rev, time].filter(Boolean).join(" · ");
}
