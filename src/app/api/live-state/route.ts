import {
  getLiveStateSnapshot,
  setLiveStateSnapshot,
} from "../../../lib/live-state";
import { isShowcase } from "../../../lib/site-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(getLiveStateSnapshot());
}

export async function PATCH(request: Request) {
  // The live-state store is a single-user surface (one host, one OBS). On the
  // public showcase the write path does not exist — matching /api/obs/composition —
  // so anonymous visitors cannot rewrite what the shared demo's OBS pages show.
  // Reads stay open (the OBS routes must still render).
  if (isShowcase()) return new Response(null, { status: 404 });
  const payload = await request.json().catch(() => null);
  return Response.json(setLiveStateSnapshot(payload));
}
