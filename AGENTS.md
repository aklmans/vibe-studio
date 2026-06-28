# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

This repository is a single Next.js App Router application for building livestream graphics for live coding sessions. The app edits cover screens, posters, full overlays, sidebar panels, bottom status bars, and brand wallpapers, then exports broadcast-ready PNG assets.

The application is primarily a client-rendered builder. State is stored in `localStorage` and can optionally persist live session data to PostgreSQL when `DATABASE_URL` is configured. Export uses always-mounted off-screen DOM nodes and `html-to-image`.

## First Files To Read

Before visual, structural, or workflow changes, read:

- `DESIGN_LANGUAGE.md`
- `README.md`
- `src/types.ts`
- `src/lib/design-tokens.ts`
- `src/lib/theme.ts`
- `src/app/globals.css`
- `src/components/OverlayBuilderApp.tsx`
- `src/components/topbar/TopBar.tsx`
- `src/components/inspector/Inspector.tsx`
- `src/utils/exportImage.ts`

For OBS/live-data behavior, also read:

- `src/components/obs/ObsSourceClient.tsx`
- `src/lib/live-state.ts`
- `src/lib/live-data.ts`
- `scripts/prepare-live.ts`

Naming note: **"Live Data" is the persistence / API layer** (DB repo, `live-data*`
libs, `/api/sessions`, the OBS `live-state` bridge), not a page. The user-facing
tab is **Session Config** (`src/components/live-data/` — `LiveDataManager` shell
that opens **Agent-first**, with a **Settings** mode grouped Session / Content /
Broadcast Display / Studio Appearance / AI Provider / Data & Sync, and a global
drift-safe JSON drawer). There is no Recipe / Brief flow and no `SessionRecipePanel`;
those earlier stages were retired. The Agent calls a configured provider
server-side (the API key stays in server env, never in the client bundle /
localStorage / logs — the client only ever sees `configured` / `not set`) or
falls back to a local copy-handoff; it never edits settings via chat and never
bypasses the JSON review/apply path.

## Current Branch Goal: `editorial-live`

The `editorial-live` branch is for a deliberate visual redesign. The goal is to move the app from a cool neon livestream-control look toward the warm, editorial, calm, premium live-studio language described in `DESIGN_LANGUAGE.md`.

This is a redesign branch, so canvas visuals are allowed and expected to change. Do not treat the old checked-in screenshots as pixel targets on this branch.

Target direction:

- Warm black / warm paper surfaces rather than blue-purple neon.
- Text brand, serif display type, mono metadata, thin hairlines, restrained accent marks.
- Accent color is a small signal, not a large filled background.
- Fewer gradients, glows, rounded pills, platform-color badges, and decorative UI chrome.
- The builder should feel like a quiet editorial asset workbench, not a SaaS dashboard.
- Broadcast assets should still read clearly in OBS and exported PNGs.

Hard contracts that must not change during the redesign:

- Export dimensions and filenames unless explicitly requested.
- OBS source routes and source names: `/obs/overlay`, `/obs/sidebar`, `/obs/bottom-bar`, plus the current OBS scene/source naming in the live preparation script.
- The off-screen export architecture: preview and export should keep rendering from the same state and component logic.
- `OverlayState` semantics, `localStorage` normalization/migration behavior, live-state APIs, database APIs, and existing tests unless a test is intentionally updated to reflect the new visual contract.
- Core keyboard shortcuts, command palette behavior, language persistence, export behavior, and live-data sync behavior.

## Commands

### Install dependencies

```bash
pnpm install
```

### Run the app

```bash
pnpm dev
```

Next.js serves on `http://localhost:3000` by default. If the port is already in use, it will select the next available port.

### Typecheck

```bash
pnpm typecheck
```

### Run tests

```bash
pnpm test
```

Tests use Node.js built-in test runner with `tsx`. Test files are colocated with source as `*.test.ts`.

### Production build

```bash
pnpm build
```

### Run the production server

```bash
pnpm start
```

### Prepare OBS and Bilibili Livehime

```bash
pnpm live:prepare
pnpm live:status
pnpm live:stop
pnpm live:restart
```

