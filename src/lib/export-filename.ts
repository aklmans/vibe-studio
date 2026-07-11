/**
 * Personalized export filenames — the files a host downloads carry THEIR
 * stream's title, not the app's brand: `<title-slug>-<surface>-<date>.png`
 * (e.g. `rust-from-scratch-cover-2026-07-10.png`). CJK titles keep their
 * characters (filesystems are fine with them); only path-hostile characters
 * are stripped. An empty/unusable title falls back to "vibe-live".
 */

const FALLBACK_SLUG = "vibe-live";
const MAX_SLUG_LENGTH = 60;

export function slugifyTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    // Path/shell-hostile and separator characters become hyphens.
    .replace(/[\s/\\:*?"'<>|#%&{}$!@+=`~^[\]();,.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-|-$/g, "");
  return slug || FALLBACK_SLUG;
}

function dateStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function exportFileName(
  title: string,
  surface: string,
  date: Date = new Date(),
): string {
  return `${slugifyTitle(title)}-${surface}-${dateStamp(date)}.png`;
}
