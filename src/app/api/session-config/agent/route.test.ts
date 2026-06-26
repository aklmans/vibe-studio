import assert from "node:assert/strict";
import test from "node:test";
import { GET, POST } from "./route";

const KEY = "sk-route-secret-999";

const AGENT_ENV_KEYS = [
  "SESSION_AGENT_API_KEY",
  "SESSION_AGENT_PROVIDER",
  "SESSION_AGENT_BASE_URL",
  "SESSION_AGENT_MODEL",
  "SESSION_AGENT_USER_AGENT",
] as const;

function withEnv(
  env: Partial<Record<(typeof AGENT_ENV_KEYS)[number], string>>,
  fetchImpl: typeof fetch | null,
  run: () => Promise<void>,
): Promise<void> {
  const savedEnv = Object.fromEntries(AGENT_ENV_KEYS.map((k) => [k, process.env[k]]));
  const savedFetch = globalThis.fetch;
  for (const k of AGENT_ENV_KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  if (fetchImpl) globalThis.fetch = fetchImpl;
  return run().finally(() => {
    for (const k of AGENT_ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
    globalThis.fetch = savedFetch;
  });
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/session-config/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST without an API key falls back to local handoff, never calls a provider", async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;

  await withEnv({}, fetchImpl, async () => {
    const res = await POST(postRequest({ brief: "x", task: "Task: y", configText: "{}", locale: "en" }));
    const data = await res.json();
    assert.equal(data.mode, "local");
    assert.equal(data.configured, false);
    assert.equal(called, false); // no provider request
  });
});

test("POST with a configured provider builds the correct request + returns extracted JSON", async () => {
  let captured: { url: string; init: RequestInit } | null = null;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    captured = { url, init };
    return new Response(
      JSON.stringify({
        choices: [
          { message: { content: 'Updated:\n```json\n{"version":1,"title":"AI Title"}\n```' } },
        ],
      }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  await withEnv(
    {
      SESSION_AGENT_API_KEY: KEY,
      SESSION_AGENT_BASE_URL: "https://api.deepseek.com",
      SESSION_AGENT_MODEL: "deepseek-chat",
      SESSION_AGENT_USER_AGENT: "Vibe-Coding-Live/SessionConfigAgent",
    },
    fetchImpl,
    async () => {
      const res = await POST(
        postRequest({ brief: "b", task: "Task: t", configText: '{"version":1,"title":"PROJECTION"}', locale: "en" }),
      );
      const data = await res.json();
      assert.equal(data.mode, "ai");
      assert.equal(data.provider, "deepseek");
      assert.equal(data.model, "deepseek-chat");
      assert.ok(data.configText && JSON.parse(data.configText).title === "AI Title");

      // Request construction.
      assert.equal(captured!.url, "https://api.deepseek.com/chat/completions");
      const headers = captured!.init.headers as Record<string, string>;
      assert.equal(headers.Authorization, `Bearer ${KEY}`);
      assert.equal(headers["User-Agent"], "Vibe-Coding-Live/SessionConfigAgent");
      const body = JSON.parse(captured!.init.body as string);
      assert.equal(body.model, "deepseek-chat");
      assert.match(JSON.stringify(body.messages), /PROJECTION/); // current config sent
    },
  );
});

test("POST surfaces provider errors without leaking the key", async () => {
  const fetchImpl = (async () =>
    new Response(`unauthorized: ${KEY}`, { status: 401 })) as unknown as typeof fetch;

  await withEnv({ SESSION_AGENT_API_KEY: KEY }, fetchImpl, async () => {
    const res = await POST(postRequest({ brief: "", task: "", configText: "{}", locale: "en" }));
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.mode, "error");
    assert.equal(JSON.stringify(data).includes(KEY), false); // key redacted everywhere
  });
});

test("GET reports key-free configured status", async () => {
  await withEnv({}, null, async () => {
    assert.deepEqual(await (await GET()).json(), { configured: false });
  });
  await withEnv({ SESSION_AGENT_API_KEY: KEY, SESSION_AGENT_PROVIDER: "deepseek" }, null, async () => {
    const data = await (await GET()).json();
    assert.equal(data.configured, true);
    assert.equal(data.provider, "deepseek");
    assert.equal(JSON.stringify(data).includes(KEY), false);
  });
});
