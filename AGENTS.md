# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This repository is a single Next.js App Router application for building livestream graphics for Vibe Coding sessions. The app edits cover screens, posters, full overlays, sidebar panels, bottom status bars, and brand wallpapers, then exports broadcast-ready PNG assets.

The application is intentionally frontend-only. State is stored in `localStorage`; export uses always-mounted off-screen DOM nodes and `html-to-image`.

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
```

This is a local macOS automation script for the author's streaming setup. It starts or reuses the Next.js app on `http://localhost:3000`, updates the OBS scene collection `Vibe Coding Live Overlay`, opens OBS, starts OBS Virtual Camera, opens the web app, and opens Bilibili Livehime. It does not start the Bilibili livestream.

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
- The canvas components rely heavily on inline styles to preserve pixel output. Do not replace them with a component framework.

## Key Conventions

- Package manager is pnpm only; the `preinstall` script rejects npm and yarn.
- The codebase is ESM and uses strict TypeScript settings.
- Do not add new shadcn/ui components. Existing local UI files are only kept when imported.
- Do not introduce a new runtime dependency unless it substantially reduces complexity.
- Preserve visual output for canvas components: colors, layout, typography, and spacing should remain pixel-equivalent.
- Preserve the existing export behavior and `localStorage` persistence behavior.
- Keep documentation and generated design notes out of the repository unless they are intended as durable project docs.
