/*
 * Optional bound-file workflow for live-session.config.json.
 *
 * This is an *enhancement* over manual import / export, never a requirement:
 *  - It uses the File System Access API, behind feature detection. Browsers
 *    without it keep the existing Import / Export and never see "bind" actions.
 *  - The file is bound only by an explicit user pick — no disk scanning, no
 *    default project file, no watching. Reading and saving are manual user
 *    actions; a bound file never auto-overwrites OverlayState.
 *  - A read lands in the editing buffer and still goes through review + Apply.
 *  - A save always writes the current state's v1 projection, never the draft.
 *
 * All I/O sits behind FileAccessAdapter so the workflow is testable with a fake
 * adapter — tests never touch a real file picker. The state transitions and
 * feature detection are pure.
 */

/** Opaque handle (a FileSystemFileHandle in the browser). */
export type ConfigFileHandle = unknown;

export interface FileAccessAdapter {
  supported(): boolean;
  /** Prompt the user to pick a file to bind. */
  pick(): Promise<{ handle: ConfigFileHandle; name: string }>;
  read(handle: ConfigFileHandle): Promise<string>;
  write(handle: ConfigFileHandle, text: string): Promise<void>;
  ensureReadable(handle: ConfigFileHandle): Promise<boolean>;
  ensureWritable(handle: ConfigFileHandle): Promise<boolean>;
}

// ─── Feature detection ───────────────────────────────────────────────────────

interface FsaScope {
  showOpenFilePicker?: (options?: unknown) => Promise<unknown[]>;
}

function defaultScope(): FsaScope | undefined {
  return typeof window !== "undefined" ? (window as unknown as FsaScope) : undefined;
}

/** True only when the File System Access open-picker is available. */
export function fileSystemAccessSupported(
  scope: FsaScope | undefined = defaultScope(),
): boolean {
  return !!scope && typeof scope.showOpenFilePicker === "function";
}

// ─── Binding state model (pure) ──────────────────────────────────────────────

export type FileBindingStatus =
  | "unsupported"
  | "unbound"
  | "bound"
  | "permission-lost"
  | "read-error"
  | "write-error";

export interface FileBindingState {
  status: FileBindingStatus;
  fileName: string | null;
  lastReadAt: string | null;
  lastWriteAt: string | null;
  error: string | null;
}

export function initialFileBinding(supported: boolean): FileBindingState {
  return {
    status: supported ? "unbound" : "unsupported",
    fileName: null,
    lastReadAt: null,
    lastWriteAt: null,
    error: null,
  };
}

export function boundTo(name: string): FileBindingState {
  return { status: "bound", fileName: name, lastReadAt: null, lastWriteAt: null, error: null };
}

export function markRead(prev: FileBindingState, at: string): FileBindingState {
  return { ...prev, status: "bound", lastReadAt: at, error: null };
}

export function markWrite(prev: FileBindingState, at: string): FileBindingState {
  return { ...prev, status: "bound", lastWriteAt: at, error: null };
}

export function markReadError(prev: FileBindingState, error: string): FileBindingState {
  return { ...prev, status: "read-error", error };
}

export function markWriteError(prev: FileBindingState, error: string): FileBindingState {
  return { ...prev, status: "write-error", error };
}

/** Permission to a still-bound file was lost; keep the name, prompt a relink. */
export function markPermissionLost(prev: FileBindingState): FileBindingState {
  return { ...prev, status: "permission-lost" };
}

// ─── Read / write controllers (async, mockable) ──────────────────────────────

export type BoundReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: "permission" | "io"; error: string };

export type BoundWriteResult =
  | { ok: true }
  | { ok: false; reason: "permission" | "io"; error: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Read a bound file's text. Verifies read permission first (a lost grant returns
 * `permission`, not a thrown error). The text is returned for the caller to put
 * in the editing buffer — this function never applies anything to state.
 */
export async function readBoundFile(
  adapter: FileAccessAdapter,
  handle: ConfigFileHandle,
): Promise<BoundReadResult> {
  try {
    if (!(await adapter.ensureReadable(handle))) {
      return { ok: false, reason: "permission", error: "permission" };
    }
    const text = await adapter.read(handle);
    return { ok: true, text };
  } catch (error) {
    return { ok: false, reason: "io", error: errorMessage(error) };
  }
}

/**
 * Write text to a bound file. Callers pass the current state projection (never a
 * draft). Verifies write permission first; a failed write returns an error and
 * leaves any editing draft untouched (the caller's drift state is not changed).
 */
export async function writeBoundFile(
  adapter: FileAccessAdapter,
  handle: ConfigFileHandle,
  text: string,
): Promise<BoundWriteResult> {
  try {
    if (!(await adapter.ensureWritable(handle))) {
      return { ok: false, reason: "permission", error: "permission" };
    }
    await adapter.write(handle, text);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "io", error: errorMessage(error) };
  }
}

// ─── Browser adapter (real File System Access API) ───────────────────────────

interface FsaHandle {
  name?: string;
  getFile(): Promise<{ text(): Promise<string> }>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  queryPermission?(opts: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission?(opts: { mode: "read" | "readwrite" }): Promise<PermissionState>;
}

async function ensurePermission(
  handle: FsaHandle,
  mode: "read" | "readwrite",
): Promise<boolean> {
  const opts = { mode } as const;
  if (typeof handle.queryPermission === "function") {
    if ((await handle.queryPermission(opts)) === "granted") return true;
  }
  if (typeof handle.requestPermission === "function") {
    return (await handle.requestPermission(opts)) === "granted";
  }
  // No permission API to consult — the pick itself granted access.
  return true;
}

/** The real File System Access adapter. `supported()` gates all use. */
export function browserFileAccessAdapter(
  scope: FsaScope | undefined = defaultScope(),
): FileAccessAdapter {
  const open = () => {
    const picker = scope?.showOpenFilePicker;
    if (typeof picker !== "function") {
      throw new Error("File System Access API is not available.");
    }
    return picker({
      multiple: false,
      types: [
        {
          description: "Live session config",
          accept: { "application/json": [".json"] },
        },
      ],
    });
  };

  return {
    supported: () => fileSystemAccessSupported(scope),
    async pick() {
      const [handle] = (await open()) as FsaHandle[];
      return { handle, name: handle?.name ?? "live-session.config.json" };
    },
    async read(handle) {
      const file = await (handle as FsaHandle).getFile();
      return file.text();
    },
    async write(handle, text) {
      const writable = await (handle as FsaHandle).createWritable();
      await writable.write(text);
      await writable.close();
    },
    ensureReadable(handle) {
      return ensurePermission(handle as FsaHandle, "read");
    },
    ensureWritable(handle) {
      return ensurePermission(handle as FsaHandle, "readwrite");
    },
  };
}
