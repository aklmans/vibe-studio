import { saveCurrentLiveData } from "../../../../../db/live-data-repository";
import {
  dateKeyFromSearchParams,
  localeFromSearchParams,
  withOptionalDatabaseFallback,
} from "../../../../../lib/live-data-api";
import { isLiveDataSnapshot } from "../../../../../lib/live-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const locale = localeFromSearchParams(url.searchParams);
  const dateKey = dateKeyFromSearchParams(url.searchParams);
  const payload = record(await request.json().catch(() => null));
  const liveData = payload?.liveData;

  if (!isLiveDataSnapshot(liveData)) {
    return Response.json({ error: "Invalid live data payload" }, { status: 400 });
  }

  return Response.json(
    await withOptionalDatabaseFallback(
      () => saveCurrentLiveData(locale, dateKey, liveData),
      {
        databaseConfigured: false,
        liveData: null,
      },
    ),
  );
}
