/*
 * Bound an uploaded image before it becomes a data: URI in state.
 *
 * A raw multi-megapixel photo read straight to a base64 data URI can blow past
 * the ~5MB localStorage quota (breaking persistence) and bloats the export DOM.
 * This decodes the file, downscales it so its longest edge is at most
 * `maxDimension`, and re-encodes it — typically shrinking a phone photo to tens
 * of KB. Browser-only (Image + canvas); it is never imported on the server.
 *
 * Note: this is a weight/quota guard, not the privacy guard. Uploaded images are
 * separately redacted before any provider call (see config-privacy) — a small
 * data URI is still a personal photo and must not leave the machine.
 */

export interface DownscaleOptions {
  /** Cap for the longest edge, in pixels. */
  maxDimension: number;
  /** Output encoding; WebP keeps alpha and compresses well. */
  mimeType?: string;
  /** Quality for lossy encodings (0–1). */
  quality?: number;
}

/**
 * Decode `file`, downscale to `maxDimension`, and return a data: URL. Rejects if
 * the file cannot be decoded as an image, so a caller never silently stores an
 * unbounded blob. An image already within bounds is re-encoded (still cheap) so
 * the output stays a predictable, compressed size.
 */
export function downscaleImageToDataUrl(
  file: File,
  { maxDimension, mimeType = "image/webp", quality = 0.85 }: DownscaleOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: width, naturalHeight: height } = image;
      if (!width || !height) {
        reject(new Error("image has no dimensions"));
        return;
      }
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas 2d context unavailable"));
        return;
      }
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      // toDataURL falls back to PNG when the requested type is unsupported; both
      // are bounded by the target dimensions, so either is safe to store.
      resolve(canvas.toDataURL(mimeType, quality));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("could not decode image"));
    };

    image.src = objectUrl;
  });
}
