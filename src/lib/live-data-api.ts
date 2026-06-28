import type { Locale } from "./i18n";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localeFromSearchParams(searchParams: URLSearchParams): Locale {
  return searchParams.get("locale") === "en" ? "en" : "zh";
}

export function dateKeyFromSearchParams(
  searchParams: URLSearchParams,
  now = new Date(),
): string {
  const value = searchParams.get("dateKey");
  return value && DATE_KEY_PATTERN.test(value) ? value : formatDateKey(now);
}

export async function withOptionalDatabaseFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation();
  } catch {
    return fallback;
  }
}
