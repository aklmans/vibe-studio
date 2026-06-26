/*
 * Server-side AI adapter for the Session Config agent.
 *
 * Security model: this module never reads `process.env` itself and is only
 * invoked from the server route (`/api/session-config/agent`). The route passes
 * env in; the API key stays on the server, never in the client bundle, never in
 * localStorage, never logged, and never echoed back to the client. The client
 * sends only the brief, task, and the current v1 config projection, and reads
 * back a sanitized response (assistant message + optional JSON + safe metadata).
 *
 * Providers: an OpenAI-compatible Chat Completions adapter covers DeepSeek,
 * OpenAI, Kimi and z.ai by configuring base_url + model. No SDK dependency —
 * plain `fetch`, with a configurable User-Agent.
 */

export interface SessionAgentConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  userAgent: string;
}

/** Safe, key-free metadata the client may show. */
export interface SessionAgentStatus {
  configured: boolean;
  provider?: string;
  model?: string;
}

export interface SessionAgentRequest {
  brief: string;
  task: string;
  /** The current live-session.config.json v1 projection (computed client-side). */
  configText: string;
  locale: string;
}

export interface SessionAgentRunResponse {
  mode: "ai" | "local" | "error";
  configured: boolean;
  provider?: string;
  model?: string;
  /** Assistant message (ai) — the raw reply, kept for the user to copy. */
  message?: string;
  /** Extracted JSON config text for the review path, or null when none. */
  configText?: string | null;
  /** Error summary (error mode) — sanitized, never contains the key. */
  error?: string;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULTS = {
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  // DeepSeek's OpenAI-compatible default chat model. Override per the provider's
  // current docs (model names can be deprecated).
  model: "deepseek-chat",
  userAgent: "Vibe-Coding-Live/SessionConfigAgent",
};

/**
 * Read the agent config from an env bag. Returns null when no API key is set —
 * the route then tells the client to fall back to the local handoff, and no
 * provider request is made.
 */
export function readSessionAgentConfig(
  env: Record<string, string | undefined>,
): SessionAgentConfig | null {
  const apiKey = (env.SESSION_AGENT_API_KEY ?? "").trim();
  if (!apiKey) return null;
  const clean = (value: string | undefined, fallback: string) =>
    (value ?? "").trim() || fallback;
  return {
    provider: clean(env.SESSION_AGENT_PROVIDER, DEFAULTS.provider),
    baseUrl: clean(env.SESSION_AGENT_BASE_URL, DEFAULTS.baseUrl).replace(/\/+$/, ""),
    apiKey,
    model: clean(env.SESSION_AGENT_MODEL, DEFAULTS.model),
    userAgent: clean(env.SESSION_AGENT_USER_AGENT, DEFAULTS.userAgent),
  };
}

/** Key-free status for the GET endpoint / client connection badge. */
export function publicAgentStatus(config: SessionAgentConfig | null): SessionAgentStatus {
  return config
    ? { configured: true, provider: config.provider, model: config.model }
    : { configured: false };
}

/** Compose the chat messages: a JSON-output system prompt + the user context. */
export function buildChatMessages(request: SessionAgentRequest): ChatMessage[] {
  const system = [
    "You are a configuration assistant for a livestream studio app.",
    "You edit live-session.config.json (v1): version, title, subtitle, author?, profile { avatarUrl, avatarVisible }, cover { visual, portraitUrl, sceneUrl }, badges: string[], stack: string[], socials: [{ icon?, label, value, color? }], sections: [{ title, bullets: string[] }].",
    "Runtime/display state (bottomBar, liveSession.startedAt, activeSection, sectionsDone) and studio appearance (theme, colors) are NOT part of this config — never add them.",
    "When changing the config, reply with one fenced ```json block containing the FULL updated config (keep version: 1, no comments), then a short plain explanation.",
    "If the user only asks a question, answer in plain text without a JSON block.",
  ].join(" ");

  const user = [
    request.task ? `Task: ${request.task}` : "",
    request.brief ? `Brief: ${request.brief}` : "Brief: (none)",
    `Locale: ${request.locale}`,
    "Current live-session.config.json:",
    "```json",
    request.configText.trim(),
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** Remove the API key from any text before it can surface in an error/log. */
export function redactKey(text: string, apiKey: string): string {
  return apiKey ? text.split(apiKey).join("***") : text;
}

export interface ChatCompletionResult {
  content: string;
}

/**
 * Call an OpenAI-compatible `/chat/completions` endpoint. Throws a sanitized
 * Error on a non-OK response or a missing message — the key is never included.
 */
export async function callOpenAICompatibleChat(
  config: SessionAgentConfig,
  messages: ChatMessage[],
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<ChatCompletionResult> {
  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "User-Agent": config.userAgent,
    },
    body: JSON.stringify({ model: config.model, messages, stream: false }),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const trimmed = redactKey(detail, config.apiKey).slice(0, 300);
    throw new Error(`provider ${response.status}${trimmed ? `: ${trimmed}` : ""}`);
  }

  const data = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: unknown } }[];
  } | null;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("provider returned no message content");
  }
  return { content };
}

/**
 * Extract a JSON config object from an assistant message — a fenced ```json
 * block if present, else the first `{ … }` span — re-serialized for the review
 * buffer. Returns null when there is no parseable JSON object (a plain-text
 * answer), so the caller shows the message without a review path.
 */
export function extractConfigJson(content: string): string | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1]?.trim() : firstJsonObject(content);
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return `${JSON.stringify(parsed, null, 2)}\n`;
    }
  } catch {
    /* not JSON — fall through */
  }
  return null;
}

function firstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : null;
}
