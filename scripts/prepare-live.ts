import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, openSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildObsOverlayUrl,
  prepareObsSceneConfig,
  prepareObsWebSocketConfig,
  type ObsSceneConfig,
  type ObsWebSocketConfig,
} from "../src/lib/live-prepare.ts";

const PORT = 3000;
const OBS_PROFILE = "Vibe Studio Overlay";
const OBS_SCENE_COLLECTION = "Vibe Studio Overlay";
const OBS_SCENE = "Vibe Live Overlay";
const OBS_PROCESS_PATTERN = "/Applications/OBS.app/Contents/MacOS/OBS";
const OBS_PROCESS_NAME = "OBS";
const OBS_SCENE_DIR = path.join(
  homedir(),
  "Library/Application Support/obs-studio/basic/scenes",
);
const OBS_WEBSOCKET_CONFIG_FILE = path.join(
  homedir(),
  "Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json",
);
const BILIBILI_APP_NAMES = [
  "哔哩哔哩",
  "哔哩哔哩直播姬",
  "Bilibili Livehime",
  "Bilibili",
] as const;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const livePrepareDir = path.join(repoRoot, "tmp/live-prepare");
const nextPidFile = path.join(livePrepareDir, "next-dev.pid");
const overlayUrl = buildObsOverlayUrl(PORT, "empty");
type LiveCommand = "prepare" | "status" | "stop" | "restart";
type ObsTarget = {
  profile: string;
  sceneCollection: string;
  sceneFile: string;
};

async function main(): Promise<void> {
  const command = parseCommand(process.argv[2]);
  console.log(`Vibe Studio ${command}`);
  console.log(`Repo: ${repoRoot}`);

  switch (command) {
    case "prepare":
      await prepareLive();
      break;
    case "status":
      await printStatus();
      break;
    case "stop":
      await stopLive();
      break;
    case "restart":
      await stopLive();
      await prepareLive();
      break;
  }
}

async function prepareLive(): Promise<void> {
  const obsTarget = await resolveObsTarget();
  await ensureNextDevServer();
  await quitObsIfRunning();
  await updateObsSceneFile(obsTarget);
  const obsWebSocketConfig = await updateObsWebSocketConfig();
  await openObs(obsTarget);
  await startObsVirtualCamera(obsWebSocketConfig);
  await openWebApp();
  await openBilibiliLivehime();

  console.log("");
  console.log("Ready for the manual steps:");
  console.log(`1. Fill stream title/tasks in http://localhost:${PORT}`);
  console.log("2. In Bilibili Livehime, confirm category and microphone.");
  console.log("3. Check the preview, then click 开始直播 manually.");
}

async function stopLive(): Promise<void> {
  await stopObsVirtualCamera();
  await quitObsIfRunning();
  await stopNextDevServer();
  console.log("Stopped local live tooling. Bilibili Livehime is left open intentionally.");
}

async function printStatus(): Promise<void> {
  const nextStatus = await probeOverlayRoute();
  const nextPid = await readPidFile();
  const obsPids = getObsPids();
  const livehimeApps = await getRunningBilibiliApps();

  console.log(`Next: ${nextStatus}${nextPid ? ` (pid file ${nextPid})` : ""}`);
  console.log(`OBS: ${obsPids.length > 0 ? `running (${obsPids.join(", ")})` : "not running"}`);
  console.log(
    `Bilibili Livehime: ${
      livehimeApps.length > 0 ? `running (${livehimeApps.join(", ")})` : "not detected"
    }`,
  );
}

async function ensureNextDevServer(): Promise<void> {
  const status = await probeOverlayRoute();
  if (status === "ready") {
    await writeNextListenerPidFile();
    console.log(`Next dev server is already ready on ${overlayUrl}`);
    return;
  }
  if (status === "occupied") {
    throw new Error(
      `Port ${PORT} responds, but it is not the Vibe overlay route. Stop the process on ${PORT} first.`,
    );
  }

  const logPath = path.join(livePrepareDir, "next-dev.log");
  await mkdir(livePrepareDir, { recursive: true });
  await writeFile(
    logPath,
    `\n\n=== live prepare ${new Date().toISOString()} ===\n`,
    { flag: "a" },
  );

  console.log(`Starting Next dev server on port ${PORT}...`);
  const outputFd = openSync(logPath, "a");
  const child = spawn("pnpm", ["exec", "next", "dev", "--port", String(PORT)], {
    cwd: repoRoot,
    detached: true,
    env: { ...process.env, FORCE_COLOR: "1" },
    stdio: ["ignore", outputFd, outputFd],
  });
  child.unref();
  closeSync(outputFd);

  const ready = await waitFor(async () => (await probeOverlayRoute()) === "ready", {
    timeoutMs: 45_000,
    intervalMs: 1_000,
  });
  if (!ready) {
    throw new Error(`Next dev server did not become ready. See ${logPath}`);
  }
  await writeNextListenerPidFile();
  console.log(`Next dev server is ready on ${overlayUrl}`);
}

