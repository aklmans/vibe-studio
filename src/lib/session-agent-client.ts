import type {
  SessionAgentRequest,
  SessionAgentRunResponse,
  SessionAgentStatus,
  SessionAgentTestResponse,
} from "./session-agent";

/*
 * Client-side calls to the same-origin agent route. This never talks to a
 * provider directly and never sees an API key — it only fetches
 * `/api/session-config/agent`. Types are imported type-only, so no server
 * adapter code enters the client bundle.
 */

const ENDPOINT = "/api/session-config/agent";

/** Fetch the key-free connection status; defaults to "not configured" on error. */
export async function fetchAgentStatus(
  fetchImpl: typeof fetch = fetch,
): Promise<SessionAgentStatus> {
  try {
    const response = await fetchImpl(ENDPOINT, { method: "GET" });
    if (!response.ok) return { configured: false };
    const data = (await response.json().catch(() => null)) as SessionAgentStatus | null;
    return data && typeof data.configured === "boolean" ? data : { configured: false };
  } catch {
    return { configured: false };
  }
}

/** Ask the route to verify the configured provider answers (key-free result). */
export async function testAgentConnection(
  fetchImpl: typeof fetch = fetch,
): Promise<SessionAgentTestResponse> {
  // A client-side ceiling longer than the server's own test timeout, so the UI
  // always recovers even if the route itself stalls. No key / URL is ever sent.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as SessionAgentTestResponse | null;
    if (data && typeof data.ok === "boolean") return data;
    return { ok: false, configured: false, error: `request failed (${response.status})` };
  } catch {
    return { ok: false, configured: false, error: "network error" };
  } finally {
    clearTimeout(timer);
  }
}

/** Run the agent through the route. Network failures map to an error response. */
export async function runSessionAgent(
  request: SessionAgentRequest,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<SessionAgentRunResponse> {
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
    const data = (await response.json().catch(() => null)) as SessionAgentRunResponse | null;
    if (data && typeof data.mode === "string") return data;
    return { mode: "error", configured: true, error: `request failed (${response.status})` };
  } catch {
    return { mode: "error", configured: false, error: "network error" };
  }
}
