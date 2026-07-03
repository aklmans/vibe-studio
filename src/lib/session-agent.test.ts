import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChatMessages,
  callOpenAICompatibleChat,
  extractConfigJson,
  publicAgentStatus,
  readSessionAgentConfig,
  redactKey,
  testAgentConnection,
  type SessionAgentConfig,
} from "./session-agent";
import { testAgentConnection as clientTestAgentConnection } from "./session-agent-client";

const KEY = "sk-secret-key-123";
const PRIVATE_GITHUB_VALUE = "private-github-handle";
const PRIVATE_WEBSITE_VALUE = "private.example";
const PRIVATE_AVATAR_URI = "data:image/png;base64,PRIVATEPHOTOBYTES==";
const DEFAULT_USER_AGENT = "Vibe-Studio/SessionConfigAgent";
const baseConfig: SessionAgentConfig = {
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  apiKey: KEY,
  model: "deepseek-chat",
  userAgent: DEFAULT_USER_AGENT,
};

test("readSessionAgentConfig returns null without a key, else config with defaults", () => {
  assert.equal(readSessionAgentConfig({}), null);
  assert.equal(readSessionAgentConfig({ SESSION_AGENT_API_KEY: "   " }), null);

  const config = readSessionAgentConfig({ SESSION_AGENT_API_KEY: KEY });
  assert.deepEqual(config, {
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com",
    apiKey: KEY,
    model: "deepseek-chat",
    userAgent: DEFAULT_USER_AGENT,
  });

  const custom = readSessionAgentConfig({
    SESSION_AGENT_API_KEY: KEY,
    SESSION_AGENT_PROVIDER: "openai",
    SESSION_AGENT_BASE_URL: "https://api.openai.com/v1/",
    SESSION_AGENT_MODEL: "gpt-x",
    SESSION_AGENT_USER_AGENT: "Custom/1.0",
  });
  assert.equal(custom?.provider, "openai");
  assert.equal(custom?.baseUrl, "https://api.openai.com/v1"); // trailing slash trimmed
  assert.equal(custom?.model, "gpt-x");
  assert.equal(custom?.userAgent, "Custom/1.0");
});

test("publicAgentStatus never exposes the API key", () => {
  assert.deepEqual(publicAgentStatus(null), { configured: false });
  const status = publicAgentStatus(baseConfig);
  assert.deepEqual(status, {
    configured: true,
    provider: "deepseek",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com",
    userAgent: DEFAULT_USER_AGENT,
  });
  assert.equal(JSON.stringify(status).includes(KEY), false);
});

test("testAgentConnection times out, aborts, and reports a key-free failure", async () => {
  // A fetch that hangs until aborted — the short timeout must abort it.
  const hangingFetch: typeof fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    });
  const result = await testAgentConnection(baseConfig, hangingFetch, 10);
  assert.equal(result.ok, false);
  assert.match((result as { error: string }).error, /timed out/);
  assert.equal((result as { error: string }).error.includes(KEY), false);
});

test("testAgentConnection redacts the API key from a provider error", async () => {
  const leakyFetch: typeof fetch = async () =>
    new Response(`unauthorized: ${KEY}`, { status: 401 });
  const result = await testAgentConnection(baseConfig, leakyFetch, 9000);
  assert.equal(result.ok, false);
  assert.equal((result as { error: string }).error.includes(KEY), false);
});

test("client testAgentConnection maps a request failure to ok:false", async () => {
  const failing: typeof fetch = async () => {
    throw new Error("boom");
  };
  const result = await clientTestAgentConnection(failing);
  assert.equal(result.ok, false);
});

test("buildChatMessages includes the current config projection + task + brief", () => {
  const messages = buildChatMessages({
    brief: "rebuild the intro",
    task: "Task: update the sections",
    configText: '{"version":1,"title":"Marker Title"}',
    locale: "en",
  });
  assert.equal(messages[0].role, "system");
  assert.match(messages[0].content, /json/i);
  assert.match(messages[0].content, /Identity and brand are fixed/i); // AI edits content only
  const user = messages[1].content;
  assert.match(user, /Task: update the sections/);
  assert.match(user, /Brief: rebuild the intro/);
  assert.match(user, /Marker Title/); // the projection is sent
});

