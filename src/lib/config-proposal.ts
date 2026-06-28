/**
 * A pure, dependency-free diff between the current v1 config projection and a
 * proposed config returned by the Agent. It only reports which top-level v1
 * fields would change — enough for the Agent's proposal review rail to tell the
 * user "what this would change" before they open the drift-safe JSON drawer.
 * It never applies anything and never touches OverlayState.
 */

/** A single top-level v1 field that differs between current and proposed. */
export interface ConfigChange {
  field: "title" | "subtitle" | "author" | "profile" | "cover" | "badges" | "stack" | "socials" | "sections";
  /** Item count for array fields (badges / stack / socials / sections). */
  count?: number;
}

export type ProposalSummary = { ok: true; changes: ConfigChange[] } | { ok: false };

const FIELDS: ConfigChange["field"][] = [
  "title",
  "subtitle",
  "author",
  "profile",
  "cover",
  "badges",
  "stack",
  "socials",
  "sections",
];

const ARRAY_FIELDS = new Set<ConfigChange["field"]>(["badges", "stack", "socials", "sections"]);

function parseConfigObject(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function normalizeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForCompare);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, normalizeForCompare(record[key])]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeForCompare(value));
}

/**
 * List the top-level v1 fields that the proposed config would change relative to
 * the current projection. Returns `{ ok: false }` when the proposed text is not
 * a parseable v1 config object — the caller still allows Review in JSON, just
 * without a summary. An unparseable *current* projection is treated as empty
 * (so every present field reads as changed).
 */
export function summarizeConfigProposal(
  currentConfigText: string,
  proposedConfigText: string,
): ProposalSummary {
  const proposed = parseConfigObject(proposedConfigText);
  if (!proposed || proposed.version !== 1) return { ok: false };
  const current = parseConfigObject(currentConfigText) ?? {};

  const changes: ConfigChange[] = [];
  for (const field of FIELDS) {
    const before = stableStringify(current[field] ?? null);
    const after = stableStringify(proposed[field] ?? null);
    if (before === after) continue;
    const value = proposed[field];
    const count = ARRAY_FIELDS.has(field) && Array.isArray(value) ? value.length : undefined;
    changes.push(count === undefined ? { field } : { field, count });
  }
  return { ok: true, changes };
}

/* ── Field-level diff (the proposal review rail) ──────────────────────────── */

export type FieldDiffStatus = "added" | "removed" | "changed";
export type DiffGroup = "identity" | "media" | "assets" | "sections";

/** A per-field before / after diff for the proposal review rail. */
export interface FieldDiff {
  field: ConfigChange["field"];
  group: DiffGroup;
  status: FieldDiffStatus;
  /** Scalar fields: compact old / new value ("" when absent). */
  oldValue?: string;
  newValue?: string;
  /** Array fields: counts + readable item-level notes. */
  oldCount?: number;
  newCount?: number;
  added?: string[];
  removed?: string[];
  changed?: string[];
  /** Badges are optional; empty badges means "no matched badge", not a destructive removal. */
  optionalEmpty?: boolean;
}

export type ProposalDiff = { ok: true; fields: FieldDiff[] } | { ok: false };

const FIELD_GROUP: Record<ConfigChange["field"], DiffGroup> = {
  title: "identity",
  subtitle: "identity",
  author: "identity",
  profile: "media",
  cover: "media",
  badges: "assets",
  stack: "assets",
  socials: "assets",
  sections: "sections",
};

const NULL = JSON.stringify(null);

function scalarString(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function objectSummary(field: "profile" | "cover", value: unknown): string {
  if (!value || typeof value !== "object") return "—";
  const v = value as Record<string, unknown>;
  if (field === "profile") return `avatar ${v.avatarVisible === false ? "hidden" : "shown"}`;
  return `visual ${typeof v.visual === "string" ? v.visual : "—"}`;
}

function objectValueLabel(key: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "∅";
  if (key === "avatarVisible") return value === false ? "hidden" : "shown";
  return String(value);
}

function objectDiffSummary(field: "profile" | "cover", before: unknown, after: unknown): { oldValue: string; newValue: string } {
  const oldRecord = before && typeof before === "object" ? (before as Record<string, unknown>) : {};
  const newRecord = after && typeof after === "object" ? (after as Record<string, unknown>) : {};
  const entries =
    field === "profile"
      ? [
          ["avatarUrl", "avatar"],
          ["avatarVisible", "visible"],
        ]
      : [
          ["visual", "visual"],
          ["portraitUrl", "portrait"],
          ["sceneUrl", "scene"],
        ];
  const oldParts: string[] = [];
  const newParts: string[] = [];
  for (const [key, label] of entries) {
    const oldValue = oldRecord[key];
    const newValue = newRecord[key];
    if (stableStringify(oldValue ?? null) === stableStringify(newValue ?? null)) continue;
    oldParts.push(`${label} ${objectValueLabel(key, oldValue)}`);
    newParts.push(`${label} ${objectValueLabel(key, newValue)}`);
  }
  return {
    oldValue: oldParts.join(" · ") || objectSummary(field, before),
    newValue: newParts.join(" · ") || objectSummary(field, after),
  };
}

function itemLabel(item: unknown, index: number): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const v = item as Record<string, unknown>;
    if (typeof v.title === "string" && v.title) return v.title;
    if (typeof v.label === "string" && v.label) return v.label;
    if (typeof v.value === "string" && v.value) return v.value;
  }
  return `#${index + 1}`;
}

