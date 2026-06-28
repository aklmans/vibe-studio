import { startCurrentLiveSession } from "../../../../../db/live-data-repository";
import {
  dateKeyFromSearchParams,
  localeFromSearchParams,
  withOptionalDatabaseFallback,
} from "../../../../../lib/live-data-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const locale = localeFromSearchParams(url.searchParams);
  const dateKey = dateKeyFromSearchParams(url.searchParams);

  return Response.json(
    await withOptionalDatabaseFallback(() => startCurrentLiveSession(locale, dateKey), {
      databaseConfigured: false,
      liveData: null,
    }),
  );
}
