# Vibe Coding Live

A pnpm workspace for building, exporting, and serving livestream graphics for a Vibe Coding session. The main artifact is a React overlay builder that edits the cover screen, pre-stream poster, full overlay, sidebar panel, and bottom status bar, then exports broadcast-ready PNG assets.

## Preview

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
2. Switch between the Overlay, Cover, and Poster tabs and adjust copy, sections, badges, social links, live session start time, and the tool stack.
3. Use the export controls to generate PNGs for the cover, poster, full overlay, or individual broadcast slices (sidebar / bottom bar).
4. Keep polished example exports in `docs/assets/` when they should be shown in this README.

Current example dimensions:

- Cover screen: `1920x1080`
- Poster: `1920x1080`
- Full overlay: `1920x1080`
- Sidebar: `470x760`
- Bottom bar: `1856x180`

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
