export const MAIN_SITE_URL = "https://aklman.com";
export const GITHUB_URL = "https://github.com/aklmans/vibe-studio";
export const GITHUB_PROFILE_URL = "https://github.com/aklmans";
export const X_URL = "https://x.com/aklman2018";
export const RSS_URL = "https://aklman.com/rss.xml";

export const appNav = [
  { label: "Product", href: "#product" },
  { label: "Surfaces", href: "#surfaces" },
  { label: "Workflow", href: "#workflow" },
  { label: "GitHub", href: GITHUB_URL },
];

export const mobileNav = [
  { label: "Product", href: "#product" },
  { label: "Surfaces", href: "#surfaces" },
  { label: "Workflow", href: "#workflow" },
  { label: "GitHub", href: GITHUB_URL },
  { label: "Main site", href: MAIN_SITE_URL },
];

export const featureItems = [
  {
    title: "Live Overlay Builder",
    copy: "Design a transparent main-screen frame, camera slot, sidebar and bottom bar without rebuilding surfaces by hand.",
  },
  {
    title: "Session Config Agent",
    copy: "Ask the agent for a session plan. Review the proposed config in a JSON drawer. Apply it only when you are ready.",
  },
  {
    title: "OBS-ready browser sources",
    copy: "Keep overlay, sidebar and bottom bar as clean browser sources while OBS owns the actual screen capture below.",
  },
];

export const workflowItems = [
  {
    title: "Describe the session",
    copy: "Write a short brief or ask the agent to draft one. The agent proposes a config; nothing is applied yet.",
  },
  {
    title: "Review the config",
    copy: "Open the proposal in the JSON review drawer. Inspect the diff, then Apply — or discard. You stay in control.",
  },
  {
    title: "Connect OBS sources",
    copy: "Add overlay, sidebar and bottom bar as browser sources. OBS or Livehime keeps the real screen capture underneath.",
  },
  {
    title: "Export the kit",
    copy: "Export the overlay, cover, poster and wallpaper set. Run Export All for the public kit from one state.",
  },
];

export const agentFlow = [
  {
    step: "01",
    title: "Agent drafts a session config",
    copy: "Describe the stream. The agent returns a proposed config — title, sections, stack, socials — as JSON you can read.",
  },
  {
    step: "02",
    title: "Human reviews and applies",
    copy: "The proposal opens in the JSON review drawer. Inspect the field-level diff, then Apply. Nothing is auto-applied.",
  },
  {
    step: "03",
    title: "OBS renders browser sources",
    copy: "The overlay, sidebar and bottom bar render as clean browser sources. OBS owns the real capture below the frame.",
  },
];

export const agentSafety = [
  "AI output is never auto-applied. A returned config opens in the JSON review drawer, exactly like Import.",
  "The API key stays on the server. It never enters the client bundle, localStorage, or logs.",
];

export type SurfaceKind = "wide" | "tall" | "strip" | "gallery";

export interface SurfaceGalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
}

export interface SurfaceCard {
  id: string;
  kind: SurfaceKind;
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  summary: string;
  points: string[];
  gallery?: ReadonlyArray<SurfaceGalleryImage>;
}