async function stopNextDevServer(): Promise<void> {
  const status = await probeOverlayRoute();
  if (status === "down") {
    await removeNextPidFile();
    console.log("Next dev server is not running.");
    return;
  }
  if (status === "occupied") {
    console.log(
      `Port ${PORT} is occupied by a non-overlay app. Leaving it untouched.`,
    );
    return;
  }

  const pid = await readPidFile();
  const portPids = getPortPids(PORT);
  if (pid && isPidRunning(pid) && portPids.includes(pid)) {
    console.log(`Stopping Next dev server pid ${pid}...`);
    await stopPid(pid, "Next dev server");
    await removeNextPidFile();
    return;
  }
  if (pid && isPidRunning(pid)) {
    console.log(
      `Ignoring stale Next pid file ${pid}; it is not listening on port ${PORT}.`,
    );
  }

  if (portPids.length === 0) {
    await removeNextPidFile();
    console.log("Overlay route is ready but no listener pid was found.");
    return;
  }

  console.log(`Stopping Next dev server on port ${PORT}: ${portPids.join(", ")}...`);
  for (const portPid of portPids) {
    await stopPid(portPid, `port ${PORT} listener`);
  }
  await removeNextPidFile();
}

async function resolveObsTarget(): Promise<ObsTarget> {
  const sceneFile = path.join(OBS_SCENE_DIR, `${OBS_SCENE_COLLECTION}.json`);
  try {
    await readFile(sceneFile, "utf8");
    return {
      profile: OBS_PROFILE,
      sceneCollection: OBS_SCENE_COLLECTION,
      sceneFile,
    };
  } catch (error) {
    if (getErrorCode(error) === "ENOENT") {
      throw new Error(`OBS scene collection was not found: ${sceneFile}`);
    }
    throw error;
  }
}

async function updateObsSceneFile(target: ObsTarget): Promise<void> {
  const raw = await readFile(target.sceneFile, "utf8");
  const parsed = JSON.parse(raw) as ObsSceneConfig;
  const { config, changes } = prepareObsSceneConfig(parsed, {
    port: PORT,
    sceneName: OBS_SCENE,
  });
  const backupPath = `${target.sceneFile}.live-prepare-${timestamp()}.bak`;

  await writeFile(backupPath, raw);
  await writeFile(target.sceneFile, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`Updated OBS scene file: ${target.sceneFile}`);
  console.log(`Backup: ${backupPath}`);
  for (const change of changes) {
    console.log(`- ${change}`);
  }
}

