import test from "node:test";
import assert from "node:assert/strict";
import { notFoundResponse } from "./httpResponses";

test("notFoundResponse returns the stable API 404 payload", () => {
  assert.deepEqual(notFoundResponse(), {
    error: {
      message: "Not found",
    },
  });
});
