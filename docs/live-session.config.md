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
| `badges` | string[] | Agent badge icon keys, e.g. `["claude","codex"]`. See badge rules below. |
| `stack` | string[] | Tool-stack labels. |
| `socials` | `{ icon?, label, value, color? }[]` | Social links. |
| `sections` | `{ title, minutes?, speaker?, bullets?: string[] }[]` | Run-of-show sections. `minutes` = planned duration; `speaker` = optional per-section presenter/guest (the lecture card introduces the active section's speaker, falling back to the host). |

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

The boundary is also pinned in code: `src/lib/session-config-boundary.ts`
defines `LIVE_SESSION_CONFIG_V1_KEYS`, `RUNTIME_STATE_EXCLUSIONS`,
`STUDIO_CONFIG_FIELDS`, and a `StudioConfigV1Draft` type + parser. The future
studio config is specified (as a draft) in [`studio.config.md`](./internal/studio.config.md).

## Badge icon rules

`badges` are not free-form labels. They are the curated AI / LLM model,
provider, and coding-agent icons rendered from `@lobehub/icons` through the
project registry in `src/lib/badges.ts` and `src/lib/badge-icons.tsx`.

Badges are optional. Add them only when a supported AI / LLM model, provider,
or coding-agent icon clearly matches the session topic or featured tool. If
there is no clear match, use `badges: []`; the app will not invent badges from
`stack`.

Use exact registry keys such as `claude`, `claude-code`, `codex`, `chatgpt`,
`kimi`, `deepseek`, `qwen`, `z-ai`, `cursor`, or `opencode`. Generic labels such
as `AI`, `LLM`, or `AI/LLM` are placeholders and are ignored; framework /
tool-stack labels such as `React`, `Next.js`, `OBS`, or `Vite` belong in
`stack`, not in `badges`.

## File handling — manual import / export + optional bound file (never watched)

The config moves through the **JSON drawer**, and nothing is ever read off disk
automatically. There are two ways to move it, both explicit:

**Manual import / export (always available).** "Export" downloads the current
state projection; "Import" reads a file you pick into the editing buffer and
waits for a human **Apply**.

**Optional bound file (File System Access API, supported browsers only).** You
may **explicitly pick** a `live-session.config.json` to bind. Then:

- **Read file** loads the bound file's contents into the editing buffer — it
  still goes through review + **Apply**, and never auto-overwrites state.
- **Save to file** writes the current **state projection** (the v1 portable
  core), exactly like Export — never the unsaved editing draft.

The bound file is **not watched** and **not auto-read**: reading and saving are
manual user actions. The file is chosen by the user (no disk scanning, no
default project file). The handle is **not persisted** — after a page refresh
the workflow returns to manual import / export until you bind again. Browsers
without the File System Access API never see the bind actions and keep manual
import / export.

Why not a server-written file or a watched file: a Next.js API writing a fixed
file targets the **server** filesystem (not your local file) and breaks on
read-only / ephemeral serverless deploys; a real change-watch would imply a
"live file" that does not exist. So binding stays an opt-in convenience over the
manual path, never a requirement. (Code: `src/lib/config-file-access.ts`.)

## Boundaries (do not change)

- `OverlayState` is the runtime source of truth; this file is a projection +
  an explicit Apply transaction.
- Export always emits the current **state** projection, never the unsaved draft.
- Unrelated to OBS routes, export sizes, the DB / `live-state` sync, and
  localStorage — applying a config only updates the fields listed above.
