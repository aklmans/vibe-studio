import type { Locale } from "../../lib/i18n";

export const MAIN_SITE_URL = "https://aklman.com";
export const GITHUB_URL = "https://github.com/aklmans/vibe-studio";
export const GITHUB_PROFILE_URL = "https://github.com/aklmans";
export const X_URL = "https://x.com/aklman2018";
export const RSS_URL = "https://aklman.com/rss.xml";

// ─── Landing locale + theme persistence keys ───────────────────────────────
// These are deliberately separate from the Studio's overlay-state key so that
// landing page preferences (language, theme) never leak into the Studio's
// OverlayState / localStorage shape, and vice versa.
export const LANDING_LOCALE_KEY = "vibe-landing-locale";
export const LANDING_THEME_KEY = "vibe-landing-theme";
export type LandingTheme = "dark" | "light";

// ─── Static (locale-independent) data ──────────────────────────────────────

export type SurfaceKind = "wide" | "tall" | "strip" | "gallery";

export interface ThemedImageSource {
  darkSrc: string;
  lightSrc: string;
}

export interface ProductImageSource extends ThemedImageSource {
  alt: string;
  width: number;
  height: number;
}

export interface SurfaceGalleryImage extends ProductImageSource {
  label: string;
}

export interface SurfaceCard {
  id: string;
  kind: SurfaceKind;
  title: string;
  summary: string;
  points: string[];
  image?: ProductImageSource;
  gallery?: ReadonlyArray<SurfaceGalleryImage>;
}

export interface AgentTask {
  id: string;
  label: string;
  prompt: string;
}

export function imageSrcForTheme(image: ThemedImageSource, theme: LandingTheme): string {
  return theme === "light" ? image.lightSrc : image.darkSrc;
}

// Gallery images are locale-aware: alt text and labels differ between zh/en.
// The numeric dimensions stay the same.
function galleryImagesForLocale(locale: Locale): ReadonlyArray<SurfaceGalleryImage> {
  if (locale === "zh") {
    return [
      {
        darkSrc: "/product/vibe-coding-overlay-dark.png",
        lightSrc: "/product/vibe-coding-overlay-light.png",
        alt: "Vibe Studio 合成画面导出",
        width: 1920,
        height: 1080,
        label: "合成画面 · 1920×1080",
      },
      {
        darkSrc: "/product/vibe-coding-cover-dark.png",
        lightSrc: "/product/vibe-coding-cover-light.png",
        alt: "Vibe Studio 封面导出",
        width: 1280,
        height: 720,
        label: "封面 · 1280×720",
      },
      {
        darkSrc: "/product/vibe-coding-poster-dark.png",
        lightSrc: "/product/vibe-coding-poster-light.png",
        alt: "Vibe Studio 海报导出",
        width: 1920,
        height: 1080,
        label: "海报 · 1920×1080",
      },
      {
        darkSrc: "/product/vibe-coding-wallpaper-desktop-4k-dark.png",
        lightSrc: "/product/vibe-coding-wallpaper-desktop-4k-light.png",
        alt: "Vibe Studio 桌面壁纸导出（4K）",
        width: 3840,
        height: 2160,
        label: "壁纸 · 3840×2160",
      },
    ];
  }
  return [
    {
      darkSrc: "/product/vibe-coding-overlay-dark.png",
      lightSrc: "/product/vibe-coding-overlay-light.png",
      alt: "Vibe Studio overlay export",
      width: 1920,
      height: 1080,
      label: "Overlay · 1920×1080",
    },
    {
      darkSrc: "/product/vibe-coding-cover-dark.png",
      lightSrc: "/product/vibe-coding-cover-light.png",
      alt: "Vibe Studio cover export",
      width: 1280,
      height: 720,
      label: "Cover · 1280×720",
    },
    {
      darkSrc: "/product/vibe-coding-poster-dark.png",
      lightSrc: "/product/vibe-coding-poster-light.png",
      alt: "Vibe Studio poster export",
      width: 1920,
      height: 1080,
      label: "Poster · 1920×1080",
    },
    {
      darkSrc: "/product/vibe-coding-wallpaper-desktop-4k-dark.png",
      lightSrc: "/product/vibe-coding-wallpaper-desktop-4k-light.png",
      alt: "Vibe Studio desktop wallpaper export (4K)",
      width: 3840,
      height: 2160,
      label: "Wallpaper · 3840×2160",
    },
  ];
}

// ─── Bilingual content ─────────────────────────────────────────────────────

export interface LandingContent {
  // Header
  brand: string;
  nav: ReadonlyArray<{ label: string; href: string }>;
  mobileNav: ReadonlyArray<{ label: string; href: string }>;
  mainSiteLabel: string;
  menuLabel: string;
  langToggleLabel: string;
  themeToggleLabel: string;

