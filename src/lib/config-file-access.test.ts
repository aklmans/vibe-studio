import assert from "node:assert/strict";
import test from "node:test";
import {
  boundTo,
  browserFileAccessAdapter,
  fileSystemAccessSupported,
  initialFileBinding,
  markPermissionLost,
  markRead,
  markReadError,
  markWrite,
  markWriteError,
  readBoundFile,
  writeBoundFile,
  type FileAccessAdapter,
} from "./config-file-access";

function fake(overrides: Partial<FileAccessAdapter> = {}): FileAccessAdapter {
  return {
    supported: () => true,
    pick: async () => ({ handle: {}, name: "live-session.config.json" }),
    read: async () => "{}",
    write: async () => {},
    ensureReadable: async () => true,
    ensureWritable: async () => true,
    ...overrides,
  };
}

test("fileSystemAccessSupported is feature-detected, never assumed", () => {
  assert.equal(fileSystemAccessSupported({ showOpenFilePicker: async () => [] }), true);
  assert.equal(fileSystemAccessSupported({}), false);
  assert.equal(fileSystemAccessSupported(undefined), false);
});

test("initialFileBinding reflects support; transitions never fake a state", () => {
  assert.equal(initialFileBinding(true).status, "unbound");
  assert.equal(initialFileBinding(false).status, "unsupported");

  const bound = boundTo("live-session.config.json");
  assert.equal(bound.status, "bound");
  assert.equal(bound.fileName, "live-session.config.json");
  assert.equal(bound.lastReadAt, null);

  assert.equal(markRead(bound, "2026-06-26T10:00:00.000Z").lastReadAt, "2026-06-26T10:00:00.000Z");
  assert.equal(markWrite(bound, "2026-06-26T10:00:00.000Z").lastWriteAt, "2026-06-26T10:00:00.000Z");

  // Errors keep the file name (binding isn't dropped) and surface the reason.
  const re = markReadError(bound, "boom");
  assert.equal(re.status, "read-error");
  assert.equal(re.fileName, "live-session.config.json");
  assert.equal(re.error, "boom");

  const we = markWriteError(bound, "disk full");
  assert.equal(we.status, "write-error");
  assert.equal(we.fileName, "live-session.config.json");

  const pl = markPermissionLost(bound);
  assert.equal(pl.status, "permission-lost");
  assert.equal(pl.fileName, "live-session.config.json");
});

test("readBoundFile returns text, or a typed failure, never throwing", async () => {
  assert.deepEqual(await readBoundFile(fake({ read: async () => "TEXT" }), {}), {
    ok: true,
    text: "TEXT",
  });

  const perm = await readBoundFile(fake({ ensureReadable: async () => false }), {});
  assert.equal(perm.ok, false);
  assert.equal(perm.ok === false && perm.reason, "permission");

  const io = await readBoundFile(
    fake({ read: async () => { throw new Error("boom"); } }),
    {},
  );
  assert.equal(io.ok, false);
  assert.equal(io.ok === false && io.reason, "io");
});

test("writeBoundFile writes the given text, or fails without throwing", async () => {
  let written: string | null = null;
  const ok = await writeBoundFile(
    fake({ write: async (_handle, text) => { written = text; } }),
    {},
    "PROJECTION",
  );
  assert.deepEqual(ok, { ok: true });
  assert.equal(written, "PROJECTION");

  const perm = await writeBoundFile(fake({ ensureWritable: async () => false }), {}, "x");
  assert.equal(perm.ok === false && perm.reason, "permission");

  const io = await writeBoundFile(
    fake({ write: async () => { throw new Error("disk full"); } }),
    {},
    "x",
  );
  assert.equal(io.ok === false && io.reason, "io");
});

test("browserFileAccessAdapter wraps the real File System Access API", async () => {
  const writes: string[] = [];
  let closed = false;
  const handle = {
    name: "live-session.config.json",
    getFile: async () => ({ text: async () => '{"version":1}' }),
    createWritable: async () => ({
      write: async (data: string) => { writes.push(data); },
      close: async () => { closed = true; },
    }),
    queryPermission: async () => "prompt" as PermissionState,
    requestPermission: async () => "granted" as PermissionState,
  };
  const scope = { showOpenFilePicker: async () => [handle] };
  const adapter = browserFileAccessAdapter(scope);

  assert.equal(adapter.supported(), true);
  assert.equal((await adapter.pick()).name, "live-session.config.json");
  assert.equal(await adapter.read(handle), '{"version":1}');
  await adapter.write(handle, "hello");
  assert.deepEqual(writes, ["hello"]);
  assert.equal(closed, true);
  // query "prompt" → request "granted".
  assert.equal(await adapter.ensureWritable(handle), true);
});

test("browserFileAccessAdapter is unsupported without a picker", () => {
  assert.equal(browserFileAccessAdapter({}).supported(), false);
});
