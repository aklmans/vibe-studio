# Vibe Coding Live

A Next.js app for building and exporting livestream graphics for Vibe Coding sessions. It edits cover screens, posters, full overlays, sidebar panels, bottom status bars, and brand wallpapers, then exports broadcast-ready PNG assets.

## Preview

The preview images below are the latest checked-in exports from the overlay builder, stored in `docs/assets/`.

### Cover screen

<p align="center">
  <img src="docs/assets/vibe-coding-cover.png" alt="Vibe Coding cover screen" width="820">
</p>

### Poster

<p align="center">
  <img src="docs/assets/vibe-coding-poster.png" alt="Vibe Coding poster" width="820">
</p>

### Full live overlay

<p align="center">
  <img src="docs/assets/vibe-coding-overlay.png" alt="Vibe Coding full live overlay" width="820">
</p>

### Export slices

<table>
  <tr>
    <th>Sidebar</th>
    <th>Bottom bar</th>
  </tr>
  <tr>
    <td width="34%">
      <img src="docs/assets/vibe-coding-sidebar.png" alt="Vibe Coding sidebar export">
    </td>
    <td width="66%">
      <img src="docs/assets/vibe-coding-bottom-bar.png" alt="Vibe Coding bottom bar export">
    </td>
  </tr>
</table>

### Wallpapers

A single wallpaper export action emits three sizes that share the Cover/Poster brand language but drop livestream-specific elements, so they read as quiet brand wallpapers when shown on a screen-share.

<p align="center">
  <img src="docs/assets/vibe-coding-wallpaper-desktop-4k.png" alt="Vibe Coding wallpaper - Desktop 4K" width="820">
</p>

<table>
  <tr>
    <th>Desktop QHD · 2560×1440</th>
    <th>Mobile · 1290×2796</th>
  </tr>
  <tr>
    <td width="70%">
      <img src="docs/assets/vibe-coding-wallpaper-desktop-qhd.png" alt="Vibe Coding wallpaper - Desktop QHD">
    </td>
    <td width="30%">
      <img src="docs/assets/vibe-coding-wallpaper-mobile.png" alt="Vibe Coding wallpaper - Mobile">
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

## Common Commands

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm db:push
pnpm live:prepare
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

The script:

1. Ensures the Next.js app is available on `http://localhost:3000`.
2. Updates the OBS scene collection `Vibe Coding Live Overlay`.
3. Points the overlay Browser Sources at:
   - `http://localhost:3000/obs/overlay?camera=empty`
   - `http://localhost:3000/obs/overlay?camera=avatar`
4. Resets the expected OBS source order and visibility.
5. Opens OBS with the `Vibe Coding Live Overlay` profile, collection, and `Vibe Live Overlay` scene.
6. Starts OBS Virtual Camera after OBS has finished launching.
7. Opens the web app and Bilibili Livehime.

The script never clicks Bilibili's start-live button. Confirm the title, category, microphone, preview, and final start action manually in Livehime.

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

## Live Data Database

The Live Data tab can persist sidebar sections, tasks, bottom-bar segments, stack items, and live session start/end timestamps to PostgreSQL. If `DATABASE_URL` is not configured, the app stays in local draft mode and continues to use `localStorage` plus the in-memory OBS live-state endpoint.

Configure a database:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/vibe_coding_live
pnpm db:push
pnpm dev
```

The schema lives in `src/db/schema.ts`, with a checked-in SQL migration at `drizzle/0001_live_sessions.sql`. Database APIs are mounted under `/api/sessions`, while `/api/live-state` remains the real-time OBS bridge.

## Export Workflow

1. Open the overlay builder.
2. Switch between the Overlay, Cover, Poster, and Wallpaper tabs.
3. Adjust copy, sections, badges, social links, live session start time, tool stack, and wallpaper-only fields.
4. Use the export controls to generate PNGs for the cover, poster, full overlay, sidebar, bottom bar, or wallpaper set.
5. Keep polished example exports in `docs/assets/` when they should be shown in this README.

Current example dimensions:

- Cover screen: `1920x1080`
- Poster: `1920x1080`
- Full overlay: `1920x1080`
- Sidebar: `470x760`
- Bottom bar: `1856x180`
- Wallpaper desktop 4K: `3840x2160`
- Wallpaper desktop QHD: `2560x1440`
- Wallpaper mobile: `1290x2796`

Current default social stacks:

- Chinese: Bilibili `Aklman`, personal website `aklman.com`, QQ group `205359827`, WeChat `aklman1`, GitHub `aklmans`.
- English: YouTube `@aklman2018`, personal website `aklman.com`, Discord `aklman`, X `@Aklman2018`, GitHub `aklmans`.

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
- Live Data persists to PostgreSQL when `DATABASE_URL` is configured, with local draft fallback when it is not.
- Localization uses the custom `t()` dictionary system in `src/lib/i18n.ts`.
- `pnpm live:prepare` edits local OBS config files under `~/Library/Application Support/obs-studio/` and writes timestamped backups before changing them.
- Package management is pnpm only.
