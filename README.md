# Vibe Studio

**English** · [简体中文](README.zh-CN.md)

A Next.js app for designing livestream graphics for Study With Me, Coding With Me, Build in Public, Vibe Coding, gaming, chat, co-working, and other "with me" stream formats. It gives creators a designed visual frame without hand-building every scene in OBS or Livehime, uses an optional Agent to draft session content, and exports broadcast-ready overlay, cover, poster, and wallpaper assets.

Repository: https://github.com/aklmans/vibe-studio

## Design

Vibe Studio uses a warm, editorial live-studio design language: warm surfaces, premium typography, mono metadata, thin hairlines, and restrained accent marks — calm enough for long live sessions and readable on video. The full direction is documented in [`DESIGN_LANGUAGE.md`](DESIGN_LANGUAGE.md).

Contracts that visuals must not break: export dimensions and filenames, OBS routes, the off-screen export architecture, state persistence, live-data APIs, and keyboard/export workflows.

## Preview

The preview images below are checked-in example exports from the overlay builder, stored in `docs/assets/`.

### Cover screen

<p align="center">
  <img src="docs/assets/vibe-coding-cover.png" alt="Vibe Studio cover screen" width="820">
</p>

### Poster

<p align="center">
  <img src="docs/assets/vibe-coding-poster.png" alt="Vibe Studio poster" width="820">
</p>

### Full live overlay

<p align="center">
  <img src="docs/assets/vibe-coding-overlay.png" alt="Vibe Studio full live overlay" width="820">
</p>

### Export slices

<table>
  <tr>
    <th>Sidebar</th>
    <th>Bottom bar</th>
  </tr>
  <tr>
    <td width="34%">
      <img src="docs/assets/vibe-coding-sidebar.png" alt="Vibe Studio sidebar export">
    </td>
    <td width="66%">
      <img src="docs/assets/vibe-coding-bottom-bar.png" alt="Vibe Studio bottom bar export">
    </td>
  </tr>
</table>

### Wallpapers

A single wallpaper export action emits three sizes that share the Cover/Poster brand language but drop livestream-specific elements, so they read as quiet brand wallpapers when shown on a screen-share.

<p align="center">
  <img src="docs/assets/vibe-coding-wallpaper-desktop-4k.png" alt="Vibe Studio wallpaper - Desktop 4K" width="820">
</p>

<table>
  <tr>
    <th>Desktop QHD · 2560×1440</th>
    <th>Mobile · 1290×2796</th>
  </tr>
  <tr>
    <td width="70%">
      <img src="docs/assets/vibe-coding-wallpaper-desktop-qhd.png" alt="Vibe Studio wallpaper - Desktop QHD">
    </td>
    <td width="30%">
      <img src="docs/assets/vibe-coding-wallpaper-mobile.png" alt="Vibe Studio wallpaper - Mobile">
    </td>
  </tr>
</table>

