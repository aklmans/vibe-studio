import {
  isLiveDataSnapshot,
  type LiveDataSnapshot,
} from "./live-data";
import type { Locale } from "./i18n";

export interface LiveDataApiResult {
  databaseConfigured: boolean;
  liveData: LiveDataSnapshot | null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function parseApiResult(value: unknown): LiveDataApiResult {
  const source = record(value);
  return {
    databaseConfigured: source?.databaseConfigured === true,
    liveData: isLiveDataSnapshot(source?.liveData) ? source.liveData : null,
  };
}

async function readApiResult(response: Response): Promise<LiveDataApiResult> {
  if (!response.ok) {
    throw new Error(`Live data request failed: ${response.status}`);
  }
  return parseApiResult(await response.json());
}

function currentParams(locale: Locale, dateKey: string): string {
  const params = new URLSearchParams({ locale, dateKey });
  return params.toString();
}

export async function fetchCurrentLiveData(
  locale: Locale,
  dateKey: string,
  signal?: AbortSignal,
): Promise<LiveDataApiResult> {
  return readApiResult(
    await fetch(`/api/sessions/current?${currentParams(locale, dateKey)}`, {
      signal,
    }),
  );
}

export async function saveCurrentLiveData(
  locale: Locale,
  dateKey: string,
  liveData: LiveDataSnapshot,
  signal?: AbortSignal,
): Promise<LiveDataApiResult> {
  return readApiResult(
    await fetch(
      `/api/sessions/current/live-data?${currentParams(locale, dateKey)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ liveData }),
        signal,
      },
    ),
  );
}

export async function startCurrentLiveSession(
  locale: Locale,
  dateKey: string,
  signal?: AbortSignal,
): Promise<LiveDataApiResult> {
  return readApiResult(
    await fetch(`/api/sessions/current/start?${currentParams(locale, dateKey)}`, {
      method: "POST",
      signal,
    }),
  );
}

export async function endCurrentLiveSession(
  locale: Locale,
  dateKey: string,
  signal?: AbortSignal,
): Promise<LiveDataApiResult> {
  return readApiResult(
    await fetch(`/api/sessions/current/end?${currentParams(locale, dateKey)}`, {
      method: "POST",
      signal,
    }),
  );
}
