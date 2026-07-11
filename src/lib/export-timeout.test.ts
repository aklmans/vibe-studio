import assert from "node:assert/strict";
import test from "node:test";
import { ExportTimeoutError, withExportTimeout } from "./export-timeout";

test("a hung exporter rejects with ExportTimeoutError instead of pending forever (F-4)", async () => {
  const never = new Promise<void>(() => {});
  await assert.rejects(withExportTimeout(never, 15), (error: unknown) => {
    assert.ok(error instanceof ExportTimeoutError);
    assert.equal((error as Error).name, "ExportTimeoutError");
    return true;
  });
});

test("a fast exporter resolves its value and clears the watchdog", async () => {
  assert.equal(await withExportTimeout(Promise.resolve("png"), 1_000), "png");
});

test("an exporter failure propagates the original error, not a timeout", async () => {
  const boom = new Error("capture failed");
  await assert.rejects(withExportTimeout(Promise.reject(boom), 1_000), (error: unknown) => {
    assert.equal(error, boom);
    return true;
  });
});
