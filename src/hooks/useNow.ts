import { useEffect, useState } from "react";

/**
 * Returns "now" as a millisecond epoch, refreshed every second. Used by the
 * Bottom Bar's Live slot so OBS browser sources tick the elapsed time without
 * the parent re-rendering on every state change.
 *
 * Pause via the `enabled` flag (e.g. when no startedAt is set) to avoid an
 * idle interval.
 */
export function useNow(enabled: boolean = true): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);

  return now;
}
