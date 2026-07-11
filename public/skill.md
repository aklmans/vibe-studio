# Vibe Studio Agent Skill

Read this before preparing, running, configuring, or modifying Vibe Studio.

Product: Vibe Studio / Vibe Coding Live
Repository: https://github.com/aklmans/vibe-studio

## Goal

Vibe Studio is a Next.js live-studio workbench for Study With Me, Coding With Me,
Build in Public, Vibe Coding, gaming, chat, co-working, and other "with me" streams. It gives
creators designed broadcast graphics without hand-building every scene in OBS
or Livehime, lets a local/private AI agent draft session config, renders OBS
browser sources, and exports a visual kit.

## First Files To Read

- `AGENTS.md`
- `README.md`
- `docs/deploy.md` (Docker / hosted deploys)
- `docs/author-setup.md` (macOS OBS + Livehime automation)
- `src/components/OverlayBuilderApp.tsx`
- `src/components/live-data/`
- `src/lib/live-studio-config.ts`
- `src/lib/session-agent.ts`

## Run Locally

```bash
pnpm install
pnpm dev
```

Open:

- `/demo` for the safe local demo.
- `/studio` for the private full workspace.

A true first run of `/studio` greets the host with a 3-step setup wizard
(name → avatar → platform; every step and the whole wizard are skippable —
automation can click "Skip setup"). Completing or skipping writes the Brand
layer; a mid-wizard refresh brings the wizard back.

Use pnpm only.

## Safe Demo vs Studio

- `/demo` never writes to a database, publishes OBS state, or collects a visitor
  API key. On a hosted showcase (`VIBE_SHOWCASE=1`) that configured a provider it
  can run the agent against that provider, rate-limited by IP and token-capped;
  with none it falls back to the local handoff. Turns are never persisted.
- `/studio` is the private workspace. When run locally or in your own private
  deployment, it can use AI provider env (uncapped), optional database
  persistence, and local OBS automation.
- A public hosted demo cannot push into a viewer's local OBS.

## Agent Boundary

- API key stays in local/private server env.
- Never put API keys in browser code, client state, `localStorage`, prompts,
  logs, screenshots, or committed files.
- Public/demo deployments must not ask for or store user API keys.
- The client should only see configured/not-configured provider status.
- AI proposals must go through JSON review/apply.
- Do not auto-apply generated config.
- Do not automatically change OBS, DB, runtime state, or localStorage.

## Session Config Boundary

- `live-session.config.json` is the per-session content portable core.
- It may include title, subtitle, author, profile, cover, badges, stack,
  socials, and sections. Sections are
  `{ title, minutes?, bullets?, speaker?, speakerLines? }` (up to 12) —
  planned minutes, optional bullets, and an optional per-section speaker with
  role/affiliation lines.
- runtime / OBS / localStorage / studio appearance do not belong in v1 config.
- Each scene layout (workbench / lecture / mobile) keeps its OWN agenda;
  config sections apply to an explicit target scene (default: the active one).
- The active section, manual completion check-offs, bullet done states, the
  section timer, OBS state, and app appearance remain runtime or studio state.

## OBS Browser Sources

Add these as browser sources when running the app:

```text
/obs/overlay?camera=empty
/obs/overlay?camera=avatar
/obs/sidebar
/obs/bottom-bar
```

The overlay is a transparent UI frame. Place real screen capture, windows, and
camera sources underneath it in OBS or Livehime. The README's OBS section is a
five-minute manual tutorial that works on any OS.

Scene layouts: workbench, lecture · left/right, and mobile · vertical. The
vertical layout renders 1080×1920 — give OBS a portrait base canvas to match
(on macOS, `pnpm live:prepare:mobile` derives a "Vibe Vertical" profile +
collection automatically; see `docs/author-setup.md`).

## AI Provider Setup

Use local/private Studio env only, for example:

```bash
SESSION_AGENT_PROVIDER=deepseek
SESSION_AGENT_BASE_URL=https://api.deepseek.com
SESSION_AGENT_API_KEY=sk-...
SESSION_AGENT_MODEL=deepseek-chat
SESSION_AGENT_USER_AGENT=Vibe-Studio/SessionConfigAgent
```

Do not expose secrets to the client. If no key is configured, use the local
copy-handoff flow.

## Verify

Before handing work back, run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Also smoke-check `/`, `/demo`, `/studio`, and the OBS routes above.
