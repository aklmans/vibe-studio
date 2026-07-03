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

## OBS and Bilibili Livehime Setup

For Bilibili accounts that cannot push directly from OBS, use OBS as the compositor and feed Bilibili Livehime through OBS Virtual Camera:

```text
Vibe web app -> OBS Browser Source -> OBS scene composition -> OBS Virtual Camera -> Bilibili Livehime camera source
```

Prepare the local live environment with:

```bash
pnpm live:prepare
```

Useful lifecycle commands:

```bash
pnpm live:status    # Show Next/OBS/Livehime status.
pnpm live:stop      # Stop OBS Virtual Camera, quit OBS, and stop the local Next server.
pnpm live:restart   # Stop local live tooling, then run live:prepare again.
```

The script:

1. Ensures the Next.js app is available on `http://localhost:3000`.
2. Updates the OBS scene named `Vibe Live Overlay` in the matching scene collection.
3. Points the overlay Browser Sources at:
   - `http://localhost:3000/obs/overlay?camera=empty`
   - `http://localhost:3000/obs/overlay?camera=avatar`
4. Resets the expected OBS source order and visibility.
5. Opens OBS with the resolved profile/collection and the `Vibe Live Overlay` scene.
6. Starts OBS Virtual Camera after OBS has finished launching.
7. Opens the web app and Bilibili Livehime.

The script never clicks Bilibili's start-live button. Confirm the title, category, microphone, preview, and final start action manually in Livehime.

While live, the **Composition · OBS** controls (local/private Studio only — in the Overlay inspector and mirrored in **Session Config → Broadcast**) pick the source for each region: the main screen can show display 1, display 2, or the app window; the camera slot can show the webcam, a second monitor, the avatar theme, or nothing. You can swap two display regions and recall whole compositions from saved presets — all driving your local OBS over obs-websocket. For the second-monitor option, add a macOS Screen Capture source in OBS once, name it exactly `Vibe Second Screen Capture`, and point it at display 2; `pnpm live:prepare` will keep it parked in the camera slot.

`pnpm live:stop` intentionally leaves Bilibili Livehime open because closing it can interrupt an active stream. Close Livehime manually after ending the livestream.

Important OBS note: do not start OBS with `--startvirtualcam`. On macOS this can trigger OBS's "The virtual camera is not installed" dialog before the camera system extension has finished loading. `pnpm live:prepare` intentionally starts OBS first, enables obs-websocket, then calls `StartVirtualCam` through WebSocket after OBS is ready.

If OBS still reports that the virtual camera is not installed:

1. Open `System Settings -> General -> Login Items & Extensions -> Camera Extensions`.
2. Enable `OBS Virtual Camera`.
3. Restart OBS, or restart macOS if the extension state looks stale.
4. Run `pnpm live:prepare` again.

You can verify the extension state with:

```bash
systemextensionsctl list
```

The expected entry is `OBS Virtual Camera` with `[activated enabled]`.

## Session Persistence (Live Data Database)

The **Session Config** tab — backed by the live-data persistence layer — can persist sidebar sections, tasks, bottom-bar segments, stack items, and live session start/end timestamps to PostgreSQL. ("Live Data" is the name of this persistence/API layer, not a page: the user-facing tab is **Session Config**.) If `DATABASE_URL` is not configured, the app stays in local draft mode and continues to use `localStorage` plus the in-memory OBS live-state endpoint.

Configure a database:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/vibe_coding_live
pnpm db:push
pnpm dev
```

The schema lives in `src/db/schema.ts`, with a checked-in SQL migration at `drizzle/0001_live_sessions.sql`. Database APIs are mounted under `/api/sessions`, while `/api/live-state` remains the real-time OBS bridge.

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
- **The agent edits stream content only** — title, subtitle, sections, stack and topic badges. Identity and brand (author, avatar, socials, theme/colors) are the **Brand layer**: set once, reused every stream, and never changed by the AI. A reply's content is merged back onto your current config, so a model reply cannot touch identity or brand.
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
- Full overlay: `1920x1080`
- Sidebar: `470x760`
- Bottom bar: `1856x180`
- Wallpaper desktop 4K: `3840x2160`
- Wallpaper desktop QHD: `2560x1440`
- Wallpaper mobile: `1290x2796`

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
- Brand layer: the reusable identity + look — author, avatar, socials, theme, colors — persists separately as a Studio Profile (`src/lib/studio-profile.ts`), re-applied on load/reset (write once, reuse each stream). It is set by hand in **Session Config**, never by the AI agent, which only drafts per-stream content.
- `state.theme` is the app-wide light/dark appearance. App shell UI reads `APP_THEME_TOKENS` and CSS vars, while `state.colors` is the broadcast/export asset palette users can override. Switching Light/Dark currently loads the matching asset preset as a product default; if the app ever needs light UI with dark exports, add a separate `assetPalette` control instead of overloading `theme`.
- The live-data persistence layer (behind the Session Config tab) persists to PostgreSQL when `DATABASE_URL` is configured, with local draft fallback when it is not.
- Localization uses the custom `t()` dictionary system in `src/lib/i18n.ts`.
- `pnpm live:prepare` edits local OBS config files under `~/Library/Application Support/obs-studio/` and writes timestamped backups before changing them.
- Package management is pnpm only.
- Redesign work should preserve export dimensions, OBS routes, live-state API behavior, and state normalization even when the visuals change.
