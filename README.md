# Vibe Coding Live

A pnpm workspace for building, exporting, and serving livestream graphics for a Vibe Coding session. The main artifact is a React overlay builder that edits the cover screen, pre-stream poster, full overlay, sidebar panel, bottom status bar, and brand wallpapers, then exports broadcast-ready PNG assets.

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

A single wallpaper export action emits three sizes that share the Cover/Poster brand language but drop livestream-specific elements (LIVE pill, TODAY'S BUILD card, Manifesto), so they read as quiet brand wallpapers when shown on a screen-share.

<p align="center">
  <img src="docs/assets/vibe-coding-wallpaper-desktop-4k.png" alt="Vibe Coding wallpaper — Desktop 4K" width="820">
</p>

<table>
  <tr>
    <th>Desktop QHD · 2560×1440</th>
    <th>Mobile · 1290×2796</th>
  </tr>
  <tr>
    <td width="70%">
      <img src="docs/assets/vibe-coding-wallpaper-desktop-qhd.png" alt="Vibe Coding wallpaper — Desktop QHD">
    </td>
    <td width="30%">
      <img src="docs/assets/vibe-coding-wallpaper-mobile.png" alt="Vibe Coding wallpaper — Mobile">
    </td>
  </tr>
</table>

## What's Included

- `@workspace/vibe-overlay`: React and Vite app for editing livestream visuals and exporting PNG assets.
- `@workspace/api-server`: Express API server scaffold with typed request and response helpers.
- `@workspace/mockup-sandbox`: UI sandbox for previewing shared components and mockups.
- `@workspace/api-spec`: OpenAPI source and generated schema artifacts.
- `@workspace/api-client-react`: React Query client generated from the OpenAPI contract.
- `@workspace/api-zod`: Zod schemas generated from the OpenAPI contract.
- `@workspace/db`: Drizzle database schema and migration tooling.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Run the overlay builder:

```bash
pnpm --filter @workspace/vibe-overlay run dev
```

By default the overlay app runs on `http://localhost:8081`. Set `PORT` or `BASE_PATH` when the hosting environment needs different values.

## Export Workflow

1. Open the overlay builder.
2. Switch between the Overlay, Cover, Poster, and Wallpaper tabs and adjust copy, sections, badges, social links, live session start time, the tool stack, and wallpaper-only fields (brand label / slogan / element toggles).
3. Use the export controls to generate PNGs for the cover, poster, full overlay, individual broadcast slices (sidebar / bottom bar), or the wallpaper set (3 sizes saved in one click).
4. Keep polished example exports in `docs/assets/` when they should be shown in this README.

Current example dimensions:

- Cover screen: `1920x1080`
- Poster: `1920x1080`
- Full overlay: `1920x1080`
- Sidebar: `470x760`
- Bottom bar: `1856x180`
- Wallpaper · Desktop 4K: `3840x2160`
- Wallpaper · Desktop QHD: `2560x1440`
- Wallpaper · Mobile: `1290x2796`

Current default social stacks:

- Chinese: Bilibili `Aklman`, personal website `aklman.com`, QQ group `205359827`, WeChat `aklman1`, GitHub `aklmans`.
- English: YouTube `@aklman2018`, personal website `aklman.com`, Discord `aklman`, X `@Aklman2018`, GitHub `aklmans`.

## Common Commands

```bash
pnpm test
pnpm run typecheck
pnpm run build
```

Run the API server locally:

```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
```

Regenerate API clients and schemas after changing the OpenAPI contract:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Database commands require `DATABASE_URL`:

```bash
pnpm --filter @workspace/db run db:push
```

## Repository Layout

```text
artifacts/
  api-server/       Express API server
  mockup-sandbox/   Component and UI preview sandbox
  vibe-overlay/     Livestream overlay builder
docs/
  assets/           README images and exported examples
lib/
  api-client-react/ Generated React Query client
  api-spec/         OpenAPI contract and codegen entry point
  api-zod/          Generated Zod schemas
  db/               Drizzle schema and database tooling
```
