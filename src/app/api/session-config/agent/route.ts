import {
  buildChatMessages,
  callOpenAICompatibleChat,
  extractConfigJson,
  publicAgentStatus,
  readSessionAgentConfig,
  redactKey,
  type SessionAgentRequest,
  type SessionAgentRunResponse,
} from "../../../../lib/session-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Key-free status so the client can show "Connected" vs "Local prep". */
export function GET() {
  return Response.json(publicAgentStatus(readSessionAgentConfig(process.env)));
}

export async function POST(request: Request) {
  const config = readSessionAgentConfig(process.env);
  const body = (await request.json().catch(() => null)) as Partial<SessionAgentRequest> | null;
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