This is a local macOS automation script for the author's streaming setup. `pnpm live:prepare` starts or reuses the Next.js app on `http://localhost:3000`, updates the OBS scene named `Vibe Live Overlay` in the matching scene collection, opens OBS, starts OBS Virtual Camera, opens the web app, and opens Bilibili Livehime. `pnpm live:status` prints the local Next/OBS/Livehime state. `pnpm live:stop` stops OBS Virtual Camera, quits OBS, and stops the local Next dev server while intentionally leaving Bilibili Livehime open. `pnpm live:restart` runs stop then prepare. These commands do not start or stop the Bilibili livestream.

Important: do not reintroduce OBS's `--startvirtualcam` launch argument. On macOS it can trigger OBS's "The virtual camera is not installed" dialog before the Camera Extension has finished loading. The script intentionally starts OBS first, enables obs-websocket, then starts the virtual camera through WebSocket after OBS is ready.

## Architecture

### Application entry

- `src/app/layout.tsx` defines the root document and metadata.
- `src/app/page.tsx` renders the page.
- `src/app/client-page.tsx` mounts the client-only builder and locale provider.
- `src/components/OverlayBuilderApp.tsx` contains the main editor shell, top bar, inspectors, previews, export nodes, and modal/drawer state.

### Rendering and export

- Canvas components live in `src/components/*Canvas.tsx`.
- Shared canvas primitives live in `src/components/shared/`.
- Export helpers live in `src/utils/exportImage.ts`.
- Keep the off-screen export architecture intact: preview and export should continue to render from the same state and component logic.

### State and localization

- Shared types and defaults live in `src/types.ts`.
- State migration and normalization live in `src/stateStorage.ts`.
- Patch/update helpers live in `src/lib/state.ts`.
- OBS preparation helpers live in `src/lib/live-prepare.ts`.
- Locale dictionaries and the custom `t()` helper live in `src/lib/i18n.ts`.
- `src/hooks/useLocale.tsx` owns locale context and persistence.

### Local automation

- `scripts/prepare-live.ts` owns the OBS/Bilibili setup flow.
- The script may edit files under `~/Library/Application Support/obs-studio/` and must write timestamped backups before modifying OBS config.
- Keep OBS source names in sync with the configured scene collection: `Vibe Live Overlay`, `Vibe Overlay Empty Frame`, `Vibe Overlay Avatar Frame`, `Vibe Camera Capture`, `Vibe Main Display Capture`, and `Vibe Main App Capture`.
- If OBS Virtual Camera fails, verify `System Settings -> General -> Login Items & Extensions -> Camera Extensions -> OBS Virtual Camera` and `systemextensionsctl list` before changing code.

### Styling

- Global styles are in `src/app/globals.css`.
- Tailwind CSS is wired through `postcss.config.mjs`.
- The canvas components rely heavily on inline styles because exported PNGs must use the same render tree as the preview.
- On normal maintenance branches, preserve canvas output unless the task explicitly requests a visual change.
- On the `editorial-live` redesign branch, visual output may change, but export dimensions, OBS compatibility, state semantics, and export reliability must remain stable.
- Do not replace the canvas renderers with a component framework.

## Key Conventions

- Package manager is pnpm only; the `preinstall` script rejects npm and yarn.
- The codebase is ESM and uses strict TypeScript settings.
- Do not add new shadcn/ui components. Existing local UI files are only kept when imported.
- Do not introduce a new runtime dependency unless it substantially reduces complexity.
- Preserve the existing export behavior and `localStorage` persistence behavior.
- Prefer small, reviewable changes. For the redesign, work in phases: shell/tokens first, then overlay assets, then cover/poster/wallpaper, then documentation screenshots.
- Keep documentation and generated design notes out of the repository unless they are intended as durable project docs.

## Redesign Verification

Before handing off redesign work, run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Also manually smoke-check:

- the main builder at `/`;
- all tabs: Overlay, Session Config, Cover, Poster, Wallpaper;
- exports for overlay, cover, poster, wallpaper set, sidebar, and bottom bar;
- OBS routes: `/obs/overlay?camera=empty`, `/obs/overlay?camera=avatar`, `/obs/sidebar`, `/obs/bottom-bar`;
- language switching and command palette shortcuts.