async function updateObsWebSocketConfig(): Promise<ObsWebSocketConfig | null> {
  try {
    const raw = await readFile(OBS_WEBSOCKET_CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as ObsWebSocketConfig;
    const { config, changes } = prepareObsWebSocketConfig(parsed);

    if (changes.length > 0) {
      const backupPath = `${OBS_WEBSOCKET_CONFIG_FILE}.live-prepare-${timestamp()}.bak`;
      await writeFile(backupPath, raw);
      await writeFile(
        OBS_WEBSOCKET_CONFIG_FILE,
        `${JSON.stringify(config, null, 2)}\n`,
      );
      console.log(`Updated OBS WebSocket config: ${OBS_WEBSOCKET_CONFIG_FILE}`);
      console.log(`Backup: ${backupPath}`);
      for (const change of changes) {
        console.log(`- ${change}`);
      }
    }

    return config;
  } catch (error) {
    console.log(
      `Could not update OBS WebSocket config, virtual camera may need manual start: ${formatError(error)}`,
    );
    return null;
  }
}

async function quitObsIfRunning(): Promise<void> {
  const runningPids = getObsPids();
  if (runningPids.length === 0) {
    return;
  }

  console.log(
    `OBS is running (${runningPids.join(", ")}). Asking OBS to quit so the scene file reloads...`,
  );
  const quitResult = await tryRun("osascript", [
    "-e",
    'tell application "OBS" to quit',
  ]);
  if (!quitResult.ok) {
    console.log(`OBS quit request failed: ${quitResult.message}`);
  } else {
    const stopped = await waitFor(async () => !isObsRunning(), {
      timeoutMs: 15_000,
      intervalMs: 1_000,
    });
    if (stopped) {
      return;
    }
  }

  console.log(
    "Force-stopping OBS so the scene file can reload...",
  );
  signalObsProcesses("SIGTERM");
  const terminated = await waitFor(async () => !isObsRunning(), {
    timeoutMs: 10_000,
    intervalMs: 1_000,
  });
  if (terminated) {
    return;
  }

  console.log("OBS is still running after SIGTERM. Sending SIGKILL to OBS only...");
  signalObsProcesses("SIGKILL");
  const killed = await waitFor(async () => !isObsRunning(), {
    timeoutMs: 5_000,
    intervalMs: 500,
  });
  if (killed) {
    return;
  }

  throw new Error(
    "OBS could not be stopped automatically. Close OBS manually, then run pnpm live:prepare again.",
  );
}

async function openObs(target: ObsTarget): Promise<void> {
  console.log("Opening OBS...");
  await run("open", [
    "-a",
    "OBS",
    "--args",
    "--profile",
    target.profile,
    "--collection",
    target.sceneCollection,
    "--scene",
    OBS_SCENE,
  ]);

  const opened = await waitFor(async () => isObsRunning(), {
    timeoutMs: 15_000,
    intervalMs: 1_000,
  });
  if (!opened) {
    throw new Error("OBS did not start within 15s.");
  }
}

async function startObsVirtualCamera(
  config: ObsWebSocketConfig | null,
): Promise<void> {
  if (!config) {
    console.log("Skipping automatic OBS Virtual Camera start.");
    return;
  }

  console.log("Starting OBS Virtual Camera after OBS finishes startup...");
  const started = await waitFor(
    async () => {
      try {
        await startObsVirtualCameraViaWebSocket(config);
        return true;
      } catch {
        return false;
      }
    },
    {
      timeoutMs: 45_000,
      intervalMs: 2_000,
    },
  );

  if (started) {
    console.log("OBS Virtual Camera is ready.");
    return;
  }

  console.log(
    "Could not start OBS Virtual Camera automatically. In OBS, click Start Virtual Camera once if Bilibili cannot see it.",
  );
}

async function stopObsVirtualCamera(): Promise<void> {
  const config = await readObsWebSocketConfig();
  if (!config || !isObsRunning()) {
    return;
  }

  try {
    await stopObsVirtualCameraViaWebSocket(config);
    console.log("OBS Virtual Camera is stopped.");
  } catch (error) {
    console.log(
      `Could not stop OBS Virtual Camera automatically: ${formatError(error)}`,
    );
  }
}

async function openWebApp(): Promise<void> {
  console.log(`Opening web app: http://localhost:${PORT}`);
  await run("open", [`http://localhost:${PORT}`]);
}

async function openBilibiliLivehime(): Promise<void> {
  console.log("Opening Bilibili Livehime...");
  const openedName = await openFirstAvailableApp(BILIBILI_APP_NAMES);
  console.log(`Opened ${openedName}.`);
  console.log(
    "Bilibili Livehime should keep the OBS Virtual Camera material from the previous setup.",
  );
}

async function probeOverlayRoute(): Promise<"ready" | "occupied" | "down"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2_500);
  try {
    const response = await fetch(overlayUrl, { signal: controller.signal });
    const text = await response.text();

    if (response.ok && text.includes('data-testid="obs-source-overlay"')) {
      return "ready";
    }
    return "occupied";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}

function isObsRunning(): boolean {
  return getObsPids().length > 0;
}

function getObsPids(): number[] {
  const pids = new Set<number>();
  for (const args of [
    ["-x", OBS_PROCESS_NAME],
    ["-f", OBS_PROCESS_PATTERN],
  ]) {
    const result = spawnSync("pgrep", args, {
      encoding: "utf8",
    });
    if (result.status !== 0 || !result.stdout) {
      continue;
    }
    for (const line of result.stdout.trim().split("\n")) {
      const pid = Number.parseInt(line, 10);
      if (Number.isInteger(pid) && pid > 0) {
        pids.add(pid);
      }
    }
  }
  return [...pids];
}

