import assert from "node:assert/strict";
import { equal } from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createObsWebSocketAuth, readObsWebSocketConfig } from "./obs-ws";

test("createObsWebSocketAuth follows the obs-websocket v5 challenge-response", () => {
  const password = "supersecret";
  const salt = "PZVbYpvAnZut2SS6JNJytDm9";
  const challenge = "ztTBnnuqrqaKDzRM3xcVdbYm";

  // Independent recomputation of the documented algorithm, so a swapped
  // concat order or a hex/base64 mix-up in the implementation fails here.
  const secret = createHash("sha256").update(`${password}${salt}`).digest("base64");
  const expected = createHash("sha256").update(`${secret}${challenge}`).digest("base64");

  equal(createObsWebSocketAuth(password, salt, challenge), expected);
  // base64 sha256 is 44 chars with padding; sanity-pin the shape.
  assert.match(createObsWebSocketAuth(password, salt, challenge), /^[A-Za-z0-9+/]{43}=$/);
  assert.notEqual(
    createObsWebSocketAuth("other-password", salt, challenge),
    expected,
  );
});

test("readObsWebSocketConfig parses the plugin config and tolerates absence", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "vibe-obs-ws-"));
  const file = path.join(dir, "config.json");
  await writeFile(
    file,
    JSON.stringify({ server_enabled: true, server_port: 4455, server_password: "x" }),
  );

  const config = await readObsWebSocketConfig(file);
  equal(config?.server_port, 4455);
  equal(config?.server_enabled, true);

  equal(await readObsWebSocketConfig(path.join(dir, "missing.json")), null);

  await writeFile(file, "not json");
  equal(await readObsWebSocketConfig(file), null);

  await writeFile(file, JSON.stringify(["array"]));
  equal(await readObsWebSocketConfig(file), null);
});