  // Hero
  wordmark: string;
  eyebrow: string;
  h1: string;
  lede: string;
  tryDemo: string;
  openStudio: string;
  copyAgentPrompt: string;
  heroChips: string[];
  heroNote: string;
  heroStudioLink: string;
  viewGithub: string;

  // Showcase
  showcaseImage: ProductImageSource;
  showcaseAlt: string;
  showcaseLabel: string;

  // Features
  featuresEyebrow: string;
  featuresTitle: string;
  features: ReadonlyArray<{ title: string; copy: string }>;

  // Surfaces / Studio system
  surfacesEyebrow: string;
  surfacesTitle: string;
  surfacesIntro: string;
  surfacesAriaLabel: string;
  surfacePanelEyebrow: string;
  surfaceCards: ReadonlyArray<SurfaceCard>;
  galleryCarouselLabel: string;
  galleryControlsLabel: string;
  galleryPrevLabel: string;
  galleryNextLabel: string;

  // Agent section
  agentEyebrow: string;
  agentTitle: string;
  agentLede: string;
  agentSkillNote: string;
  agentFlow: ReadonlyArray<{ step: string; title: string; copy: string }>;
  agentSafety: string[];
  agentProviders: string;

  // Get Started
  getStartedEyebrow: string;
  getStartedTitle: string;
  getStartedLede: string;
  agentTabLabel: string;
  humanTabLabel: string;
  agentTasksLabel: string;
  copyPromptLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
  agentSetupPrompt: string;
  agentTasks: ReadonlyArray<AgentTask>;
  humanChecklist: ReadonlyArray<{ label: string; value: string; href?: string }>;
  readmeGithub: string;

  // FAQ
  faqTitle: string;
  faqItems: ReadonlyArray<{ question: string; answer: string }>;

  // Footer
  footerBrand: string;
}