function getPortPids(port: number): number[] {
  const result = spawnSync("lsof", ["-nP", "-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  if (result.status !== 0 || !result.stdout) {
    return [];
  }
  return result.stdout
    .trim()
    .split("\n")
    .map((line) => Number.parseInt(line, 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
}

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopPid(pid: number, label: string): Promise<void> {
  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    if (getErrorCode(error) !== "ESRCH") {
      console.log(`Could not send SIGTERM to ${label} pid ${pid}: ${String(error)}`);
    }
  }

  const stopped = await waitFor(() => !isPidRunning(pid), {
    timeoutMs: 8_000,
    intervalMs: 500,
  });
  if (stopped) {
    return;
  }

  console.log(`${label} pid ${pid} did not stop after SIGTERM. Sending SIGKILL...`);
  try {
    process.kill(pid, "SIGKILL");
  } catch (error) {
    if (getErrorCode(error) !== "ESRCH") {
      console.log(`Could not send SIGKILL to ${label} pid ${pid}: ${String(error)}`);
    }
  }
}

function signalObsProcesses(signal: NodeJS.Signals): void {
  for (const pid of getObsPids()) {
    try {
      process.kill(pid, signal);
    } catch (error) {
      const code = getErrorCode(error);
      if (code !== "ESRCH") {
        console.log(`Could not send ${signal} to OBS pid ${pid}: ${String(error)}`);
      }
    }
  }
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "ignore",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function startObsVirtualCameraViaWebSocket(
  config: ObsWebSocketConfig,
): Promise<void> {
  const port = typeof config.server_port === "number" ? config.server_port : 4455;
  const authRequired = config.auth_required === true;
  const password =
    typeof config.server_password === "string" ? config.server_password : "";
  const socket = await identifyObsWebSocket({
    port,
    password,
    authRequired,
  });

  try {
    const status = await sendObsRequest(socket, "GetVirtualCamStatus");
    const responseData = toRecord(status.responseData);
    if (responseData?.outputActive === true) {
      return;
    }

    await sendObsRequest(socket, "StartVirtualCam");
  } finally {
    socket.close();
  }
}

async function stopObsVirtualCameraViaWebSocket(
  config: ObsWebSocketConfig,
): Promise<void> {
  const port = typeof config.server_port === "number" ? config.server_port : 4455;
  const authRequired = config.auth_required === true;
  const password =
    typeof config.server_password === "string" ? config.server_password : "";
  const socket = await identifyObsWebSocket({
    port,
    password,
    authRequired,
  });

  try {
    const status = await sendObsRequest(socket, "GetVirtualCamStatus");
    const responseData = toRecord(status.responseData);
    if (responseData?.outputActive !== true) {
      return;
    }

    await sendObsRequest(socket, "StopVirtualCam");
  } finally {
    socket.close();
  }
}

function identifyObsWebSocket(options: {
  port: number;
  password: string;
  authRequired: boolean;
}): Promise<WebSocket> {
  if (typeof WebSocket === "undefined") {
    return Promise.reject(new Error("This Node.js runtime has no WebSocket."));
  }

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${options.port}`);
    const timeout = setTimeout(() => {
      cleanup();
      socket.close();
      reject(new Error("Timed out while connecting to OBS WebSocket."));
    }, 5_000);

    function cleanup(): void {
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    }

    function onError(): void {
      cleanup();
      reject(new Error("OBS WebSocket connection failed."));
    }

    function onClose(): void {
      cleanup();
      reject(new Error("OBS WebSocket closed before identification."));
    }

    function onMessage(event: MessageEvent): void {
      const message = parseObsMessage(event.data);
      if (!message) {
        return;
      }

      if (message.op === 0) {
        const hello = toRecord(message.d);
        const authentication = toRecord(hello?.authentication);
        const identifyData: Record<string, unknown> = {
          rpcVersion: typeof hello?.rpcVersion === "number" ? hello.rpcVersion : 1,
        };

        if (authentication) {
          if (!options.authRequired || options.password.length === 0) {
            cleanup();
            socket.close();
            reject(new Error("OBS WebSocket requires a password."));
            return;
          }

          const challenge = asString(authentication.challenge);
          const salt = asString(authentication.salt);
          if (!challenge || !salt) {
            cleanup();
            socket.close();
            reject(new Error("OBS WebSocket sent invalid authentication data."));
            return;
          }
          identifyData.authentication = createObsWebSocketAuth(
            options.password,
            salt,
            challenge,
          );
        }

        socket.send(JSON.stringify({ op: 1, d: identifyData }));
        return;
      }

      if (message.op === 2) {
        cleanup();
        resolve(socket);
      }
    }

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);
  });
}

function sendObsRequest(
  socket: WebSocket,
  requestType: string,
): Promise<{ responseData?: unknown }> {
  return new Promise((resolve, reject) => {
    const requestId = `${requestType}-${Date.now()}-${Math.random()}`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`${requestType} timed out.`));
    }, 5_000);

    function cleanup(): void {
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
    }

    function onError(): void {
      cleanup();
      reject(new Error(`OBS WebSocket failed during ${requestType}.`));
    }

    function onMessage(event: MessageEvent): void {
      const message = parseObsMessage(event.data);
      if (message?.op !== 7) {
        return;
      }

      const data = toRecord(message.d);
      if (data?.requestId !== requestId) {
        return;
      }

      cleanup();
      const requestStatus = toRecord(data.requestStatus);
      if (requestStatus?.result !== true) {
        reject(
          new Error(
            `${requestType} failed: ${asString(requestStatus?.comment) ?? "unknown error"}`,
          ),
        );
        return;
      }
      resolve({ responseData: data.responseData });
    }

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.send(
      JSON.stringify({
        op: 6,
        d: {
          requestId,
          requestType,
        },
      }),
    );
  });
}

function createObsWebSocketAuth(
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

function parseObsMessage(data: unknown): { op: number; d?: unknown } | null {
  if (typeof data !== "string") {
    return null;
  }
  const parsed = JSON.parse(data) as unknown;
  const record = toRecord(parsed);
  if (!record || typeof record.op !== "number") {
    return null;
  }
  return { op: record.op, d: record.d };
}

async function tryRun(
  command: string,
  args: string[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await run(command, args);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function openFirstAvailableApp(
  appNames: readonly string[],
): Promise<string> {
  const failures: string[] = [];
  for (const appName of appNames) {
    const result = await tryRun("open", ["-a", appName]);
    if (result.ok) {
      return appName;
    }
    failures.push(`${appName}: ${result.message}`);
  }

  throw new Error(
    `Could not open Bilibili Livehime. Tried: ${failures.join("; ")}`,
  );
}

async function getRunningBilibiliApps(): Promise<string[]> {
  const running: string[] = [];
  for (const appName of BILIBILI_APP_NAMES) {
    const result = spawnSync("osascript", [
      "-e",
      `application "${escapeAppleScriptString(appName)}" is running`,
    ], {
      encoding: "utf8",
    });
    if (result.status !== 0 || result.stdout.trim() !== "true") {
      continue;
    }
    running.push(appName);
  }
  return [...new Set(running)];
}

function escapeAppleScriptString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function readObsWebSocketConfig(): Promise<ObsWebSocketConfig | null> {
  try {
    const raw = await readFile(OBS_WEBSOCKET_CONFIG_FILE, "utf8");
    return JSON.parse(raw) as ObsWebSocketConfig;
  } catch {
    return null;
  }
}

async function readPidFile(): Promise<number | null> {
  try {
    const raw = await readFile(nextPidFile, "utf8");
    const pid = Number.parseInt(raw.trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

async function removeNextPidFile(): Promise<void> {
  try {
    await unlink(nextPidFile);
  } catch (error) {
    if (getErrorCode(error) !== "ENOENT") {
      console.log(`Could not remove ${nextPidFile}: ${String(error)}`);
    }
  }
}

async function writeNextListenerPidFile(): Promise<void> {
  const [pid] = getPortPids(PORT);
  if (!pid) {
    return;
  }
  await mkdir(livePrepareDir, { recursive: true });
  await writeFile(nextPidFile, `${pid}\n`);
}

function parseCommand(value: string | undefined): LiveCommand {
  if (
    value === undefined ||
    value === "prepare" ||
    value === "status" ||
    value === "stop" ||
    value === "restart"
  ) {
    return value ?? "prepare";
  }

  throw new Error(
    `Unknown live command "${value}". Use prepare, status, stop, or restart.`,
  );
}

async function waitFor(
  predicate: () => Promise<boolean> | boolean,
  options: { timeoutMs: number; intervalMs: number },
): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < options.timeoutMs) {
    if (await predicate()) {
      return true;
    }
    await delay(options.intervalMs);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("");
  console.error(`live command failed: ${message}`);
  process.exitCode = 1;
});
