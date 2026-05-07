import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "./server";

test("parsePort accepts positive integer ports", () => {
  assert.equal(parsePort("8080"), 8080);
});

test("parsePort rejects missing, non-numeric, and out-of-range ports", () => {
  assert.throws(
    () => parsePort(undefined),
    /PORT environment variable is required/,
  );
  assert.throws(() => parsePort("abc"), /Invalid PORT value/);
  assert.throws(() => parsePort("0"), /Invalid PORT value/);
  assert.throws(() => parsePort("70000"), /Invalid PORT value/);
});
