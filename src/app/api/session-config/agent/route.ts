import {
  buildChatMessages,
  callOpenAICompatibleChat,
  extractConfigJson,
  publicAgentStatus,
  readSessionAgentConfig,
  readShowcaseGuardrails,
  redactKey,
  restorePrivateSocialValuesInConfigText,
  testAgentConnection,
  type SessionAgentRequest,
  type SessionAgentRunResponse,
  type SessionAgentTestResponse,
} from "../../../../lib/session-agent";
import { isShowcase } from "../../../../lib/site-mode";
import { showcaseRunLimiter } from "../../../../lib/showcase-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Best-effort client IP from proxy headers; one bucket for header-less callers. */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  return real || "unknown";
}

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

  // Public-showcase abuse guard: rate-limit real provider runs by IP and cap
  // output tokens. A local/private Studio (app mode) is uncapped — it is the
  // operator's own key and machine.
  const showcase = isShowcase();
  if (showcase) {
    const decision = showcaseRunLimiter().check(clientIp(request));
    if (!decision.allowed) {
      const limited: SessionAgentRunResponse = {
        mode: "error",
        configured: true,
        provider: config.provider,
        model: config.model,
        rateLimited: true,
        error: "rate limit exceeded",
      };
      const retryAfter = Math.max(1, Math.ceil((decision.resetAt - Date.now()) / 1000));
      return Response.json(limited, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }
  }

  try {
    const maxTokens = showcase ? readShowcaseGuardrails(process.env).maxTokens : undefined;
    const { content } = await callOpenAICompatibleChat(
      config,
      buildChatMessages(agentRequest),
      undefined,
      undefined,
      maxTokens,
    );
    const extractedConfig = extractConfigJson(content);
    const result: SessionAgentRunResponse = {
      mode: "ai",
      configured: true,
      provider: config.provider,
      model: config.model,
      message: content,
      configText: extractedConfig
        ? restorePrivateSocialValuesInConfigText(extractedConfig, agentRequest.configText)
        : null,
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