export const surfaceCards: ReadonlyArray<SurfaceCard> = [
  {
    id: "prepare",
    kind: "wide",
    title: "Prepare with Agent",
    src: "/product/agent-proposal-dark.png",
    alt: "Vibe Coding Live Session Config agent returning a reviewed proposal",
    width: 3960,
    height: 2128,
    summary:
      "Describe the stream in plain language. The Session Config Agent drafts title, sections, stack, socials and bottom bar — no manual form filling.",
    points: [
      "Natural-language brief becomes a structured config",
      "Title, sections, stack, socials proposed in one pass",
      "Faster prep than editing every field by hand",
    ],
  },
  {
    id: "review",
    kind: "wide",
    src: "/product/json-drawer-review-dark.png",
    alt: "Vibe Coding Live JSON review drawer with a proposal staged for manual apply",
    width: 3960,
    height: 2128,
    title: "Review safely",
    summary:
      "AI output is never auto-applied. The proposal opens in a JSON review drawer with a field-level diff. You inspect, then Apply — or discard.",
    points: [
      "Proposal enters a review drawer, never live state",
      "Field-level diff before any change is applied",
      "The agent never writes directly to OBS or the database",
    ],
  },
  {
    id: "compose",
    kind: "wide",
    title: "Compose in OBS",
    src: "/product/obs-main-screen-dark.png",
    alt: "OBS-style broadcast composition with the real capture under the Vibe Coding Live frame",
    width: 1174,
    height: 660,
    summary:
      "Vibe Coding Live owns only the transparent editorial frame. Real screen capture, camera and windows stay free underneath in OBS or Livehime.",
    points: [
      "Overlay is a transparent UI frame, not a locked layout",
      "Screen capture and camera stay in OBS where they belong",
      "Sidebar and bottom bar are independent browser sources",
    ],
  },
  {
    id: "export",
    kind: "gallery",
    title: "Export the kit",
    src: "/product/broadcast-kit-dark.png",
    alt: "Vibe Coding Live broadcast kit exported from one session config",
    width: 2400,
    height: 1350,
    summary:
      "One session config drives the high-value public assets: overlay, cover, poster and desktop/mobile wallpapers. Export All keeps the whole package visually aligned.",
    points: [
      "Overlay, cover, poster and wallpapers from one state",
      "Desktop and mobile wallpaper variants stay aligned",
      "Export All for the whole package before you go live",
    ],
    gallery: [
      {
        src: "/product/vibe-coding-overlay-dark.png",
        alt: "Vibe Coding Live overlay export (dark theme)",
        width: 1920,
        height: 1080,
        label: "Overlay · 1920×1080",
      },
      {
        src: "/product/vibe-coding-cover-dark.png",
        alt: "Vibe Coding Live cover export (dark theme)",
        width: 1280,
        height: 720,
        label: "Cover · 1280×720",
      },
      {
        src: "/product/vibe-coding-poster-dark.png",
        alt: "Vibe Coding Live poster export (dark theme)",
        width: 1920,
        height: 1080,
        label: "Poster · 1920×1080",
      },
      {
        src: "/product/vibe-coding-wallpaper-desktop-4k-dark.png",
        alt: "Vibe Coding Live desktop wallpaper export (dark theme, 4K)",
        width: 3840,
        height: 2160,
        label: "Wallpaper · 3840×2160",
      },
    ],
  },
];

export const heroProofChips = [
  "No auto-apply",
  "Transparent OBS frame",
  "Overlay / cover / poster / wallpapers",
];

export const agentSetupPrompt = `Read /skill.md first.
Then help me set up Vibe Studio (Vibe Coding Live) from the repository:
https://github.com/aklmans/vibe-studio

Open or clone the repo, then read AGENTS.md and README.md.
Use pnpm install and pnpm dev.
Start with the safe public demo at /demo, then explain when to use the private studio at /studio.

If I ask for AI setup, configure provider values only through server env. Never expose API keys,
never put keys in browser code or localStorage, and never log them.

If AI generates a live-session config, do not auto-apply it. Use the JSON review/apply path so I can inspect and apply manually.
Keep OBS, database, runtime state and localStorage unchanged unless I explicitly ask.`;

export interface AgentTask {
  id: string;
  label: string;
  prompt: string;
}