test("buildChatMessages sends content only — identity, brand, and non-portable fields never reach the provider", () => {
  const messages = buildChatMessages({
    brief: "keep identity private",
    task: "Task: update the sections",
    configText: JSON.stringify({
      version: 1,
      title: "Private Stream",
      subtitle: "TopicMarker",
      author: "Aklman",
      profile: { avatarUrl: PRIVATE_AVATAR_URI, avatarVisible: true },
      badges: [],
      stack: [],
      socials: [
        { icon: "github", label: "GitHub", value: PRIVATE_GITHUB_VALUE },
        { icon: "website", label: "Website", value: PRIVATE_WEBSITE_VALUE },
      ],
      sections: [],
      // A tampered/legacy client sending non-portable state must not leak it.
      obs: { host: "localhost", password: "obs-secret" },
    }),
    locale: "en",
  });
  const payload = JSON.stringify(messages);

  // Content is sent.
  assert.match(payload, /Private Stream/);
  assert.match(payload, /TopicMarker/);
  // Identity + brand + non-portable state are structurally absent — not even the
  // author name, social label, avatar, or OBS block crosses the boundary.
  assert.equal(payload.includes("Aklman"), false);
  assert.equal(payload.includes("GitHub"), false);
  assert.equal(payload.includes(PRIVATE_GITHUB_VALUE), false);
  assert.equal(payload.includes(PRIVATE_WEBSITE_VALUE), false);
  assert.equal(payload.includes(PRIVATE_AVATAR_URI), false);
  assert.equal(payload.includes("obs-secret"), false);
});

test("buildChatMessages constrains badges to supported LobeHub-backed icon keys", () => {
  const messages = buildChatMessages({
    brief: "use AI badges",
    task: "Task: update badges",
    configText: '{"version":1,"title":"Marker Title"}',
    locale: "en",
  });
  const system = messages[0].content;

  assert.match(system, /Allowed badge keys:/);
  assert.match(system, /claude-code/);
  assert.match(system, /chatgpt/);
  assert.match(system, /Use exact badge keys/);
  assert.match(system, /Do not use generic labels such as AI, LLM, or AI\/LLM/);
  assert.match(system, /Badges are optional/);
  assert.match(system, /If there is no clear match/);
  assert.match(system, /never invent or force a badge/);
  assert.doesNotMatch(system, /react/);
});

test("callOpenAICompatibleChat builds an OpenAI-compatible request and parses content", async () => {
  let captured: { url: string; init: RequestInit } | null = null;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    captured = { url, init };
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "hello config" } }] }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const result = await callOpenAICompatibleChat(baseConfig, [{ role: "user", content: "hi" }], fetchImpl);
  assert.equal(result.content, "hello config");

  assert.equal(captured!.url, "https://api.deepseek.com/chat/completions");
  const headers = captured!.init.headers as Record<string, string>;
  assert.equal(headers.Authorization, `Bearer ${KEY}`);
  assert.equal(headers["User-Agent"], DEFAULT_USER_AGENT);
  const body = JSON.parse(captured!.init.body as string);
  assert.equal(body.model, "deepseek-chat");
  assert.ok(Array.isArray(body.messages));
});

test("callOpenAICompatibleChat throws a sanitized error on non-OK (no key leak)", async () => {
  const fetchImpl = (async () =>
    new Response(`auth failed for ${KEY}`, { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(
    () => callOpenAICompatibleChat(baseConfig, [], fetchImpl),
    (error: Error) => {
      assert.match(error.message, /provider 401/);
      assert.equal(error.message.includes(KEY), false); // redacted
      return true;
    },
  );
});

test("extractConfigJson pulls a JSON object, fenced or bare, else null", () => {
  const fenced = extractConfigJson('Here you go:\n```json\n{"version":1,"title":"X"}\n```\nDone.');
  assert.ok(fenced && JSON.parse(fenced).title === "X");

  const bare = extractConfigJson('Sure. {"version":1,"title":"Y"} hope that helps');
  assert.ok(bare && JSON.parse(bare).title === "Y");

  assert.equal(extractConfigJson("just a plain text answer, no json"), null);
  assert.equal(extractConfigJson("```json\n[1,2,3]\n```"), null); // array, not a config object
});

test("redactKey removes the api key from text", () => {
  assert.equal(redactKey(`x ${KEY} y`, KEY), "x *** y");
  assert.equal(redactKey("no key here", KEY), "no key here");
});