function arrayStatus(oldCount: number, newCount: number): FieldDiffStatus {
  if (oldCount === 0 && newCount > 0) return "added";
  if (newCount === 0 && oldCount > 0) return "removed";
  return "changed";
}

function arrayDiff(before: unknown, after: unknown): Pick<FieldDiff, "oldCount" | "newCount" | "added" | "removed" | "changed"> {
  const a = Array.isArray(before) ? before : [];
  const b = Array.isArray(after) ? after : [];
  // Primitive arrays (badges / stack) → set diff; object arrays (socials /
  // sections) → index diff, where same index + different content reads as changed.
  const primitive = a.every((x) => typeof x !== "object") && b.every((x) => typeof x !== "object");
  if (primitive) {
    const aKeys = a.map((x) => String(x));
    const bKeys = b.map((x) => String(x));
    const aSet = new Set(aKeys);
    const bSet = new Set(bKeys);
    return {
      oldCount: a.length,
      newCount: b.length,
      added: bKeys.filter((x) => !aSet.has(x)),
      removed: aKeys.filter((x) => !bSet.has(x)),
      changed: [],
    };
  }
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i >= a.length) added.push(itemLabel(b[i], i));
    else if (i >= b.length) removed.push(itemLabel(a[i], i));
    else if (stableStringify(a[i]) !== stableStringify(b[i])) changed.push(itemLabel(b[i], i));
  }
  return { oldCount: a.length, newCount: b.length, added, removed, changed };
}

/**
 * Field-level diff between the current v1 projection and a proposed config —
 * scalars (old → new), objects (a short summary), and arrays (counts + readable
 * added / removed / changed item labels). Order-independent on object keys
 * (sorted-key compare) so reordered keys never read as a change. `{ ok: false }`
 * when the proposed text is not a parseable v1 config (the caller still allows
 * Review in JSON, just without a diff).
 */
export function diffConfigProposal(currentConfigText: string, proposedConfigText: string): ProposalDiff {
  const proposed = parseConfigObject(proposedConfigText);
  if (!proposed || proposed.version !== 1) return { ok: false };
  const current = parseConfigObject(currentConfigText) ?? {};
  const fields: FieldDiff[] = [];

  for (const field of ["title", "subtitle", "author"] as const) {
    const oldValue = scalarString(current[field]);
    const newValue = scalarString(proposed[field]);
    if (oldValue === newValue) continue;
    const status: FieldDiffStatus = !oldValue ? "added" : !newValue ? "removed" : "changed";
    fields.push({ field, group: FIELD_GROUP[field], status, oldValue, newValue });
  }

  for (const field of ["profile", "cover"] as const) {
    const before = stableStringify(current[field] ?? null);
    const after = stableStringify(proposed[field] ?? null);
    if (before === after) continue;
    const status: FieldDiffStatus = before === NULL ? "added" : after === NULL ? "removed" : "changed";
    const summary = objectDiffSummary(field, current[field], proposed[field]);
    fields.push({
      field,
      group: FIELD_GROUP[field],
      status,
      oldValue: summary.oldValue,
      newValue: summary.newValue,
    });
  }

  for (const field of ["badges", "stack", "socials", "sections"] as const) {
    const d = arrayDiff(current[field], proposed[field]);
    const noChange =
      d.oldCount === d.newCount &&
      (d.added?.length ?? 0) === 0 &&
      (d.removed?.length ?? 0) === 0 &&
      (d.changed?.length ?? 0) === 0;
    if (noChange) continue;
    const optionalEmpty = field === "badges" && (d.oldCount ?? 0) > 0 && (d.newCount ?? 0) === 0;
    fields.push({
      field,
      group: FIELD_GROUP[field],
      status: optionalEmpty ? "changed" : arrayStatus(d.oldCount ?? 0, d.newCount ?? 0),
      ...d,
      ...(optionalEmpty ? { optionalEmpty: true, removed: [] } : {}),
    });
  }

  return { ok: true, fields };
}
