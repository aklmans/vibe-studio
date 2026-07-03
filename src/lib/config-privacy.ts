export const PRIVATE_SOCIAL_VALUE_PREFIX = "__PRIVATE_SOCIAL_VALUE_";
export const PRIVATE_IMAGE_VALUE_PREFIX = "__PRIVATE_IMAGE_";

/*
 * Privacy boundary for any config text that may cross to an AI provider (the
 * online agent call and the copy-paste handoff prompt).
 *
 * Two independent concerns, both enforced here rather than trusted from the
 * client:
 *   1. Redaction — social values and *uploaded* images (data: URIs) are replaced
 *      with stable placeholders so a personal handle or photo never leaves the
 *      machine. Restore swaps them back (against the original text server-side,
 *      or against current state on apply — see live-studio-config).
 *   2. Projection — only the portable v1 top-level keys survive; runtime/studio
 *      fields (bottomBar, obs, persistence, theme, …) are dropped even if a
 *      caller sends them. Secrets never live in client state, so this is
 *      defense-in-depth, not the last line — but it keeps the provider payload
 *      to exactly the portable core.
 *
 * `sanitizeConfigTextForProvider` composes both and is the single choke point
 * every provider-bound path goes through.
 */

/** Top-level keys of the portable v1 config. Anything else is dropped. */
const PORTABLE_V1_KEYS = [
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

/** v1 image fields whose values may be uploaded personal photos (data: URIs). */
const IMAGE_FIELDS: { container: "profile" | "cover"; leaf: string; key: string }[] = [
  { container: "profile", leaf: "avatarUrl", key: "avatar" },
  { container: "cover", leaf: "portraitUrl", key: "portrait" },
  { container: "cover", leaf: "sceneUrl", key: "scene" },
];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

// --- social value placeholders -------------------------------------------------

export function privateSocialValuePlaceholder(index: number): string {
  return `${PRIVATE_SOCIAL_VALUE_PREFIX}${index}__`;
}

export function privateSocialValuePlaceholderIndex(value: string): number | null {
  const match = value.match(/^__PRIVATE_SOCIAL_VALUE_(\d+)__$/);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

export function isPrivateSocialValuePlaceholder(value: string): boolean {
  return privateSocialValuePlaceholderIndex(value) !== null;
}

// --- image value placeholders --------------------------------------------------

export function privateImageValuePlaceholder(key: string): string {
  return `${PRIVATE_IMAGE_VALUE_PREFIX}${key}__`;
}

export function isPrivateImageValuePlaceholder(value: string): boolean {
  return /^__PRIVATE_IMAGE_[a-z]+__$/.test(value);
}

/** True for an embedded (uploaded) image — the bytes we must not send out. An
 *  external URL like "/avatar.png" or "https://…" is a cheap pointer, kept. */
function isDataUri(value: unknown): value is string {
  return typeof value === "string" && value.trimStart().toLowerCase().startsWith("data:");
}

// --- redaction (mutates the parsed config in place) ----------------------------

function redactSocials(config: Record<string, unknown>): void {
  if (!Array.isArray(config.socials)) return;
  config.socials = config.socials.map((item, index) => {
    const social = record(item);
    if (!social || typeof social.value !== "string" || !social.value.trim()) {
      return item;
    }
    return { ...social, value: privateSocialValuePlaceholder(index) };
  });
}

function redactImages(config: Record<string, unknown>): void {
  for (const { container, leaf, key } of IMAGE_FIELDS) {
    const holder = record(config[container]);
    if (holder && isDataUri(holder[leaf])) {
      holder[leaf] = privateImageValuePlaceholder(key);
    }
  }
}

// --- restoration (mutates the parsed config in place) --------------------------

function restoreSocials(config: Record<string, unknown>, original: Record<string, unknown>): void {
  if (!Array.isArray(config.socials) || !Array.isArray(original.socials)) return;
  const originalSocials = original.socials;
  config.socials = config.socials.map((item) => {
    const social = record(item);
    if (!social || typeof social.value !== "string") return item;
    const originalIndex = privateSocialValuePlaceholderIndex(social.value);
    if (originalIndex === null) return item;
    const originalSocial = record(originalSocials[originalIndex]);
    const originalValue = typeof originalSocial?.value === "string" ? originalSocial.value : "";
    return originalValue ? { ...social, value: originalValue } : item;
  });
}

function restoreImages(config: Record<string, unknown>, original: Record<string, unknown>): void {
  for (const { container, leaf } of IMAGE_FIELDS) {
    const holder = record(config[container]);
    if (!holder || typeof holder[leaf] !== "string") continue;
    if (!isPrivateImageValuePlaceholder(holder[leaf] as string)) continue;
    const originalHolder = record(original[container]);
    const originalValue = typeof originalHolder?.[leaf] === "string" ? (originalHolder[leaf] as string) : "";
    if (originalValue) holder[leaf] = originalValue;
  }
}

// --- public API ----------------------------------------------------------------

/** Redact social values + uploaded images to placeholders. */
export function redactPrivateValuesInConfigText(configText: string): string {
  const config = parseConfig(configText);
  if (!config) return fallbackPrivateConfigText();
  redactSocials(config);
  redactImages(config);
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** Swap redaction placeholders back to the original values (social + image). */
export function restorePrivateValuesInConfigText(
  configText: string,
  originalConfigText: string,
): string {
  const config = parseConfig(configText);
  const original = parseConfig(originalConfigText);
  if (!config || !original) return configText;
  restoreSocials(config, original);
  restoreImages(config, original);
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** Keep only the portable v1 top-level keys — drop anything else a caller sent. */
export function pickPortableV1FieldsInConfigText(configText: string): string {
  const config = parseConfig(configText);
  if (!config) return fallbackPrivateConfigText();
  const picked: Record<string, unknown> = {};
  for (const key of PORTABLE_V1_KEYS) {
    if (key in config) picked[key] = config[key];
  }
  return `${JSON.stringify(picked, null, 2)}\n`;
}

/**
 * The one function every provider-bound path uses: project to the portable v1
 * core, then redact private values. Single parse/serialize. A parse failure
 * yields a safe stub rather than leaking the raw text.
 */
export function sanitizeConfigTextForProvider(configText: string): string {
  const config = parseConfig(configText);
  if (!config) return fallbackPrivateConfigText();
  const picked: Record<string, unknown> = {};
  for (const key of PORTABLE_V1_KEYS) {
    if (key in config) picked[key] = config[key];
  }
  redactSocials(picked);
  redactImages(picked);
  return `${JSON.stringify(picked, null, 2)}\n`;
}

function parseConfig(configText: string): Record<string, unknown> | null {
  try {
    return record(JSON.parse(configText));
  } catch {
    return null;
  }
}

function fallbackPrivateConfigText(): string {
  return `${JSON.stringify(
    {
      version: 1,
      title: "Privacy-safe config unavailable",
      subtitle: "",
      badges: [],
      stack: [],
      socials: [],
      sections: [],
    },
    null,
    2,
  )}\n`;
}
