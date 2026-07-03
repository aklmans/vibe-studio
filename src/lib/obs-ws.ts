/*
 * Minimal obs-websocket v5 client for the local/private Studio.
 *
 * Server-only (node builtins): reads the local OBS websocket config (port +
 * password) from the same file `pnpm live:prepare` manages, connects to
 * ws://127.0.0.1, performs the Hello → Identify(auth) → Identified handshake,
 * then issues requests over one socket. The password never leaves this module:
 * it is not logged, not echoed into errors, and never reaches a client.
 *
 * The handshake intentionally mirrors scripts/prepare-live.ts, which keeps its
 * own copy so the author's proven streaming automation stays untouched.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { ObsWebSocketConfig } from "./live-prepare";

export const OBS_WEBSOCKET_CONFIG_FILE = path.join(
  homedir(),
  "Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json",
);

/** obs-websocket v5 challenge-response: base64(sha256(base64(sha256(password+salt)) + challenge)). */
export function createObsWebSocketAuth(
  password: string,
  salt: string,
  challenge: string,
): string {
  const secret = sha256Base64(`${password}${salt}`);
  return sha256Base64(`${secret}${challenge}`);
}

function sha256Base64(value: string): string {
  return createHash("sha256").update(value).digest("base64");
}

export async function readObsWebSocketConfig(
  file = OBS_WEBSOCKET_CONFIG_FILE,
): Promise<ObsWebSocketConfig | null> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as ObsWebSocketConfig;
  } catch {
    return null;
  }
}

/** A request the OBS server answered with result=false (e.g. 600 = not found). */
export class ObsRequestError extends Error {
  readonly code: number | undefined;

  constructor(requestType: string, code: number | undefined, comment: string | undefined) {
    super(`${requestType} failed${code ? ` (${code})` : ""}${comment ? `: ${comment}` : ""}`);
    this.name = "ObsRequestError";
    this.code = code;
  }
}

export const OBS_ERROR_RESOURCE_NOT_FOUND = 600;

export interface ObsConnection {
  request(
    requestType: string,
    requestData?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  close(): void;
}

interface PendingRequest {
  resolve(data: Record<string, unknown>): void;
  reject(error: Error): void;
  timer: ReturnType<typeof setTimeout>;
  requestType: string;
}

/**
 * Connect + identify against the local OBS instance. Throws when OBS is not
 * running, the websocket server is off, or authentication fails — callers map
 * that to a key-free "not connected" status.
 */
export function connectObsWebSocket(
  config: ObsWebSocketConfig,
  timeoutMs = 4_000,
): Promise<ObsConnection> {
  if (typeof WebSocket === "undefined") {
    return Promise.reject(new Error("This runtime has no WebSocket client."));
  }

  const port = typeof config.server_port === "number" ? config.server_port : 4455;
  const password =
    typeof config.server_password === "string" ? config.server_password : "";

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const pending = new Map<string, PendingRequest>();
    let identified = false;

    const connectTimer = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out while connecting to OBS WebSocket."));
    }, timeoutMs);

    function failAllPending(error: Error): void {
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(error);
      }
      pending.clear();
    }

    socket.addEventListener("error", () => {
      clearTimeout(connectTimer);
      if (!identified) reject(new Error("OBS WebSocket connection failed."));
      failAllPending(new Error("OBS WebSocket connection failed."));
    });

    socket.addEventListener("close", () => {
      clearTimeout(connectTimer);
      if (!identified) reject(new Error("OBS WebSocket closed before identification."));
      failAllPending(new Error("OBS WebSocket closed."));
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      const message = parseObsMessage(event.data);
      if (!message) return;

      // Hello → Identify (with challenge-response auth when the server asks).
      if (message.op === 0) {
        const hello = toRecord(message.d);
        const authentication = toRecord(hello?.authentication);
        const identifyData: Record<string, unknown> = {
          rpcVersion: typeof hello?.rpcVersion === "number" ? hello.rpcVersion : 1,
        };
        if (authentication) {
          const challenge = asString(authentication.challenge);
          const salt = asString(authentication.salt);
          if (!password || !challenge || !salt) {
            clearTimeout(connectTimer);
            socket.close();
            reject(new Error("OBS WebSocket requires a password."));
            return;
          }
          identifyData.authentication = createObsWebSocketAuth(password, salt, challenge);
        }
        socket.send(JSON.stringify({ op: 1, d: identifyData }));
        return;
      }

      // Identified → the connection is usable.
      if (message.op === 2) {
        clearTimeout(connectTimer);
        identified = true;
        resolve(connection);
        return;
      }

      // RequestResponse → settle the matching pending request.
      if (message.op === 7) {
        const data = toRecord(message.d);
        const requestId = asString(data?.requestId);
        if (!requestId) return;
        const entry = pending.get(requestId);
        if (!entry) return;
        pending.delete(requestId);
        clearTimeout(entry.timer);

        const status = toRecord(data?.requestStatus);
        if (status?.result !== true) {
          entry.reject(
            new ObsRequestError(
              entry.requestType,
              typeof status?.code === "number" ? status.code : undefined,
              asString(status?.comment),
            ),
          );
          return;
        }
        entry.resolve(toRecord(data?.responseData) ?? {});
      }
    });

    const connection: ObsConnection = {
      request(requestType, requestData) {
        return new Promise<Record<string, unknown>>((resolveRequest, rejectRequest) => {
          if (socket.readyState !== WebSocket.OPEN) {
            rejectRequest(new Error("OBS WebSocket is not open."));
            return;
          }
          const requestId = crypto.randomUUID();
          const timer = setTimeout(() => {
            pending.delete(requestId);
            rejectRequest(new Error(`${requestType} timed out.`));
          }, timeoutMs);
          pending.set(requestId, {
            resolve: resolveRequest,
            reject: rejectRequest,
            timer,
            requestType,
          });
          socket.send(
            JSON.stringify({
              op: 6,
              d: {
                requestId,
                requestType,
                ...(requestData ? { requestData } : {}),
              },
            }),
          );
        });
      },
      close() {
        socket.close();
      },
    };
  });
}

function parseObsMessage(data: unknown): { op: number; d?: unknown } | null {
  if (typeof data !== "string") return null;
  try {
    const record = toRecord(JSON.parse(data) as unknown);
    if (!record || typeof record.op !== "number") return null;
    return { op: record.op, d: record.d };
  } catch {
    return null;
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
