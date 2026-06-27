import {
  buildChatMessages,
  callOpenAICompatibleChat,
  extractConfigJson,
  publicAgentStatus,
  readSessionAgentConfig,
  redactKey,
  testAgentConnection,
  type SessionAgentRequest,
  type SessionAgentRunResponse,
  type SessionAgentTestResponse,
} from "../../../../lib/session-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Key-free status so the client can show "Connected" vs "Local prep". */
export function GET() {
  return Response.json(publicAgentStatus(readSessionAgentConfig(process.env)));
}

export async function POST(request: Request) {
  const config = readSessionAgentConfig(process.env);
  const body = (await request.json().catch(() => null)) as
    | (Partial<SessionAgentRequest> & { test?: boolean })
    | null;

  // Test connection — a user-triggered ping from the AI Provider settings.
  // Uses the server's own env config only; the client supplies no key / URL.
  if (body?.test) {
    if (!config) {
      const miss: SessionAgentTestResponse = { ok: false, configured: false };
      return Response.json(miss);
    }
    const result = await testAgentConnection(config);
    const payload: SessionAgentTestResponse = result.ok
      ? { ok: true, configured: true, provider: config.provider, model: config.model }
      : { ok: false, configured: true, provider: config.provider, model: config.model, error: result.error };
    return Response.json(payload, result.ok ? undefined : { status: 502 });
  }

  const agentRequest: SessionAgentRequest = {
    brief: typeof body?.brief === "string" ? body.brief : "",
    task: typeof body?.task === "string" ? body.task : "",
    configText: typeof body?.configText === "string" ? body.configText : "",
    locale: body?.locale === "zh" ? "zh" : "en",
  };

  // No API key configured → tell the client to use the local handoff. No
  // provider request is made.
  if (!config) {
    const fallback: SessionAgentRunResponse = { mode: "local", configured: false };
    return Response.json(fallback);
  }

  try {
    const { content } = await callOpenAICompatibleChat(config, buildChatMessages(agentRequest));
    const result: SessionAgentRunResponse = {
      mode: "ai",
      configured: true,
      provider: config.provider,
      model: config.model,
      message: content,
      configText: extractConfigJson(content),
    };
    return Response.json(result);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "request failed";
    const result: SessionAgentRunResponse = {
      mode: "error",
      configured: true,
      provider: config.provider,
      model: config.model,
      error: redactKey(raw, config.apiKey),
    };
    return Response.json(result, { status: 502 });
  }
}
