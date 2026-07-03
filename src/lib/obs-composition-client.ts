import type { CompositionState } from "./obs-composition";

/*
 * Client-side calls to the same-origin OBS composition route. The client never
 * talks to obs-websocket itself and never sees the OBS password — it only
 * exchanges the small composition state with /api/obs/composition. Types are
 * imported type-only so no server code enters the client bundle.
 */

const ENDPOINT = "/api/obs/composition";

export interface ObsCompositionStatus {
  connected: boolean;
  /** "config" (never prepared), "unreachable" (OBS not running), or "error". */
  reason?: string;
  missingSources?: string[];
  current?: CompositionState;
}

export interface ObsCompositionApplyResult {
  ok: boolean;
  connected?: boolean;
  reason?: string;
  missingSources?: string[];
  missingRequired?: string[];
  applied?: CompositionState;
  error?: string;
}

export async function fetchObsCompositionStatus(
  fetchImpl: typeof fetch = fetch,
): Promise<ObsCompositionStatus> {
  try {
    const response = await fetchImpl(ENDPOINT, { method: "GET" });
    if (!response.ok) return { connected: false, reason: `http-${response.status}` };
    const data = (await response.json().catch(() => null)) as ObsCompositionStatus | null;
    return data && typeof data.connected === "boolean"
      ? data
      : { connected: false, reason: "invalid-response" };
  } catch {
    return { connected: false, reason: "network" };
  }
}

export async function applyObsComposition(
  state: CompositionState,
  fetchImpl: typeof fetch = fetch,
): Promise<ObsCompositionApplyResult> {
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    const data = (await response.json().catch(() => null)) as ObsCompositionApplyResult | null;
    if (data && typeof data.ok === "boolean") return data;
    return { ok: false, error: `request failed (${response.status})` };
  } catch {
    return { ok: false, error: "network error" };
  }
}