const enContent: LandingContent = {
  brand: "Aklman",
  nav: [
    { label: "Features", href: "#features" },
    { label: "Studio system", href: "#surfaces" },
    { label: "Agent", href: "#agent" },
    { label: "Get started", href: "#get-started" },
    { label: "GitHub", href: GITHUB_URL },
  ],
  mobileNav: [
    { label: "Features", href: "#features" },
    { label: "Studio system", href: "#surfaces" },
    { label: "Agent", href: "#agent" },
    { label: "Get started", href: "#get-started" },
    { label: "GitHub", href: GITHUB_URL },
    { label: "Main site", href: MAIN_SITE_URL },
  ],
  mainSiteLabel: "Main site",
  menuLabel: "Menu",
  langToggleLabel: "中文",
  themeToggleLabel: "Light theme",

  wordmark: "Vibe Coding Live",
  eyebrow: "Live visual workbench",
  h1: "Designed live graphics without fighting OBS",
  lede: "For Study With Me, Coding With Me, Build in Public, Vibe Coding, gaming, chat and co-working streams. Pick a scene layout — coding workbench, lecture with a presenter card, or vertical mobile — run the show from a timed agenda, keep real captures in OBS or Livehime, and let the Agent draft session copy for review.",
  tryDemo: "Try Demo",
  openStudio: "Open Studio",
  copyAgentPrompt: "Copy agent prompt",
  heroChips: ["4 scene layouts", "Run-of-show driven", "AI drafts · you apply"],
  heroNote: "Try the live agent in the demo — nothing applies until you review it. Private studio at",
  heroStudioLink: "/studio",
  viewGithub: "View on GitHub",

  showcaseImage: {
    darkSrc: "/product/obs-main-screen-dark.png",
    lightSrc: "/product/obs-main-screen-light.png",
    alt: "Vibe Studio OBS composition with the main screen capture under the overlay frame",
    width: 1174,
    height: 660,
  },
  showcaseAlt: "Vibe Studio OBS composition with main-screen capture",
  showcaseLabel: "OBS composition · main screen",

  featuresEyebrow: "Features",
  featuresTitle: "Why stop hand-building live scenes",
  features: [
    {
      title: "Designed live-room frame, four scene layouts",
      copy: "Pick the coding workbench, a lecture frame (left or right presenter column) or a vertical 1080×1920 mobile frame. Each is a transparent editorial frame — screen, camera, game, browser or chat captures stay underneath in OBS or Livehime, and every layout keeps its own agenda and bottom bar.",
    },
    {
      title: "A run of show that drives the picture",
      copy: "Sections carry planned minutes and optional per-section speakers. Drive the agenda live from the broadcast console, check finished sections off by hand, and the lecture card introduces whoever is speaking now. Preparing the next stream keeps your brand and clears the content.",
    },
    {
      title: "Session Config Agent",
      copy: "Describe today's stream — the Agent drafts the title, subtitle, timed sections, stack and topic badges in the language of your brief. You review the field-level diff and apply with one click; nothing changes until you do.",
    },
    {
      title: "Local-first Studio",
      copy: "Try the agent live in the public demo — it drafts, you review and apply, and it never touches a database or your OBS. Run the private Studio locally, in Docker, or self-hosted with your own env API key; the repo ships the deploy recipes.",
    },
  ],

  surfacesEyebrow: "Studio system",
  surfacesTitle: "From one stream idea to a designed live room",
  surfacesIntro: "One session config flows through the useful parts: Agent draft, JSON review, OBS-friendly browser sources, and aligned public assets.",
  surfacesAriaLabel: "Live studio system",
  surfacePanelEyebrow: "Studio layer",
  surfaceCards: [
    {
      id: "prepare",
      kind: "wide",
      title: "Prepare with Agent",
      image: {
        darkSrc: "/product/agent-proposal-dark.png",
        lightSrc: "/product/agent-proposal-light.png",
        alt: "Vibe Studio Session Config agent returning a reviewed proposal",
        width: 3960,
        height: 2128,
      },
      summary: "Describe a study session, coding hangout, lecture or chat show in plain language. The Agent drafts the title, subtitle, timed sections, stack and topic badges — in the language of your brief, no manual form filling.",
      points: [
        "Natural-language brief becomes structured stream content, in your brief's language",
        "Sections carry planned minutes — and optional per-section speakers for lectures",
        "Your brand — avatar, socials, theme — stays fixed; the agent only drafts content",
      ],
    },
    {
      id: "review",
      kind: "wide",
      title: "Review safely",
      image: {
        darkSrc: "/product/json-drawer-review-dark.png",
        lightSrc: "/product/json-drawer-review-light.png",
        alt: "Vibe Studio JSON review drawer with a proposal staged for manual apply",
        width: 3960,
        height: 2128,
      },
      summary: "AI output is never auto-applied. The proposal opens in a JSON review drawer with a field-level diff. You inspect, then Apply — or discard.",
      points: [
        "Proposal enters a review drawer, never live state",
        "Field-level diff before any change is applied",
        "The agent never writes directly to OBS, DB, localStorage or runtime state",
      ],
    },
    {
      id: "compose",
      kind: "wide",
      title: "Compose in OBS",
      image: {
        darkSrc: "/product/obs-main-screen-dark.png",
        lightSrc: "/product/obs-main-screen-light.png",
        alt: "OBS-style broadcast composition with the real capture under the Vibe Studio frame",
        width: 1174,
        height: 660,
      },
      summary: "Vibe Studio owns only the transparent editorial frame — pick workbench, lecture or vertical and the OBS slots follow. Real screen capture, camera, game windows, browser tabs and chat stay free underneath in OBS or Livehime.",
      points: [
        "Four scene layouts: workbench, lecture · left/right, vertical 1080×1920",
        "Screen, camera, game and chat captures stay in OBS where they belong",
        "Online demo cannot push to OBS; the local Studio can drive your local scene",
      ],
    },
    {
      id: "export",
      kind: "gallery",
      title: "Export the kit",
      summary: "One session config drives the high-value public assets: overlay, cover, poster and desktop/mobile wallpapers. Export All keeps the whole package visually aligned.",
      points: [
        "Overlay, cover, poster and wallpapers from one state",
        "Files are named after your stream — title, surface, date",
        "Export All for the whole package before you go live",
      ],
      gallery: galleryImagesForLocale("en"),
    },
  ],
  galleryCarouselLabel: "Export asset carousel",
  galleryControlsLabel: "Export asset controls",
  galleryPrevLabel: "Previous export asset",
  galleryNextLabel: "Next export asset",

  agentEyebrow: "Agent-assisted session prep",
  agentTitle: "AI prepares. You review. OBS renders.",
  agentLede: "The Session Config Agent drafts a live-session config from your brief — study plan, coding outline, game goals, chat topics, or co-working notes. You read the proposal, inspect the diff, and apply it only when it looks right. OBS then renders the browser sources while the real capture stays underneath.",
  agentSkillNote: "For AI setup, send your agent to /skill.md.",
  agentFlow: [
    {
      step: "01",
      title: "Agent drafts a session config",
      copy: "Describe the stream. The agent returns proposed content — title, subtitle, timed sections, stack, badges — in your brief's language, as JSON you can read.",
    },
    {
      step: "02",
      title: "Human reviews and applies",
      copy: "The proposal shows a field-level diff with a one-click Apply; the JSON review drawer stays as the advanced path. Nothing is auto-applied.",
    },
    {
      step: "03",
      title: "OBS renders browser sources",
      copy: "The overlay, sidebar and bottom bar render as clean browser sources. OBS or Livehime owns the real capture below the frame.",
    },
  ],
  agentSafety: [
    "AI output is never auto-applied. A returned config opens in the JSON review drawer, exactly like Import.",
    "Try the agent live in the demo: the key stays on the server, the demo never asks for yours, and it can't touch your OBS or database.",
  ],
  agentProviders: "Works with any OpenAI-compatible provider — DeepSeek, OpenAI, Kimi, z.ai and others — configured in your local/private Studio env. No key configured? The agent falls back to a local copy handoff.",

  getStartedEyebrow: "Get started",
  getStartedTitle: "Run it in five minutes — or hand it to your agent.",
  getStartedLede: "Clone, pnpm dev, paste four browser sources into OBS — the README walks it on any OS, and the first-run wizard makes the studio yours in three steps. Docker and deploy recipes ship in the repo. Prefer delegation? The agent handoff is one copy away. The public demo stays browser-local and cannot touch your OBS.",
  agentTabLabel: "I'm an Agent",
  humanTabLabel: "I'm a Human",
  agentTasksLabel: "Agent tasks",
  copyPromptLabel: "Copy prompt",
  copiedLabel: "Copied",
  copyFailedLabel: "Copy failed — select the prompt manually.",
  agentSetupPrompt: `Read /skill.md first.
Then help me set up Vibe Studio (Vibe Coding Live) from the repository:
https://github.com/aklmans/vibe-studio

Open or clone the repo, then read AGENTS.md and README.md.
Use pnpm install and pnpm dev.
Start with the safe public demo at /demo, then explain when to use the private studio at /studio.

If I ask for AI setup, configure provider values only through local/private Studio env. Never expose API keys,
never put keys in browser code or localStorage, and never log them.

If AI generates a live-session config, do not auto-apply it. Use the JSON review/apply path so I can inspect and apply manually.
Keep OBS, database, runtime state and localStorage unchanged unless I explicitly ask. The public demo cannot push to OBS.`,
  agentTasks: [
    {
      id: "run-demo",
      label: "Run local demo",
      prompt: `Read /skill.md first.
Then help me run the Vibe Studio local demo from https://github.com/aklmans/vibe-studio.
Use pnpm. Check AGENTS.md and README.md for install and dev commands.
The public demo is at /demo — browser-local state, no database writes, no OBS control.
Start the dev server and open /demo to confirm it loads.`,
    },
    {
      id: "configure-ai",
      label: "Configure AI provider",
      prompt: `Read /skill.md first.
Then help me configure the Session Config Agent for Vibe Studio.
Check AGENTS.md and README.md for the Session Config Agent section.
The agent uses an OpenAI-compatible Chat Completions adapter — set these in your local/private .env.local (never committed):
  SESSION_AGENT_PROVIDER, SESSION_AGENT_BASE_URL, SESSION_AGENT_API_KEY, SESSION_AGENT_MODEL, SESSION_AGENT_USER_AGENT
The API key stays in your local/private Studio env — never expose API keys, never put them in the client bundle, localStorage, or logs.
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
Place real screen capture, camera, game windows, browser tabs or chat underneath the overlay frame. The overlay owns only the UI frame, not the real capture. Public hosted demos cannot push into your local OBS.`,
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
  ],
  humanChecklist: [
    { label: "Install", value: "pnpm install" },
    { label: "Dev server", value: "pnpm dev" },
    { label: "Docker", value: "docker compose up" },
    { label: "Deploy guide", value: "docs/deploy.md" },
    { label: "Public demo", value: "/demo", href: "/demo" },
    { label: "Private studio", value: "/studio", href: "/studio" },
    { label: "Overlay (empty)", value: "/obs/overlay?camera=empty" },
    { label: "Overlay (avatar)", value: "/obs/overlay?camera=avatar" },
    { label: "Sidebar", value: "/obs/sidebar" },
    { label: "Bottom bar", value: "/obs/bottom-bar" },
  ],
  readmeGithub: "README on GitHub →",

  faqTitle: "FAQ",
  faqItems: [
    {
      question: "What is Vibe Studio?",
      answer: "Vibe Studio is an AI-assisted live-graphics workbench for people who want a designed stream without rebuilding everything in OBS. It prepares editorial overlays, covers, posters and wallpapers while OBS or Livehime owns the real capture.",
    },
    {
      question: "Is it only for coding streams?",
      answer: "No. It works for Study With Me, Coding With Me, Build in Public, Vibe Coding, gaming, chat, co-working and other with-me formats — and the lecture layouts carry a presenter card with a run of show, so structured talks and online classes fit too.",
    },
    {
      question: "What scene layouts are there?",
      answer: "Four: the coding workbench, lecture · left and lecture · right (a presenter column with the camera, the speaker's card and the run of show beside a 16:9 slides region), and a vertical 1080×1920 mobile frame. Each layout keeps its own agenda and bottom bar; sections can introduce per-section guest speakers on the lecture card.",
    },
    {
      question: "Do I re-enter everything for the next stream?",
      answer: "No. The first-run wizard writes your name, avatar and socials into the Brand layer once. 'Prepare next session' clears the per-stream content — title, agendas, stack — while keeping your brand, layout, theme and bottom bars.",
    },
    {
      question: "Is the public demo connected to my private stream?",
      answer: "No. The demo keeps its state in your browser and never writes to a database, publishes OBS live-state, or collects your API key — it can't touch your stream. On the hosted showcase it can run the agent against the site's own configured provider (rate-limited), never yours.",
    },
    {
      question: "Does the AI agent ever auto-apply changes?",
      answer: "No. Returned configs open in the JSON review drawer. You apply them manually. The agent never writes directly to OBS, localStorage, the database, or runtime state.",
    },
    {
      question: "Where does my API key go?",
      answer: "Your API key belongs in your local/private Studio env, usually .env.local. The public demo never asks for your key, the browser only sees configured/not-configured status, and keys are not written to localStorage.",
    },
    {
      question: "Can I still use this as a private studio?",
      answer: "Yes. Open /studio for the full local/private workspace. It can use your configured AI provider, optional database persistence and local OBS automation; a public hosted demo cannot push to your OBS.",
    },
    {
      question: "How do I use it with OBS?",
      answer: "Add the OBS routes as browser sources: overlay, sidebar and bottom bar — the README has a five-minute manual tutorial that works on any OS (the macOS one-command automation is documented separately). Place your real screen capture and camera underneath the transparent overlay frame.",
    },
    {
      question: "Where is the real screen capture?",
      answer: "The overlay owns the UI frame. OBS or Livehime owns the real screen/video capture underneath, so layout stays flexible.",
    },
    {
      question: "Can I export the whole broadcast kit?",
      answer: "Yes. Export overlay, cover, poster and desktop/mobile wallpapers from one state. Export All does the whole package in one action.",
    },
    {
      question: "Where is the repo?",
      answer: "The public repository is https://github.com/aklmans/vibe-studio.",
    },
    {
      question: "Can an AI Agent set it up for me?",
      answer: "Yes. Send the agent to /skill.md first. It is a compact setup guide for installing, running, configuring AI safely and wiring OBS routes.",
    },
  ],

  footerBrand: "Aklman · 2026",
};

const zhContent: LandingContent = {
  brand: "Aklman",
  nav: [
    { label: "功能", href: "#features" },
    { label: "工作室系统", href: "#surfaces" },
    { label: "Agent", href: "#agent" },
    { label: "开始使用", href: "#get-started" },
    { label: "GitHub", href: GITHUB_URL },
  ],
  mobileNav: [
    { label: "功能", href: "#features" },
    { label: "工作室系统", href: "#surfaces" },
    { label: "Agent", href: "#agent" },
    { label: "开始使用", href: "#get-started" },
    { label: "GitHub", href: GITHUB_URL },
    { label: "主站", href: MAIN_SITE_URL },
  ],
  mainSiteLabel: "主站",
  menuLabel: "菜单",
  langToggleLabel: "EN",
  themeToggleLabel: "浅色主题",

  wordmark: "Vibe Coding Live",
  eyebrow: "直播画面工作台",
  h1: "不用和 OBS 较劲，也能有好看的直播画面",
  lede: "适合 Study With Me、Coding With Me、Build in Public、Vibe Coding、一起打游戏、聊天互动和线上共学。选一个场景布局——编程工作台、带讲师卡的讲座、或手机竖屏——用带时长的议程推进直播，真实捕获仍留在 OBS 或直播姬；Agent 帮你草拟本场文案，由你确认后生效。",
  tryDemo: "体验 Demo",
  openStudio: "打开 Studio",
  copyAgentPrompt: "复制 Agent 提示词",
  heroChips: ["四种场景布局", "议程驱动画面", "AI 起草 · 你确认"],
  heroNote: "在 Demo 里试用实时 Agent —— 你确认前不会生效。私有工作台地址",
  heroStudioLink: "/studio",
  viewGithub: "在 GitHub 查看",

  showcaseImage: {
    darkSrc: "/product/obs-main-screen-dark.png",
    lightSrc: "/product/obs-main-screen-light.png",
    alt: "Vibe Studio 在 OBS 中叠加主屏幕捕获的合成画面",
    width: 1174,
    height: 660,
  },
  showcaseAlt: "Vibe Studio OBS 主屏幕合成画面",
  showcaseLabel: "OBS 合成 · 主屏幕",

  featuresEyebrow: "功能",
  featuresTitle: "为什么不用再手搓直播场景",
  features: [
    {
      title: "好看的画面框架，四种场景布局",
      copy: "编程工作台、讲座框架（讲师列居左或居右）、竖屏 1080×1920 手机框架任选。每一种都是透明的编辑部风格框架——屏幕、摄像头、游戏窗口、浏览器或聊天区仍在 OBS / 直播姬底层，且每个布局拥有自己独立的议程与底栏。",
    },
    {
      title: "议程驱动直播画面",
      copy: "每节可设计划分钟数、可选每节讲者。直播中在推进台切换当前节、讲完的手动打勾，讲师卡自动介绍正在发言的嘉宾。第二天再播,「准备下一场」保住品牌、清空内容。",
    },
    {
      title: "Session Config Agent",
      copy: "描述今天要直播什么，Agent 用你描述的语言草拟标题、副标题、带时长的章节、工具栈与话题徽标。你审阅字段级 diff 后一键应用——你确认前什么都不会变。",
    },
    {
      title: "本地优先的 Studio",
      copy: "在公开 Demo 里就能试用实时 Agent——它起草、你审阅、你应用，全程不写数据库、也不碰你的 OBS。私有 Studio 可本地、Docker 或自托管运行，用你自己的 API key；部署配方随仓库提供。",
    },
  ],

  surfacesEyebrow: "工作室系统",
  surfacesTitle: "从一个直播想法到有设计感的直播间",
  surfacesIntro: "一份 session config 贯穿真正有价值的部分：Agent 草稿、JSON 审阅、OBS 友好的浏览器源，以及统一的公开视觉资产。",
  surfacesAriaLabel: "直播工作室系统",
  surfacePanelEyebrow: "工作台层级",
  surfaceCards: [
    {
      id: "prepare",
      kind: "wide",
      title: "Agent 准备",
      image: {
        darkSrc: "/product/agent-proposal-dark.png",
        lightSrc: "/product/agent-proposal-light.png",
        alt: "Vibe Studio Session Config Agent 返回审阅提案",
        width: 3960,
        height: 2128,
      },
      summary: "用自然语言描述一场共学、编程、讲座或聊天直播，Session Config Agent 用你描述的语言生成标题、副标题、带时长的章节、工具栈与话题徽标——无需手工填表。",
      points: [
        "自然语言描述转为结构化直播内容，语言跟随你的描述",
        "每节自带计划分钟数——讲座还可以给每节配讲者",
        "品牌(头像、社交、主题)保持不变，Agent 只草拟内容",
      ],
    },
    {
      id: "review",
      kind: "wide",
      title: "安全确认",
      image: {
        darkSrc: "/product/json-drawer-review-dark.png",
        lightSrc: "/product/json-drawer-review-light.png",
        alt: "Vibe Studio JSON 审阅抽屉，提案等待手动应用",
        width: 3960,
        height: 2128,
      },
      summary: "AI 不直接修改直播状态。提案进入 JSON 审阅抽屉，显示字段级 diff，由人工确认后生效。",
      points: [
        "提案进入审阅抽屉，不直接改直播状态",
        "应用前可见字段级 diff",
        "Agent 不直接写入 OBS、数据库、localStorage 或运行时状态",
      ],
    },
    {
      id: "compose",
      kind: "wide",
      title: "OBS 合成",
      image: {
        darkSrc: "/product/obs-main-screen-dark.png",
        lightSrc: "/product/obs-main-screen-light.png",
        alt: "OBS 式直播合成，真实捕获在 Vibe Studio 框架之下",
        width: 1174,
        height: 660,
      },
      summary: "Vibe Studio 只负责透明画面框架——工作台、讲座、竖屏任选，OBS 槽位随布局走。真实屏幕捕获、摄像头、游戏窗口、浏览器和聊天区保留在 OBS 或直播姬底层自由摆放。",
      points: [
        "四种场景布局：工作台、讲座 · 左/右、竖屏 1080×1920",
        "屏幕、摄像头、游戏和聊天捕获留在 OBS 底层",
        "线上 Demo 不能推送到 OBS；本地 Studio 才能驱动本机场景",
      ],
    },
    {
      id: "export",
      kind: "gallery",
      title: "导出资产",
      summary: "一份 session config 驱动高价值公开资产：合成画面、封面、海报与桌面/手机壁纸。Export All 保持整套视觉一致。",
      points: [
        "合成画面、封面、海报、壁纸来自同一状态",
        "文件以你的直播命名——标题 · 面 · 日期",
        "开播前 Export All 一次导出整套",
      ],
      gallery: galleryImagesForLocale("zh"),
    },
  ],
  galleryCarouselLabel: "导出资产轮播",
  galleryControlsLabel: "导出资产控制",
  galleryPrevLabel: "上一张导出资产",
  galleryNextLabel: "下一张导出资产",

  agentEyebrow: "Agent 辅助直播准备",
  agentTitle: "AI 准备 · 人工确认 · OBS 渲染",
  agentLede: "Session Config Agent 根据你的描述生成直播配置——学习计划、编程提纲、游戏目标、聊天主题或共学笔记都可以。你阅读提案、检查 diff，确认后再应用。OBS 渲染浏览器源，真实捕获留在底层。",
  agentSkillNote: "让 AI Agent 先读 /skill.md，它会按项目约定安装、运行和配置。",
  agentFlow: [
    {
      step: "01",
      title: "Agent 生成直播配置",
      copy: "描述直播内容，Agent 用你描述的语言返回提案——标题、副标题、带时长的章节、工具栈、徽标——以 JSON 格式呈现。",
    },
    {
      step: "02",
      title: "人工确认并应用",
      copy: "提案显示字段级 diff，确认后一键应用；JSON 审阅抽屉保留为高级路径。AI 不直接修改直播状态。",
    },
    {
      step: "03",
      title: "OBS 渲染浏览器源",
      copy: "合成画面、侧栏与底栏渲染为干净的浏览器源。OBS 或直播姬负责框架下方的真实捕获。",
    },
  ],
  agentSafety: [
    "AI 不直接修改直播状态。生成的配置需要进入 JSON 审阅抽屉人工确认，与 Import 完全一致。",
    "在 Demo 里就能试用实时 Agent：key 只在服务器端，Demo 不会索要你的 key，也碰不到你的 OBS 或数据库。",
  ],
  agentProviders: "兼容任何 OpenAI 兼容 provider——DeepSeek、OpenAI、Kimi、z.ai 等——通过本地/私有 Studio 环境变量配置。未配置 key？Agent 回退到本地复制交接。生成的配置需人工确认后生效。",

  getStartedEyebrow: "开始使用",
  getStartedTitle: "五分钟自己跑起来，或交给你的 Agent",
  getStartedLede: "克隆、pnpm dev、把四条浏览器源贴进 OBS——README 有任意系统可用的五分钟教程，首启向导三步把工作台变成你的。Docker 与部署配方随仓库提供。更想委托？Agent 交接一键复制。公开 Demo 只在浏览器本地运行，不能触碰你的 OBS。",
  agentTabLabel: "我是 Agent",
  humanTabLabel: "我是人类",
  agentTasksLabel: "Agent 任务",
  copyPromptLabel: "复制提示词",
  copiedLabel: "已复制",
  copyFailedLabel: "复制失败——请手动选择提示词。",
  agentSetupPrompt: `先读 /skill.md。
然后帮我从仓库安装 Vibe Studio（Vibe Coding Live）：
https://github.com/aklmans/vibe-studio

打开或克隆仓库，然后读 AGENTS.md 和 README.md。
用 pnpm install 和 pnpm dev。
先从安全的公开 Demo（/demo）开始，然后说明何时使用私有 Studio（/studio）。

如果需要配置 AI，只通过本地/私有 Studio 环境变量配置 provider 值。不要暴露 API key，
不要把 key 放在浏览器代码或 localStorage，不要记录 key。

如果 AI 生成了 live-session config，不要自动应用。使用 JSON 审阅/应用路径，让我检查后手动应用。
除非我明确要求，不要改变 OBS、数据库、运行时状态和 localStorage。公开 Demo 不能推送到 OBS。`,
  agentTasks: [
    {
      id: "run-demo",
      label: "运行本地 Demo",
      prompt: `先读 /skill.md。
然后帮我从 https://github.com/aklmans/vibe-studio 运行 Vibe Studio 本地 Demo。
用 pnpm。查 AGENTS.md 和 README.md 的安装和 dev 命令。
公开 Demo 在 /demo——浏览器本地状态、无数据库写入、无 OBS 控制。
启动 dev server 并打开 /demo 确认加载。`,
    },
    {
      id: "configure-ai",
      label: "配置 AI provider",
      prompt: `先读 /skill.md。
然后帮我配置 Vibe Studio 的 Session Config Agent。
查 AGENTS.md 和 README.md 的 Session Config Agent 部分。
Agent 使用 OpenAI 兼容 Chat Completions 适配器——在本地/私有 .env.local 设置（不要提交）：
  SESSION_AGENT_PROVIDER, SESSION_AGENT_BASE_URL, SESSION_AGENT_API_KEY, SESSION_AGENT_MODEL, SESSION_AGENT_USER_AGENT
API key 仅存于本地/私有 Studio 环境——不要暴露 API key，不要放入客户端 bundle、localStorage 或日志。
未配置 key？Agent 回退到本地复制交接。生成的配置需人工确认后生效；使用 JSON 审阅/应用。`,
    },
    {
      id: "prepare-obs",
      label: "准备 OBS 源",
      prompt: `先读 /skill.md。
然后帮我为 Vibe Studio 设置 OBS 浏览器源。
查 AGENTS.md 和 README.md 的 OBS 设置部分。
在 OBS（或通过 OBS 虚拟摄像头的直播姬）添加这些浏览器源：
  /obs/overlay?camera=empty  — 透明主画面框架，空摄像头位
  /obs/overlay?camera=avatar — 同框架，头像摄像头位
  /obs/sidebar               — 实时侧栏面板
  /obs/bottom-bar            — 直播元数据条
将真实屏幕捕获、摄像头、游戏窗口、浏览器或聊天区放在 overlay 框架下方。Overlay 只负责 UI 框架，不负责真实捕获。公开托管 Demo 不能推送到你的本地 OBS。`,
    },
    {
      id: "understand-project",
      label: "了解项目",
      prompt: `先读 /skill.md。
然后读这个仓库，给我一个简洁的 Vibe Studio / Vibe Coding Live 架构摘要。
查 AGENTS.md、README.md 和 DESIGN_LANGUAGE.md。
覆盖：App Router 入口（/、/demo、/studio、/obs/*）、构建器 shell、离屏导出架构、
Session Config Agent 边界（服务器端 key、审阅/应用、不自动应用）和 OBS 浏览器源流程。
控制在 300 字以内。`,
    },
  ],
  humanChecklist: [
    { label: "安装", value: "pnpm install" },
    { label: "开发服务器", value: "pnpm dev" },
    { label: "Docker", value: "docker compose up" },
    { label: "部署指南", value: "docs/deploy.md" },
    { label: "公开 Demo", value: "/demo", href: "/demo" },
    { label: "私有 Studio", value: "/studio", href: "/studio" },
    { label: "合成画面（空）", value: "/obs/overlay?camera=empty" },
    { label: "合成画面（头像）", value: "/obs/overlay?camera=avatar" },
    { label: "侧栏", value: "/obs/sidebar" },
    { label: "底栏", value: "/obs/bottom-bar" },
  ],
  readmeGithub: "在 GitHub 阅读 README →",

  faqTitle: "常见问题",
  faqItems: [
    {
      question: "Vibe Studio 是什么？",
      answer: "Vibe Studio 是一个 AI 辅助的直播画面工作台，适合想要好看直播间但不想在 OBS 里手搓复杂场景的人。它准备透明画面框架、封面、海报与壁纸，OBS 或直播姬负责真实捕获。",
    },
    {
      question: "它只适合编程直播吗？",
      answer: "不是。Study With Me、Coding With Me、Build in Public、Vibe Coding、一起打游戏、聊天互动、线上共学都可以用——讲座布局自带讲师卡与流程清单，结构化分享和线上公开课同样合适。",
    },
    {
      question: "有哪些场景布局？",
      answer: "四种：编程工作台、讲座 · 左 / 讲座 · 右（讲师列包含摄像头、讲者卡与流程清单，配 16:9 幻灯片区）、以及竖屏 1080×1920 手机框架。每个布局拥有独立的议程与底栏；讲座的每一节还可以配自己的讲者，讲师卡会自动介绍当前发言人。",
    },
    {
      question: "第二天再播要重新配一遍吗？",
      answer: "不用。首启向导会把名字、头像、社交写入品牌层，只需一次。「准备下一场」清空本场内容——标题、议程、工具栈——同时保住品牌、布局、主题与底栏。",
    },
    {
      question: "公开 Demo 连着我的私有直播吗？",
      answer: "不。Demo 把状态存在你的浏览器里，不写数据库、不发布 OBS 实时状态、也不索取你的 API key —— 碰不到你的直播。在托管展示站上，它用的是站点自己配置的 provider（有限流），永远不是你的。",
    },
    {
      question: "AI Agent 会自动修改直播状态吗？",
      answer: "不会。返回的配置进入 JSON 审阅抽屉，由人工确认后生效。Agent 不直接写入 OBS、localStorage、数据库或运行时状态。",
    },
    {
      question: "我的 API key 存在哪里？",
      answer: "API key 属于你的本地/私有 Studio 环境，通常写在 .env.local。公开 Demo 不会索要 key；浏览器只看到已配置/未配置状态，key 不会写入 localStorage。",
    },
    {
      question: "我可以把它当私有 Studio 用吗？",
      answer: "可以。打开 /studio 进入完整的本地/私有工作台，可连接你配置的 AI provider、可选数据库持久化与本地 OBS 自动化；公开托管 Demo 不能推送到你的 OBS。",
    },
    {
      question: "如何配合 OBS 使用？",
      answer: "将 OBS 路由添加为浏览器源：合成画面、侧栏与底栏——README 有任意系统可用的五分钟手动教程（macOS 一键自动化另有文档）。将真实屏幕捕获和摄像头放在透明 overlay 框架下方。",
    },
    {
      question: "真实屏幕捕获在哪里？",
      answer: "Overlay 负责框架。OBS 或直播姬负责底层真实屏幕/视频捕获，布局保持灵活。",
    },
    {
      question: "可以导出整套直播资产吗？",
      answer: "可以。一份状态可导出合成画面、封面、海报以及桌面 / 手机壁纸。Export All 会一次生成整套公开视觉资产。",
    },
    {
      question: "仓库在哪里？",
      answer: "公开仓库地址：https://github.com/aklmans/vibe-studio。",
    },
    {
      question: "AI Agent 能帮我安装吗？",
      answer: "可以。先让 Agent 读 /skill.md，它是一份简洁的安装、运行、安全配置 AI 与接入 OBS 路由的指南。",
    },
  ],

  footerBrand: "Aklman · 2026",
};

const contentByLocale: Record<Locale, LandingContent> = {
  en: enContent,
  zh: zhContent,
};

export function getLandingContent(locale: Locale): LandingContent {
  return contentByLocale[locale] ?? enContent;
}

export const DEFAULT_LOCALE: Locale = "en";
