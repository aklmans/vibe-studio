import assert from "node:assert/strict";
import test from "node:test";
import { GET, POST } from "./route";
import { resetShowcaseRunLimiterForTest } from "../../../../lib/showcase-rate-limit";

const KEY = "sk-route-secret-999";
const PRIVATE_ROUTE_SOCIAL = "private-route-social";
const DEFAULT_USER_AGENT = "Vibe-Studio/SessionConfigAgent";

// VIBE_SHOWCASE + guardrail knobs are included so withEnv clears them before
// every test (default = app mode: no rate limit, no token cap) and restores
// them after, keeping the showcase cases from leaking into the others.
const AGENT_ENV_KEYS = [
  "SESSION_AGENT_API_KEY",
  "SESSION_AGENT_PROVIDER",
  "SESSION_AGENT_BASE_URL",
  "SESSION_AGENT_MODEL",
  "SESSION_AGENT_USER_AGENT",
  "SESSION_AGENT_RATE_LIMIT",
  "SESSION_AGENT_MAX_TOKENS",
  "VIBE_SHOWCASE",
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

test("POST with a configured provider redacts social values in provider context and restores placeholders", async () => {
  let captured: { url: string; init: RequestInit } | null = null;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    captured = { url, init };
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: [
                "Updated:",
                "```json",
                JSON.stringify({
                  version: 1,
                  title: "AI Title",
                  socials: [{ icon: "github", label: "GitHub", value: "__PRIVATE_SOCIAL_VALUE_0__" }],
                }),
                "```",
              ].join("\n"),
            },
          },
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
      SESSION_AGENT_USER_AGENT: DEFAULT_USER_AGENT,
    },
    fetchImpl,
    async () => {
      const res = await POST(
        postRequest({
          brief: "b",
          task: "Task: t",
          configText: JSON.stringify({
            version: 1,
            title: "PROJECTION",
            socials: [{ icon: "github", label: "GitHub", value: PRIVATE_ROUTE_SOCIAL }],
          }),
          locale: "en",
        }),
      );
      const data = await res.json();
      assert.equal(data.mode, "ai");
      assert.equal(data.provider, "deepseek");
      assert.equal(data.model, "deepseek-chat");
      const returnedConfig = JSON.parse(data.configText);
      assert.equal(returnedConfig.title, "AI Title");
      assert.equal(returnedConfig.socials[0].value, PRIVATE_ROUTE_SOCIAL);

      // Request construction.
      assert.equal(captured!.url, "https://api.deepseek.com/chat/completions");
      const headers = captured!.init.headers as Record<string, string>;
      assert.equal(headers.Authorization, `Bearer ${KEY}`);
      assert.equal(headers["User-Agent"], DEFAULT_USER_AGENT);
      const body = JSON.parse(captured!.init.body as string);
      assert.equal(body.model, "deepseek-chat");
      assert.match(JSON.stringify(body.messages), /PROJECTION/); // current config sent
      assert.match(JSON.stringify(body.messages), /__PRIVATE_SOCIAL_VALUE_0__/);
      assert.equal(JSON.stringify(body.messages).includes(PRIVATE_ROUTE_SOCIAL), false);
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

test("showcase mode rate-limits agent runs, then 429s without calling the provider", async () => {
  let providerCalls = 0;
  const fetchImpl = (async () => {
    providerCalls += 1;
    return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 });
  }) as unknown as typeof fetch;

  await withEnv(
    { SESSION_AGENT_API_KEY: KEY, VIBE_SHOWCASE: "1", SESSION_AGENT_RATE_LIMIT: "1" },
    fetchImpl,
    async () => {
      resetShowcaseRunLimiterForTest();
      const first = await POST(postRequest({ brief: "a", task: "", configText: "{}", locale: "en" }));
      assert.equal(first.status, 200);
      assert.equal((await first.json()).mode, "ai");

      const second = await POST(postRequest({ brief: "b", task: "", configText: "{}", locale: "en" }));
      assert.equal(second.status, 429);
      const data = await second.json();
      assert.equal(data.mode, "error");
      assert.equal(data.rateLimited, true);
      assert.equal(providerCalls, 1); // the blocked request never reached the provider
    },
  );
  resetShowcaseRunLimiterForTest();
});

test("showcase caps output tokens; app mode leaves runs uncapped", async () => {
  const bodies: Array<Record<string, unknown>> = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(init.body as string));
    return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 });
  }) as unknown as typeof fetch;

  await withEnv(
    { SESSION_AGENT_API_KEY: KEY, VIBE_SHOWCASE: "1", SESSION_AGENT_MAX_TOKENS: "1234" },
    fetchImpl,
    async () => {
      resetShowcaseRunLimiterForTest();
      await POST(postRequest({ brief: "a", task: "", configText: "{}", locale: "en" }));
      assert.equal(bodies[0].max_tokens, 1234);
    },
  );

  await withEnv({ SESSION_AGENT_API_KEY: KEY }, fetchImpl, async () => {
    await POST(postRequest({ brief: "a", task: "", configText: "{}", locale: "en" }));
    assert.equal("max_tokens" in bodies[1], false);
  });
  resetShowcaseRunLimiterForTest();
});
