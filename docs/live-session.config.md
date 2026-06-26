# `live-session.config.json` — AI Agent contract (v1)

`live-session.config.json` is the **portable core** of the current live session —
the one artifact an AI Agent (or a human) prepares or edits. It is a `version: 1`
projection of the runtime state, validated before it can be applied.

Generate / edit this JSON, then in the app: **Session Config → Import file →
review → Apply**. Import never auto-applies; a human reviews and presses Apply.

See [`live-session.config.example.json`](./live-session.config.example.json) for a
complete, valid example.

## What v1 includes

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `1` | Required. Schema version. |
| `title` | string | Cover title. |
| `subtitle` | string | Cover subtitle / topic. |
| `author` | string? | Shown as the cover "with …" line. |
| `profile.avatarUrl` | string? | Shared brand avatar (Poster / Wallpaper / Overlay). |
| `profile.avatarVisible` | boolean? | |
| `cover.visual` | `"avatar" \| "scene" \| "title"` | Cover visual type. |
| `cover.portraitUrl` | string? | Avatar-type image. |
| `cover.sceneUrl` | string? | Scene-type image. |
| `badges` | string[] | Agent badge icon keys, e.g. `["claude","codex"]`. |
| `stack` | string[] | Tool-stack labels. |
| `socials` | `{ icon?, label, value, color? }[]` | Social links. |
| `sections` | `{ title, bullets: string[] }[]` | Sidebar progress sections. |

## What v1 does NOT include

**Runtime / display state** (edited in the form, never in this file):

- `bottomBar` segments
- `liveSession.startedAt` (On-Air start time)
- `sidebar.activeSection`
- `sidebar.sectionsDone` (done states)

**Studio-level preferences** (deliberately out of the per-session content core):

- studio appearance — `theme` (light/dark) and the `colors` palette

These are edited via the Session Config **form** / Studio Appearance, not this
file. **Apply** also rebuilds active section, done states, and bottom-bar
segments to v1 defaults — so the form and the JSON are two views of the *same
config*, not of the whole page.

## Future boundary — `studio.config.json` and `schemaVersion`

`live-session.config.json` is intentionally the **per-session content portable
core** (what changes every stream). If the project later needs to carry
studio-level settings, the planned split is:

- `live-session.config.json` (v1, this file) — title / subtitle / author /
  profile / cover / badges / stack / socials / sections. Stays content-only.
- A separate **`studio.config.json`** — studio appearance (theme + colors),
  default behaviors, and OBS / persistence preferences. Not mixed into the
  session content core.
- **Runtime** state (`bottomBar`, on-air time, active section, done states)
  stays in `OverlayState` / `localStorage` and never enters a portable config.

If a `schemaVersion: 2` is ever introduced, it must be **additive and
back-compatible**: existing v1 files keep importing, and Export keeps emitting a
valid projection. This batch does **not** change the schema — it only records
the boundary so the split can happen safely later.

## File handling — manual import / export (not a watched file)

This config is moved by **explicit import / export inside Session Config → the
JSON drawer**, not by reading a file off disk. The app does **not** auto-read,
auto-write, or watch any `live-session.config.json` on your filesystem. "Export"
downloads the current projection; "Import" reads a file you pick and then waits
for a human **Apply**.

This is a deliberate, minimal choice for a browser-first app:

- A Next.js API that writes a fixed file would target the **server** filesystem
  (not your local file) and break on read-only / ephemeral serverless deploys.
- The File System Access API could bind a local file, but needs handle
  persistence + re-permission, has no real change-watch, and is unsupported in
  some browsers — so it would still need this manual path as a fallback and
  risks implying a "live file" that does not exist.

If a true bound-file / `settings.json`-style experience is wanted later, add it
as an **optional** File System Access binding with this manual import / export
kept as the fallback — and only then describe the app as reading a file.

## Boundaries (do not change)

- `OverlayState` is the runtime source of truth; this file is a projection +
  an explicit Apply transaction.
- Export always emits the current **state** projection, never the unsaved draft.
- Unrelated to OBS routes, export sizes, the DB / `live-state` sync, and
  localStorage — applying a config only updates the fields listed above.
