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

## What v1 does NOT include (runtime / display, not in the config)

- `bottomBar` segments
- `liveSession.startedAt` (On-Air start time)
- `sidebar.activeSection`
- `sidebar.sectionsDone` (done states)

These are edited via the Session Config **form**, not this file. **Apply** also
rebuilds active section, done states, and bottom-bar segments to v1 defaults — so
the form and the JSON are two views of the *same config*, not of the whole page.

## Boundaries (do not change)

- `OverlayState` is the runtime source of truth; this file is a projection +
  an explicit Apply transaction.
- Export always emits the current **state** projection, never the unsaved draft.
- Unrelated to OBS routes, export sizes, the DB / `live-state` sync, and
  localStorage — applying a config only updates the fields listed above.
