/*
 * Server-side AI adapter for the Session Config agent.
 *
 * Security model: this module never reads `process.env` itself and is only
 * invoked from the server route (`/api/session-config/agent`). The route passes
 * env in; the API key stays on the server, never in the client bundle, never in
 * localStorage, never logged, and never echoed back to the client. The client
 * sends only the brief, task, and a privacy-redacted v1 config projection, and reads
 * back a sanitized response (assistant message + optional JSON + safe metadata).
 *
 * Providers: an OpenAI-compatible Chat Completions adapter covers DeepSeek,
 * OpenAI, Kimi and z.ai by configuring base_url + model. No SDK dependency —
 * plain `fetch`, with a configurable User-Agent.
 */

import { CONFIG_BADGE_PROMPT_RULE } from "./badges";
import { sanitizeConfigTextForProvider } from "./config-privacy";

export interface SessionAgentConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  userAgent: string;
}

/** Safe, key-free metadata the client may show. The base URL, model, provider
 * and User-Agent are non-secret and are surfaced so the AI Provider settings
 * panel can display the resolved connection; the API key is never included. */
export interface SessionAgentStatus {
  configured: boolean;
  provider?: string;
  model?: string;
  baseUrl?: string;
  userAgent?: string;
}

/** Result of a user-triggered "test connection" — key-free, sanitized error. */
export interface SessionAgentTestResponse {
  ok: boolean;
  configured: boolean;
  provider?: string;
  model?: string;
  error?: string;
}

export interface SessionAgentRequest {
  brief: string;
  task: string;
  /** The current live-session.config.json v1 projection (redacted before provider calls). */
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
  /** Set when a run was blocked by the public-showcase rate limit. */
  rateLimited?: boolean;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULTS = {
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  // DeepSeek's OpenAI-compatible default chat model. Override per the provider's
  // current docs (model names can be deprecated).
  model: "deepseek-chat",
  userAgent: "Vibe-Studio/SessionConfigAgent",
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

/**
 * Abuse guardrails applied only on the public showcase deploy (VIBE_SHOWCASE=1),
 * so anonymous visitors can experience the agent without the deploy's key being
 * an open cost/DoS surface. A local/private Studio (app mode) reads nothing here
 * and runs uncapped with the operator's own key. These are non-secret and never
 * reach the client. `rateLimitPerHour: 0` disables runs entirely; a large
 * `maxTokens` only bounds pathological outputs (a full config is well under it).
 */
export interface ShowcaseGuardrails {
  rateLimitPerHour: number;
  maxTokens: number;
}

const GUARDRAIL_DEFAULTS: ShowcaseGuardrails = {
  rateLimitPerHour: 10,
  maxTokens: 4096,
};

export function readShowcaseGuardrails(
  env: Record<string, string | undefined>,
): ShowcaseGuardrails {
  const nonNegInt = (value: string | undefined, fallback: number) => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return fallback;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  return {
    rateLimitPerHour: nonNegInt(env.SESSION_AGENT_RATE_LIMIT, GUARDRAIL_DEFAULTS.rateLimitPerHour),
    maxTokens: nonNegInt(env.SESSION_AGENT_MAX_TOKENS, GUARDRAIL_DEFAULTS.maxTokens),
  };
}

/** Key-free status for the GET endpoint / client connection badge. */
export function publicAgentStatus(config: SessionAgentConfig | null): SessionAgentStatus {
  return config
    ? {
        configured: true,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        userAgent: config.userAgent,
      }
    : { configured: false };
}

/**
 * Verify the configured provider actually answers — a minimal one-shot chat.
 * Server-side only, using the server's own env config (the client never
 * supplies the key or the base URL, so this can't be pointed elsewhere). The
 * key is redacted from any error before it returns.
 */
export async function testAgentConnection(
  config: SessionAgentConfig,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 9000,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // A short ceiling so a stalled provider can't keep the test spinning. The
  // abort is ours, so a timeout reports as such (never the raw abort error).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await callOpenAICompatibleChat(
      config,
      [
        { role: "system", content: "Reply with the single word: ok." },
        { role: "user", content: "ping" },
      ],
      fetchImpl,
      controller.signal,
    );
    return { ok: true };
  } catch (error) {
    if (controller.signal.aborted) {
      return { ok: false, error: "request timed out" };
    }
    const raw = error instanceof Error ? error.message : "request failed";
    return { ok: false, error: redactKey(raw, config.apiKey) };
  } finally {
    clearTimeout(timer);
  }
}

/** Compose the chat messages: a JSON-output system prompt + the user context. */
/**
 * Resolve the OUTPUT language for content strings deterministically on our
 * side (CJK in the brief -> Chinese; latin brief -> English; empty brief -> UI
 * locale) instead of asking the model to infer it — "match the brief" alone
 * proved unreliable across providers.
 */
export function resolveContentLanguage(brief: string, locale: string): "zh" | "en" {
  const trimmed = brief.trim();
  if (/[\u4e00-\u9fff]/.test(trimmed)) return "zh";
  if (/[a-zA-Z]/.test(trimmed)) return "en";
  return locale === "zh" ? "zh" : "en";
}

function contentLanguageName(language: "zh" | "en"): string {
  return language === "zh" ? "Simplified Chinese (简体中文)" : "English";
}

export function buildChatMessages(request: SessionAgentRequest): ChatMessage[] {
  const contentLanguage = contentLanguageName(
    resolveContentLanguage(request.brief, request.locale),
  );
  const system = [
    "You are a stream-content assistant for a livestream studio app.",
    `Write every content string (title, subtitle, section titles, bullets, stack labels) in ${contentLanguage}. This is a hard requirement regardless of the current content language.`,
    "You edit ONLY the per-stream content of live-session.config.json (v1): version, title, subtitle, badges: string[], stack: string[], sections: [{ title, minutes?, speaker?, speakerLines?: string[], bullets?: string[] }] (up to 12 sections). minutes is the section's optional planned duration in whole minutes (the on-air agenda timer uses it); bullets are optional — a pure agenda item is just a title + minutes; speaker is the optional per-section presenter/guest name and speakerLines their role/affiliation lines (only when the brief provides them).",
    CONFIG_BADGE_PROMPT_RULE,
    "Identity and brand are fixed and NOT shown to you — author, avatar, socials, cover, theme and fonts. Never add or change them; never include author, profile, socials or cover in your output.",
    "When changing content, reply with one fenced ```json block containing the full content object (version, title, subtitle, badges, stack, sections; keep version: 1, no comments), then a short plain explanation.",
    "If the user only asks a question, answer in plain text without a JSON block.",
  ].join(" ");

  const user = [
    request.task ? `Task: ${request.task}` : "",
    request.brief ? `Brief: ${request.brief}` : "Brief: (none)",
    `Locale: ${request.locale}`,
    "Current stream content:",
    "```json",
    sanitizeConfigTextForProvider(request.configText).trim(),
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
  maxTokens?: number,
): Promise<ChatCompletionResult> {
  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "User-Agent": config.userAgent,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
      ...(maxTokens && maxTokens > 0 ? { max_tokens: maxTokens } : {}),
    }),
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