export const agentTasks: ReadonlyArray<AgentTask> = [
  {
    id: "run-demo",
    label: "Run local demo",
    prompt: `Read /skill.md first.
Then help me run the Vibe Studio local demo from https://github.com/aklmans/vibe-studio.
Use pnpm. Check AGENTS.md and README.md for install and dev commands.
The public demo is at /demo — it runs locally with no provider calls, no database writes, no OBS side effects.
Start the dev server and open /demo to confirm it loads.`,
  },
  {
    id: "configure-ai",
    label: "Configure AI provider",
    prompt: `Read /skill.md first.
Then help me configure the Session Config Agent for Vibe Studio.
Check AGENTS.md and README.md for the Session Config Agent section.
The agent uses an OpenAI-compatible Chat Completions adapter — set these in .env.local (server only, never committed):
  SESSION_AGENT_PROVIDER, SESSION_AGENT_BASE_URL, SESSION_AGENT_API_KEY, SESSION_AGENT_MODEL, SESSION_AGENT_USER_AGENT
The API key stays on the server — never expose API keys, never put them in the client bundle, localStorage, or logs.
No key configured? The agent falls back to a local copy handoff. AI output is never auto-applied; use JSON review/apply.`,
  },
  {
    id: "prepare-obs",
    label: "Prepare OBS sources",
    prompt: `Read /skill.md first.
Then help me set up OBS browser sources for Vibe Studio.
Check AGENTS.md and README.md for the OBS setup section.
Add these browser sources in OBS (or Livehime via OBS Virtual Camera):
  /obs/overlay?camera=empty  — transparent main-screen frame, empty camera slot
  /obs/overlay?camera=avatar — same frame with avatar camera slot
  /obs/sidebar               — live sidebar panel
  /obs/bottom-bar            — broadcast metadata strip
Place real screen capture and camera underneath the overlay frame. The overlay owns only the UI frame, not the real capture.`,
  },
  {
    id: "understand-project",
    label: "Understand the project",
    prompt: `Read /skill.md first.
Then read this repository and give me a concise architecture summary of Vibe Studio / Vibe Coding Live.
Check AGENTS.md, README.md, and DESIGN_LANGUAGE.md.
Cover: the App Router entry points (/, /demo, /studio, /obs/*), the builder shell, the off-screen export architecture,
the Session Config Agent boundary (server-side key, review/apply, never auto-applied), and the OBS browser source workflow.
Keep it under 300 words.`,
  },
];

export const humanChecklist: ReadonlyArray<{ label: string; value: string; href?: string }> = [
  { label: "Install", value: "pnpm install" },
  { label: "Dev server", value: "pnpm dev" },
  { label: "Public demo", value: "/demo", href: "/demo" },
  { label: "Private studio", value: "/studio", href: "/studio" },
  { label: "Overlay (empty)", value: "/obs/overlay?camera=empty" },
  { label: "Overlay (avatar)", value: "/obs/overlay?camera=avatar" },
  { label: "Sidebar", value: "/obs/sidebar" },
  { label: "Bottom bar", value: "/obs/bottom-bar" },
];

export const faqItems = [
  {
    question: "What is Vibe Studio?",
    answer:
      "Vibe Studio is an AI-assisted broadcast graphics workbench for coding livestreams. It prepares editorial overlays, covers, posters and wallpapers while OBS owns the real screen capture.",
  },
  {
    question: "Is the public demo connected to my private stream?",
    answer: "No. Demo mode uses local browser storage and avoids real provider calls, database writes and OBS live-state publishing.",
  },
  {
    question: "Does the AI agent ever auto-apply changes?",
    answer:
      "No. Returned configs open in the JSON review drawer. You apply them manually. The agent never writes directly to OBS, localStorage, the database, or runtime state.",
  },
  {
    question: "Where does my API key go?",
    answer:
      "Only server-side env. The browser sees a configured/not-configured status, never the key itself, and keys are not written to localStorage.",
  },
  {
    question: "Can I still use this as a private studio?",
    answer: "Yes. Open /studio for the full workspace that can connect to server-side AI, database persistence and OBS automation.",
  },
  {
    question: "How do I use it with OBS?",
    answer:
      "Add the OBS routes as browser sources: overlay, sidebar and bottom bar. Place your real screen capture and camera underneath the transparent overlay frame.",
  },
  {
    question: "Where is the real screen capture?",
    answer: "The overlay owns the UI frame. OBS or Livehime owns the real screen/video capture underneath, so layout stays flexible.",
  },
  {
    question: "Can I export the whole broadcast kit?",
    answer: "Yes. The app exports overlay, cover, poster and desktop/mobile wallpaper assets from the same state. Sidebar and bottom-bar sources remain available for OBS workflows, but the public kit focuses on the higher-value shareable assets.",
  },
  {
    question: "Where is the repo?",
    answer: "The public repository is https://github.com/aklmans/vibe-studio.",
  },
  {
    question: "Can an AI Agent set it up for me?",
    answer:
      "Yes. Send the agent to /skill.md first. It is a compact setup guide for installing, running, configuring AI safely and wiring OBS routes.",
  },
];
