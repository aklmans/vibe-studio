import type { ThemeMode } from "./theme";
import type { LiveStudioConfig } from "./live-studio-config";

/**
 * Config-system boundary — versions the three disjoint layers so a future change
 * can't quietly move a runtime or studio field into the per-session content core.
 *
 *  - LiveSessionConfigV1 — `live-session.config.json`: the per-session **content**
 *    portable core (what changes every stream). This *is* the existing
 *    `LiveStudioConfig` (the file name is legacy; the artifact is the session
 *    config). Unchanged + backward-compatible.
 *  - StudioConfigV1Draft — a **future** `studio.config.json`: studio-level
 *    appearance + defaults + OBS / persistence preferences. Type + parser DRAFT
 *    only this batch — not wired to any UI, not imported / exported by the app,
 *    not a watched / bound file.
 *  - Runtime state — `OverlayState` / `localStorage` only; never portable.
 *
 * Everything here is pure types + constants + classifiers (no I/O, no schema
 * change). The running v1 import / export is untouched.
 */

/** The `live-session.config.json` content core (v1). Alias of the existing type. */
export type LiveSessionConfigV1 = LiveStudioConfig;

/** Top-level keys allowed in `live-session.config.json` (v1). Content only. */
export const LIVE_SESSION_CONFIG_V1_KEYS = [
  "version",
  "title",
  "subtitle",
  "author",
  "profile",
  "cover",
  "badges",
  "stack",
  "socials",
  "sections",
] as const;
export type LiveSessionConfigV1Key = (typeof LIVE_SESSION_CONFIG_V1_KEYS)[number];

/** v1 content keys excluding the schema marker — used for cross-boundary checks. */
const SESSION_CONTENT_KEYS = LIVE_SESSION_CONFIG_V1_KEYS.filter(
  (key) => key !== "version",
);

/**
 * Runtime / display state. It lives in `OverlayState` / `localStorage` and must
 * never enter any portable config — not the session config, not studio config.
 */
export const RUNTIME_STATE_EXCLUSIONS = [
  "bottomBar",
  "liveSession.startedAt",
  "sidebar.activeSection",
  "sidebar.sectionsDone",
] as const;
export type RuntimeStateExclusion = (typeof RUNTIME_STATE_EXCLUSIONS)[number];

const RUNTIME_STATE_ROOT_KEYS = Array.from(
  new Set(RUNTIME_STATE_EXCLUSIONS.map((field) => field.split(".")[0])),
);

/**
 * Studio-level concerns reserved for a future `studio.config.json`. They are NOT
 * part of the per-session content core and must not appear in
 * `live-session.config.json`.
 */
export const STUDIO_CONFIG_FIELDS = [
  "theme",
  "colors",
  "defaults",
  "obs",
  "persistence",
] as const;
export type StudioConfigField = (typeof STUDIO_CONFIG_FIELDS)[number];

/**
 * Top-level keys of `config` that are NOT part of the v1 session content core —
 * i.e. runtime or studio fields that leaked in. Empty array means it is clean.
 */
export function sessionConfigForeignKeys(
  config: Record<string, unknown>,
): string[] {
  const allowed = new Set<string>(LIVE_SESSION_CONFIG_V1_KEYS);
  return Object.keys(config).filter((key) => !allowed.has(key));
}

// ─── Future studio.config.json — DRAFT type + parser (not wired this batch) ───

/** DRAFT shape for a future `studio.config.json`. Validated, never auto-loaded. */
export interface StudioConfigV1Draft {
  schemaVersion: 1;
  appearance?: {
    theme?: ThemeMode;
    /** Palette overrides, keyed by color-token name → CSS color string. */
    colors?: Record<string, string>;
  };
  /** Default behaviors (open-ended draft). */
  defaults?: Record<string, unknown>;
  /** OBS preferences (open-ended draft). */
  obs?: Record<string, unknown>;
  /** Persistence preferences (open-ended draft). */
  persistence?: Record<string, unknown>;
}

export interface StudioConfigValidation {
  valid: boolean;
  issues: string[];
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Validate a studio-config draft. Enforces the boundary both ways: the studio
 * config must declare `schemaVersion: 1`, keep appearance well-typed, and must
 * NOT carry per-session content (title / sections / badges / …) — those belong
 * to `live-session.config.json`.
 */
export function validateStudioConfigDraft(input: unknown): StudioConfigValidation {
  const source = record(input);
  const issues: string[] = [];
  if (!source) return { valid: false, issues: ["studio.config must be a JSON object."] };

  if (source.schemaVersion !== 1) issues.push("schemaVersion must be 1.");

  for (const key of SESSION_CONTENT_KEYS) {
    if (key in source) {
      issues.push(`studio.config must not contain the session content key "${key}".`);
    }
  }

  for (const key of RUNTIME_STATE_ROOT_KEYS) {
    if (key in source) {
      issues.push(`studio.config must not contain the runtime state key "${key}".`);
    }
  }

  if ("appearance" in source) {
    const appearance = record(source.appearance);
    if (!appearance) {
      issues.push("appearance must be an object.");
    } else {
      if ("theme" in appearance && appearance.theme !== "light" && appearance.theme !== "dark") {
        issues.push('appearance.theme must be "light" or "dark".');
      }
      if ("colors" in appearance) {
        const colors = record(appearance.colors);
        if (!colors) {
          issues.push("appearance.colors must be an object.");
        } else {
          for (const [name, value] of Object.entries(colors)) {
            if (typeof value !== "string") {
              issues.push(`appearance.colors.${name} must be a string.`);
            }
          }
        }
      }
    }
  }

  for (const key of ["defaults", "obs", "persistence"]) {
    if (key in source && !record(source[key])) {
      issues.push(`${key} must be an object.`);
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Parse + validate a studio-config draft JSON string; null when invalid. */
export function parseStudioConfigDraft(input: string): StudioConfigV1Draft | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!validateStudioConfigDraft(parsed).valid) return null;
    const source = parsed as Record<string, unknown>;
    const appearance = record(source.appearance);
    const defaults = record(source.defaults);
    const obs = record(source.obs);
    const persistence = record(source.persistence);
    return {
      schemaVersion: 1,
      ...(appearance
        ? {
            appearance: {
              ...(appearance.theme === "light" || appearance.theme === "dark"
                ? { theme: appearance.theme }
                : {}),
              ...(record(appearance.colors)
                ? { colors: record(appearance.colors) as Record<string, string> }
                : {}),
            },
          }
        : {}),
      ...(defaults ? { defaults } : {}),
      ...(obs ? { obs } : {}),
      ...(persistence ? { persistence } : {}),
    };
  } catch {
    return null;
  }
}
