import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { withOptionalDatabaseFallback } from "./live-data-api";

test("withOptionalDatabaseFallback returns the operation result when persistence works", async () => {
  const result = await withOptionalDatabaseFallback<{
    databaseConfigured: boolean;
    liveData: string | null;
  }>(
    async () => ({ databaseConfigured: true, liveData: "ok" }),
    { databaseConfigured: false, liveData: null },
  );

  assert.deepEqual(result, { databaseConfigured: true, liveData: "ok" });
});

test("withOptionalDatabaseFallback returns the fallback when optional persistence rejects", async () => {
  const result = await withOptionalDatabaseFallback(
    async () => {
      throw Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432"), {
        code: "ECONNREFUSED",
      });
    },
    { databaseConfigured: false, liveData: null },
  );

  assert.deepEqual(result, { databaseConfigured: false, liveData: null });
});

test("session API routes wrap optional database calls with the fallback helper", () => {
  const routeFiles = [
    "src/app/api/sessions/route.ts",
    "src/app/api/sessions/current/route.ts",
    "src/app/api/sessions/current/start/route.ts",
    "src/app/api/sessions/current/end/route.ts",
    "src/app/api/sessions/current/live-data/route.ts",
  ];

  for (const routeFile of routeFiles) {
    const source = readFileSync(resolve(routeFile), "utf8");
    assert.match(
      source,
      /withOptionalDatabaseFallback/,
      `${routeFile} should degrade to local draft mode when the optional database is unavailable`,
    );
  }
});
