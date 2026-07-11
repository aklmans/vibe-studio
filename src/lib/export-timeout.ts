/**
 * Export watchdog — html-to-image can hang indefinitely (e.g. an embedded
 * font/image fetch that never settles). Racing every export against this
 * timeout guarantees the UI never sticks in a permanent "Exporting…" state;
 * the caller maps ExportTimeoutError to a localized error message.
 */

export const EXPORT_TIMEOUT_MS = 20_000;

export class ExportTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`export timed out after ${timeoutMs}ms`);
    this.name = "ExportTimeoutError";
  }
}

export function withExportTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = EXPORT_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ExportTimeoutError(timeoutMs)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
