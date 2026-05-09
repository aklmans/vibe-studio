# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A pnpm monorepo for building livestream graphics for Vibe Coding sessions. The primary artifact is a React overlay builder (`@workspace/vibe-overlay`) that edits cover screens, full overlays, sidebar panels, and bottom status bars, then exports broadcast-ready PNG assets at 1920×1080.

## Commands

### Install dependencies
```
pnpm install
```

### Run the overlay builder (main app)
```
pnpm --filter @workspace/vibe-overlay run dev
```
Runs on `http://localhost:8081` by default. Set `PORT` or `BASE_PATH` env vars to change.

### Run the API server
```
PORT=5000 pnpm --filter @workspace/api-server run dev
```
This builds with esbuild first, then starts the server.

### Typecheck
```
pnpm run typecheck
```
Runs `tsc --build` on libs first, then typechecks artifacts and scripts. To typecheck a single package:
```
pnpm --filter @workspace/<package-name> run typecheck
```

### Build all
```
pnpm run build
```
Runs typecheck, then builds all packages.

### Run tests
```
pnpm test
```
Tests use Node.js built-in test runner (`node:test`) with `tsx` for TypeScript. To run tests for a single package:
```
pnpm --filter @workspace/api-server run test
pnpm --filter @workspace/vibe-overlay run test
```
Test files are colocated with source as `*.test.ts`.

### Regenerate API clients from OpenAPI spec
```
pnpm --filter @workspace/api-spec run codegen
```
Run this after any change to `lib/api-spec/openapi.yaml`. It regenerates both the React Query client and Zod schemas, then runs `typecheck:libs`.

### Database schema push (requires DATABASE_URL)
```
pnpm --filter @workspace/db run db:push
```

## Architecture

### Workspace structure

The monorepo uses two top-level directories to separate deployable apps from shared libraries:

- **`artifacts/`** — Deployable applications (Vite frontends, Express server)
- **`lib/`** — Shared libraries consumed by artifacts via `workspace:*` dependencies

### Package dependency flow

```
openapi.yaml (lib/api-spec)
    │
    │  orval codegen
    ├────────────────► lib/api-zod (generated Zod schemas)
    │                        │
    │                        ▼
    │                  artifacts/api-server (Express 5, validates with api-zod)
    │
    └────────────────► lib/api-client-react (generated React Query hooks)
                             │
                             ▼
                       artifacts/vibe-overlay (React + Vite frontend)

lib/db (Drizzle ORM + PostgreSQL) ──► artifacts/api-server
```

The OpenAPI spec in `lib/api-spec/openapi.yaml` is the **single source of truth** for the API contract. Orval generates two outputs from it:
- `lib/api-zod` — Zod validation schemas used server-side in route handlers
- `lib/api-client-react` — React Query hooks with a custom fetch wrapper, used client-side

**Do not edit files in `lib/api-zod/src/generated/` or `lib/api-client-react/src/generated/` by hand** — they are overwritten by codegen.

### API server (artifacts/api-server)

- Express 5 app with routes mounted under `/api`
- Built with esbuild into a single ESM bundle (`dist/index.mjs`) with CJS compatibility banner
- Routes are in `src/routes/`, each file exports a Router. The index aggregates them.
- Uses `@workspace/api-zod` schemas to validate responses (e.g. `HealthCheckResponse.parse(...)`)
- Logging via pino + pino-http
- Tests use `node:test` + `node:assert/strict`

### Overlay app (artifacts/vibe-overlay)

- React + Vite + Tailwind CSS v4 frontend
- Uses `html-to-image` for PNG export of broadcast graphics
- State is persisted to localStorage via `stateStorage.ts` with migration/normalization logic
- Path alias: `@` → `src/`, `@assets` → `attached_assets/`
- UI components in `src/components/ui/` (shadcn/ui pattern with Radix primitives)
- Routing via `wouter`

### Database (lib/db)

- Drizzle ORM with PostgreSQL (`node-postgres` driver)
- Schema defined in `lib/db/src/schema/` — each table should be its own file using the `pgTable` + `createInsertSchema` + type export pattern (see template in `schema/index.ts`)
- Requires `DATABASE_URL` env var

### Key conventions

- Package manager is **pnpm only** — the preinstall script rejects npm/yarn
- All packages use ESM (`"type": "module"`)
- TypeScript strict null checks and no-implicit-any are enabled
- `pnpm-workspace.yaml` enforces a 1-day minimum release age on npm packages for supply-chain security; do not disable this
- Zod is imported from `zod/v4` in Drizzle schema files
- The `catalog:` protocol in package.json pins shared dependency versions in `pnpm-workspace.yaml`
