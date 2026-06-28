import { isDatabaseConfigured } from "../../../db/client";
import { listLiveSessions } from "../../../db/live-data-repository";
import { withOptionalDatabaseFallback } from "../../../lib/live-data-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  return Response.json(
    await withOptionalDatabaseFallback(
      async () => ({
        databaseConfigured: isDatabaseConfigured(),
        sessions: await listLiveSessions(),
      }),
      {
        databaseConfigured: false,
        sessions: [],
      },
    ),
  );
}
