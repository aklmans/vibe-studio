/*
 * The provider boundary for config text.
 *
 * The AI agent edits stream *content* only; identity + brand — author, avatar,
 * socials, cover, and the studio theme/colors — are set once by the host (the
 * Brand layer, see studio-profile) and never by a model. So the config a
 * provider sees is projected down to the content keys: identity is structurally
 * absent, not merely redacted. On the way back, `mergeAgentContentIntoConfig`
 * folds the model's content onto the host's current full config, so
 * identity/brand always come from the host — a reply can never change them, and
 * the review diff shows only content.
 *
 * The two placeholder guards are used on the JSON-import apply path
 * (configToOverlayState): a pasted config that still carries a
 * `__PRIVATE_SOCIAL_VALUE_n__` / `__PRIVATE_IMAGE_*__` placeholder resolves back
 * to the host's real value instead of overwriting it with the placeholder.
 */

/** The per-stream content slice — the only keys the AI agent may see or edit. */
const AGENT_CONTENT_KEYS = [
  "version",
  "title",
  "subtitle",
  "badges",
  "stack",
  "sections",
] as const;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

// --- placeholder guards (restore-on-apply, see live-studio-config) -------------

/** Index encoded in a `__PRIVATE_SOCIAL_VALUE_n__` placeholder, or null. */
export function privateSocialValuePlaceholderIndex(value: string): number | null {
  const match = value.match(/^__PRIVATE_SOCIAL_VALUE_(\d+)__$/);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

/** True for a `__PRIVATE_IMAGE_*__` image placeholder. */
export function isPrivateImageValuePlaceholder(value: string): boolean {
  return /^__PRIVATE_IMAGE_[a-z]+__$/.test(value);
}

// --- content projection + merge ------------------------------------------------

function pickContent(config: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of AGENT_CONTENT_KEYS) {
    if (key in config) picked[key] = config[key];
  }
  return picked;
}

/**
 * The single choke point every provider-bound path (online call + copy handoff)
 * goes through: project the config to the content slice so identity + brand are
 * never sent. A parse failure yields a safe stub rather than leaking raw text.
 */
export function sanitizeConfigTextForProvider(configText: string): string {
  const config = parseConfig(configText);
  if (!config) return fallbackContentConfigText();
  return `${JSON.stringify(pickContent(config), null, 2)}\n`;
}

/**
 * Fold a model reply's content onto the host's current full config: content keys
 * come from the reply, everything else (identity + brand) stays exactly as the
 * host had it. This locks identity — a reply can never change avatar/socials/
 * theme/etc — and keeps the review diff to content only. An unparseable reply
 * keeps the original; a missing original falls back to the reply's content.
 */
export function mergeAgentContentIntoConfig(
  originalConfigText: string,
  replyConfigText: string,
): string {
  const reply = parseConfig(replyConfigText);
  if (!reply) return originalConfigText;
  const original = parseConfig(originalConfigText);
  if (!original) return `${JSON.stringify(pickContent(reply), null, 2)}\n`;
  const merged: Record<string, unknown> = { ...original };
  for (const key of AGENT_CONTENT_KEYS) {
    if (key in reply) merged[key] = reply[key];
  }
  return `${JSON.stringify(merged, null, 2)}\n`;
}

function parseConfig(configText: string): Record<string, unknown> | null {
  try {
    return record(JSON.parse(configText));
  } catch {
    return null;
  }
}

function fallbackContentConfigText(): string {
  return `${JSON.stringify(
    { version: 1, title: "Config unavailable", subtitle: "", badges: [], stack: [], sections: [] },
    null,
    2,
  )}\n`;
}
