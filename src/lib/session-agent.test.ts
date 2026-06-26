import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChatMessages,
  callOpenAICompatibleChat,
  extractConfigJson,
  publicAgentStatus,
  readSessionAgentConfig,
  redactKey,
  type SessionAgentConfig,
} from "./session-agent";

const KEY = "sk-secret-key-123";
const baseConfig: SessionAgentConfig = {
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  apiKey: KEY,
  model: "deepseek-chat",
  userAgent: "Vibe-Coding-Live/SessionConfigAgent",
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
    userAgent: "Vibe-Coding-Live/SessionConfigAgent",
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
  assert.deepEqual(status, { configured: true, provider: "deepseek", model: "deepseek-chat" });
  assert.equal(JSON.stringify(status).includes(KEY), false);
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
  assert.match(messages[0].content, /NOT part of this config/i); // runtime/studio excluded
  const user = messages[1].content;
  assert.match(user, /Task: update the sections/);
  assert.match(user, /Brief: rebuild the intro/);
  assert.match(user, /Marker Title/); // the projection is sent
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
  assert.equal(headers["User-Agent"], "Vibe-Coding-Live/SessionConfigAgent");
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
