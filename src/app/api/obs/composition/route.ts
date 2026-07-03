/*
 * Local OBS composition control — private/local Studio only.
 *
 * Talks to the operator's OWN OBS over obs-websocket on 127.0.0.1 (config from
 * the same file `pnpm live:prepare` manages; the password stays server-side).
 * On the public showcase this surface does not exist: the route 404s, matching
 * the product contract that a hosted demo can never control anyone's OBS.
 */

import {
  isCameraSlotChoice,
  isCompositionLayout,
  type CompositionState,
} from "../../../../lib/obs-composition";
import {
  applyComposition,
  probeComposition,
} from "../../../../lib/obs-composition-runtime";
import {
  connectObsWebSocket,
  readObsWebSocketConfig,
  type ObsConnection,
} from "../../../../lib/obs-ws";
import { isShowcase } from "../../../../lib/site-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenResult =
  | { connection: ObsConnection }
  | { error: "config" | "unreachable" };

/** Connect to the local OBS; distinguish "never prepared" from "not running". */
async function openConnection(): Promise<OpenResult> {
  const config = await readObsWebSocketConfig();
  if (!config || config.server_enabled !== true) return { error: "config" };
  try {
    return { connection: await connectObsWebSocket(config) };
  } catch {
    return { error: "unreachable" };
  }
}

export async function GET() {
  if (isShowcase()) return new Response(null, { status: 404 });

  const opened = await openConnection();
  if ("error" in opened) {
    return Response.json({ connected: false, reason: opened.error });
  }
  try {
    const probe = await probeComposition(opened.connection);
    return Response.json({ connected: true, ...probe });
  } catch {
    return Response.json({ connected: false, reason: "error" });
  } finally {
    opened.connection.close();
  }
}

export async function POST(request: Request) {
  if (isShowcase()) return new Response(null, { status: 404 });

  const body = (await request.json().catch(() => null)) as
    | Partial<CompositionState>
    | null;
  if (!body || !isCameraSlotChoice(body.cameraSlot) || !isCompositionLayout(body.layout)) {
    return Response.json(
      { ok: false, error: "cameraSlot and layout are required" },
      { status: 400 },
    );
  }
  const state: CompositionState = { cameraSlot: body.cameraSlot, layout: body.layout };

  const opened = await openConnection();
  if ("error" in opened) {
    return Response.json(
      { ok: false, connected: false, reason: opened.error },
      { status: 503 },
    );
  }
  try {
    const result = await applyComposition(opened.connection, state);
    if (!result.ok) {
      return Response.json({ connected: true, ...result }, { status: 422 });
    }
    return Response.json({
      ok: true,
      connected: true,
      applied: state,
      missingSources: result.missingSources,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OBS request failed";
    return Response.json(
      { ok: false, connected: true, error: message },
      { status: 502 },
    );
  } finally {
    opened.connection.close();
  }
}
