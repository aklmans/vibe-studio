# `studio.config.json` — future studio-level config (DRAFT)

> **Status: draft, not a running feature.** This batch only fixes the boundary —
> a type + parser (`src/lib/session-config-boundary.ts`) and this spec. The app
> does **not** read, write, watch, import, or export `studio.config.json` yet,
> and there is no file binding.

`studio.config.json` is reserved for **studio-level** settings — the things that
belong to the workstation / brand, not to one stream. It is deliberately kept
**separate** from [`live-session.config.json`](./live-session.config.md), which
stays the per-session *content* portable core.

## What it is for

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | `1` | Required. |
| `appearance.theme` | `"light" \| "dark"?` | App appearance. |
| `appearance.colors` | `{ [token]: string }?` | Palette overrides. |
| `defaults` | `object?` | Default behaviors (open-ended draft). |
| `obs` | `object?` | OBS preferences (open-ended draft). |
| `persistence` | `object?` | Database / local-draft preferences (open-ended draft). |

See [`studio.config.example.json`](./studio.config.example.json).

## Boundary (enforced by code + tests)

- **No session content.** `studio.config.json` must not contain
  `title` / `subtitle` / `author` / `profile` / `cover` / `badges` / `stack` /
  `socials` / `sections` — those live in `live-session.config.json`.
  `validateStudioConfigDraft()` rejects a draft that carries any of them.
- **No runtime state.** `bottomBar`, `liveSession.startedAt`,
  `sidebar.activeSection`, `sidebar.sectionsDone` stay in `OverlayState` /
  `localStorage` and never enter any portable config.
- **Session config stays content-only.** `theme` / `colors` and other
  studio-level fields must not appear in `live-session.config.json`.

## When it lands

If/when this becomes real, it follows the same rules as the session config:

- Additive, backward-compatible schema versions only.
- Manual import / export (or an *optional* File System Access binding with a
  fallback) — **not** an auto-read / watched file. See the file-handling note in
  [`live-session.config.md`](./live-session.config.md).