## Quick Start

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`. If that port is occupied, Next.js will choose the next available port and print it in the terminal.

By default (self-hosted / local), `/` redirects to `/studio` — the marketing landing is not the entry. The bilingual landing page is served at `/` only on the public showcase deploy, which sets `VIBE_SHOWCASE=1` (see `.env.example`). Either way, the app lives at `/studio` (full workspace) and `/demo` (browser-local), with OBS sources under `/obs/*`.

To preview the marketing landing locally, run `pnpm dev:showcase` (it sets `VIBE_SHOWCASE=1`) and open `/`.

### AI Agent setup guide

The public site serves a compact AI-Agent handoff at `/skill.md`. After deployment,
an agent can start from:

```text
Read https://<deployment-domain>/skill.md first, then follow it to run and configure Vibe Studio.
```

Locally, the same guide is checked in at [`public/skill.md`](public/skill.md).

## Deploy

You do not need a terminal-based install to try Vibe Studio — deploy it once and share the URL. Full step-by-step notes (including the public-showcase checklist) live in [`docs/deploy.md`](docs/deploy.md).

**Vercel** (one click, no database required):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faklmans%2Fvibe-studio)

**Docker** (self-host):

```bash
docker compose up --build              # app only (localStorage draft mode)
docker compose --profile db up --build # app + PostgreSQL persistence
```

All environment variables are optional; the app runs with none of them set:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL persistence (run `pnpm db:push` once). Unset = localStorage draft mode. |
| `SESSION_AGENT_PROVIDER` / `SESSION_AGENT_BASE_URL` / `SESSION_AGENT_API_KEY` / `SESSION_AGENT_MODEL` | Server-side AI agent. Unset = local copy-handoff fallback. |
| `VIBE_SHOWCASE` | `1` serves the marketing landing at `/` and applies demo guardrails. Unset = `/` redirects to `/studio`. |
| `SESSION_AGENT_RATE_LIMIT` / `SESSION_AGENT_MAX_TOKENS` | Showcase-only agent abuse guardrails. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used in page metadata. |

## Common Commands

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm db:push
pnpm live:prepare
pnpm live:status
pnpm live:stop
pnpm live:restart
```

Tests use Node.js built-in test runner with `tsx`. Test files are colocated with source as `*.test.ts`.

## Put It On Stream (OBS) — 5 Minutes, Any OS

The overlay is a transparent web page; OBS (or any tool with a browser source) renders it above your real captures. Nothing here is macOS- or Bilibili-specific.

1. Run the app (`pnpm dev`) or use your deployed URL.
2. In OBS, set the canvas to 1920×1080 (`Settings → Video`) — or 1080×1920 for the Mobile · vertical layout.
3. Add a **Browser source**:
   - URL: `http://localhost:3000/obs/overlay?camera=empty` (`?camera=avatar` draws the avatar theme in the camera slot)
   - Width 1920 × Height 1080 (portrait: 1080 × 1920)
4. Place your real sources (screen capture, camera, game) **below** the overlay — the layout's main/camera regions are transparent cutouts.
5. Optional slices if you'd rather compose the frame yourself: `/obs/sidebar` (470×760) and `/obs/bottom-bar` (1856×180).
6. Edits in the Studio push to the browser sources live (SSE) — no refresh needed.

While live, the **Composition · OBS** controls (local/private Studio only — in the Overlay inspector and mirrored in **Session Config → Broadcast**) can drive your local OBS over obs-websocket: pick a source for the main screen and the camera slot, swap display regions, and recall saved compositions. This is optional — the group stays a quiet "Connect OBS" row until OBS is reachable.

**macOS + Bilibili Livehime automation** (the author's setup: `pnpm live:prepare` and friends — profile/scene derivation, OBS Virtual Camera, Livehime hand-off, second-screen wiring) lives in [`docs/author-setup.md`](docs/author-setup.md).

## Scene Layouts

The overlay is layout-driven: a **scene layout** decides which regions (transparent, OBS-backed cutouts) and panels (chrome the overlay draws) exist and where. Pick one in the Overlay inspector or **Session Config → Broadcast**, then fill each region with a source. Geometry has a single source of truth in `src/lib/overlay-layout.ts`.

- **Workbench** (1920×1080) — the classic coding-stream frame: main capture left, sidebar top right, camera (or the current-focus card) bottom right, bottom bar beneath.
- **Lecture · left / right** (1920×1080) — a lecture frame: a header band (brand logo + series name, plus today's topic and a date + LIVE badge once the session starts), a presenter column (camera above an intro card with the stream title, presenter name and affiliation lines), and an exact-16:9 slides region.
- **Mobile · vertical** (1080×1920) — a portrait frame stacked top to bottom: header, the screen share (main region), the camera below it, a slim bottom bar, and the presenter card. Both regions are OBS-backed cutouts, so the composition controls work. On macOS, `pnpm live:prepare:mobile` can derive the portrait OBS profile/collection automatically (see [`docs/author-setup.md`](docs/author-setup.md)); on any OS, a 1080×1920 OBS canvas + the browser source above is all it takes. It also exports as a frame for phone-app streaming.

Every layout family owns its **own bottom bar**: the workbench bar (on-air / progress / stack), the lecture bar (on-air / **agenda** / **follow** — the two lecture mirrors share one), and the mobile bar are independent data sets, so customizing one never touches the others; switching layouts just switches which set renders and edits. The agenda segment renders "current section n/N + time in section / planned + up next" straight from your sections — each section can carry an optional planned duration in minutes (part of the v1 content, so the Agent can draft the timing too), and every section switch restarts the on-air timer. The follow segment features a specific social handle of your choice (falling back to the first visible one). All segment kinds are available in every layout's bottom-bar editor.

**Agendas are bound to the scene layout**: each profile (workbench / lecture / mobile) owns a fully independent agenda — its own sections, done flags, active index and section timer, keyed the same way as the bottom bars. Switching layouts switches which agenda renders and edits; a lecture's run of show never leaks into the workbench sidebar and vice versa, and each scene's section timer keeps running across switches. The v1 config's `sections` are the ACTIVE scene's run of show — importing, exporting and AI edits all target the current scene and leave the other agendas untouched. Legacy states migrate their existing agenda to the workbench profile; lecture and mobile seed their own defaults (pure title + minutes items).

An agenda holds **up to 12 sections**, and bullets are optional — a pure agenda item is just a title plus planned minutes. The shared sections manager (Overlay inspector and **Session Config → Session**, both titled with the scene it edits) adds, removes and reorders sections and their bullets; every structural change atomically keeps the active section, per-bullet done flags and the same profile's progress segments pointing at the right section. Selecting a section there picks it for editing only — driving the live agenda stays in the Broadcast drive console, and the on-air section keeps a quiet marker in the manager. On the workbench broadcast canvas the sidebar shows a **sliding window of 3 sections** starting at the active one (pulled back at the tail so the window stays full), with a small `0X–0Y / 0Z` indicator once there are more than 3 — with 3 or fewer, it renders exactly as before.

In lecture layouts the presenter card carries the **run-of-show checklist** under the presenter identity: numbered rows with planned minutes. Completion is **manual** — the host checks a section off (in the sections manager or the agenda drive console); driving to the next section never marks the previous one. Checked sections read done (accent check + strike), the active one carries an accent rail plus the live "elapsed / planned" section timer, upcoming rows stay quiet. Past 5 sections it windows like the sidebar, with the same mono indicator.

**Session Config → Broadcast → Agenda drive** is the on-air console: previous/next section (each drive restarts the section timer), jump to any section, restart the timer in place, and pick the follow-slot handle.

The lecture header and presenter card read from the **Brand layer** (Session Config → Session): logo, series/programme name, and presenter lines — set once, reused every stream, never edited by the AI.

## Session Persistence (Live Data Database)

The **Session Config** tab — backed by the live-data persistence layer — can persist sidebar sections, tasks, bottom-bar segments, stack items, and live session start/end timestamps to PostgreSQL. ("Live Data" is the name of this persistence/API layer, not a page: the user-facing tab is **Session Config**.) If `DATABASE_URL` is not configured, the app stays in local draft mode and continues to use `localStorage` plus the in-memory OBS live-state endpoint.

Configure a database:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/vibe_coding_live
pnpm db:push
pnpm dev
```

The schema lives in `src/db/schema.ts`, with checked-in SQL migrations under `drizzle/` (through `0006_section_done.sql` — per-scene agendas + manual section completion). Database APIs are mounted under `/api/sessions`, while `/api/live-state` remains the real-time OBS bridge.

## Session Config Agent (optional AI)

The **Session Config → Agent** tab can call a real model to draft the stream **content**, or stay fully local. It is configured by local/private Studio env vars (see `.env.example`):

```bash
SESSION_AGENT_PROVIDER=deepseek
SESSION_AGENT_BASE_URL=https://api.deepseek.com   # OpenAI-compatible base URL
SESSION_AGENT_API_KEY=sk-...                       # server only — never commit
SESSION_AGENT_MODEL=deepseek-chat                  # use the provider's current model
SESSION_AGENT_USER_AGENT=Vibe-Studio/SessionConfigAgent
```

- The adapter is **OpenAI-compatible Chat Completions**, so DeepSeek, OpenAI, Kimi and z.ai all work by setting `BASE_URL` + `MODEL`. Example provider: [DeepSeek](https://api-docs.deepseek.com/) (`https://api.deepseek.com`, endpoint `/chat/completions`).
- The **API key stays in your local/private Studio server env** (the route `/api/session-config/agent`); it is never in the client bundle, never in `localStorage`, and never logged. The client only learns the provider/model name.
- **The agent edits stream content only** — title, subtitle, sections (including each section's optional planned minutes), stack and topic badges. Identity and brand (author, avatar, socials, theme/colors) are the **Brand layer**: set once, reused every stream, and never changed by the AI. A reply's content is merged back onto your current config, so a model reply cannot touch identity or brand.
- **Nothing personal reaches the provider.** Before every call (online *and* the copy-handoff prompt) the config is projected down to those content keys, so identity + brand are structurally absent from the payload; uploaded avatar/cover images are downscaled locally and never sent.
- **No key configured → fallback to local handoff** (Copy handoff). No provider request is made.
- AI output is **never auto-applied**: a returned config opens in the JSON drawer for review + Apply, exactly like Import.
- Public/demo deployments do not collect API keys and cannot push into your local OBS. OBS automation is for the local/private Studio you run and configure.
- On a hosted **showcase** (`VIBE_SHOWCASE=1`) that has a provider configured, `/demo` can run the agent against that provider so visitors can try it live — rate-limited per IP (`SESSION_AGENT_RATE_LIMIT`, default 10/hour) and output-capped (`SESSION_AGENT_MAX_TOKENS`, default 4096). It still never persists to a database, publishes OBS state, or collects a visitor key. A local/private Studio ignores these limits and runs with your own key. Set a spending cap on the provider account as the real backstop.

## Export Workflow

1. Open the overlay builder.
2. Switch between the Overlay, Session Config, Cover, Poster, and Wallpaper tabs.
3. Adjust copy, sections, badges, social links, live session start time, tool stack, and wallpaper-only fields. The Session Config tab edits the v1 portable-core fields directly (title, subtitle, author, profile/cover, badges, stack, socials, sections) and exposes the same config as JSON.
4. Use the export controls to generate PNGs for the cover, poster, full overlay, sidebar, bottom bar, or wallpaper set.
5. Keep polished example exports in `docs/assets/` when they should be shown in this README.

Current example dimensions:

- Cover screen: `1280x720`
- Poster: `1920x1080`
- Full overlay: `1920x1080` (16:9 layouts)
- Full overlay, mobile layout: `1080x1920`
- Sidebar: `470x760`
- Bottom bar: `1856x180`
- Wallpaper desktop 4K: `3840x2160`
- Wallpaper desktop QHD: `2560x1440`
- Wallpaper mobile: `1290x2796`

Exported files are named after your stream: `<title-slug>-<surface>-<date>.png` (e.g. `rust-from-scratch-cover-2026-07-10.png`); an empty title falls back to `vibe-live`.

Current default social stacks:

- Chinese: Bilibili `Aklman`, website `example.com`, QQ group `123456789`, WeChat `demo-live`, GitHub `demo-org/vibe-live`.
- English: YouTube `@demo-live`, website `example.com`, Discord `demo-live`, X `@demo_live`, GitHub `demo-org/vibe-live`.

## Project Layout

```text
src/
  app/              Next.js App Router entry, layout, and global CSS
  components/       Builder shell, canvas renderers, inspectors, and shared UI
  db/               Drizzle schema, PostgreSQL client, and live-data repository
  hooks/            Locale, keyboard shortcut, and time helpers
  lib/              Design tokens, i18n dictionaries, state helpers, and model helpers
  utils/            PNG export utilities
scripts/            Local automation such as OBS/Bilibili live preparation
public/             Static assets used by the app
docs/assets/        README images and exported examples
drizzle/            SQL migrations for live data persistence
```

## Implementation Notes

- The app is a client-rendered overlay builder mounted from the App Router.
- Canvas output is rendered as DOM/CSS and exported with `html-to-image`.
- Export nodes stay mounted off-screen so PNG captures use the same render tree as the preview.
- State persists in `localStorage` and is normalized through `src/stateStorage.ts`.
- Config boundary: [`live-session.config.json`](docs/live-session.config.md) is the per-session content portable core (v1); a future [`studio.config.json`](docs/studio.config.md) is for studio-level settings (draft only); runtime state stays in `OverlayState`/`localStorage`. The split is pinned in `src/lib/session-config-boundary.ts`. Configs move by manual import/export, not a watched file.
- Brand layer: the reusable identity + look — author, avatar, socials, theme, colors, and the lecture header fields (logo, series name, presenter lines) — persists separately as a Studio Profile (`src/lib/studio-profile.ts`), re-applied on load/reset (write once, reuse each stream). It is set by hand in **Session Config**, never by the AI agent, which only drafts per-stream content.
- `state.theme` is the app-wide light/dark appearance. App shell UI reads `APP_THEME_TOKENS` and CSS vars, while `state.colors` is the broadcast/export asset palette users can override. Switching Light/Dark currently loads the matching asset preset as a product default; if the app ever needs light UI with dark exports, add a separate `assetPalette` control instead of overloading `theme`.
- The live-data persistence layer (behind the Session Config tab) persists to PostgreSQL when `DATABASE_URL` is configured, with local draft fallback when it is not.
- Localization uses the custom `t()` dictionary system in `src/lib/i18n.ts`.
- `pnpm live:prepare` edits local OBS config files under `~/Library/Application Support/obs-studio/` and writes timestamped backups before changing them.
- Package management is pnpm only.
- Redesign work should preserve export dimensions, OBS routes, live-state API behavior, and state normalization even when the visuals change.
