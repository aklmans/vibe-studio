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

export interface AgentTask {
  id: string;
  label: string;
  prompt: string;
}

// Gallery images are locale-aware: alt text and labels differ between zh/en.
// The numeric dimensions stay the same.
function galleryImagesForLocale(locale: Locale): ReadonlyArray<SurfaceGalleryImage> {
  if (locale === "zh") {
    return [
      {
        src: "/product/vibe-coding-overlay-dark.png",
        alt: "Vibe Studio 合成画面导出（深色主题）",
        width: 1920,
        height: 1080,
        label: "合成画面 · 1920×1080",
      },
      {
        src: "/product/vibe-coding-cover-dark.png",
        alt: "Vibe Studio 封面导出（深色主题）",
        width: 1280,
        height: 720,
        label: "封面 · 1280×720",
      },
      {
        src: "/product/vibe-coding-poster-dark.png",
        alt: "Vibe Studio 海报导出（深色主题）",
        width: 1920,
        height: 1080,
        label: "海报 · 1920×1080",
      },
      {
        src: "/product/vibe-coding-wallpaper-desktop-4k-dark.png",
        alt: "Vibe Studio 桌面壁纸导出（深色主题，4K）",
        width: 3840,
        height: 2160,
        label: "壁纸 · 3840×2160",
      },
    ];
  }
  return [
    {
      src: "/product/vibe-coding-overlay-dark.png",
      alt: "Vibe Studio overlay export (dark theme)",
      width: 1920,
      height: 1080,
      label: "Overlay · 1920×1080",
    },
    {
      src: "/product/vibe-coding-cover-dark.png",
      alt: "Vibe Studio cover export (dark theme)",
      width: 1280,
      height: 720,
      label: "Cover · 1280×720",
    },
    {
      src: "/product/vibe-coding-poster-dark.png",
      alt: "Vibe Studio poster export (dark theme)",
      width: 1920,
      height: 1080,
      label: "Poster · 1920×1080",
    },
    {
      src: "/product/vibe-coding-wallpaper-desktop-4k-dark.png",
      alt: "Vibe Studio desktop wallpaper export (dark theme, 4K)",
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

  // Workflow
  workflowEyebrow: string;
  workflowTitle: string;
  workflow: ReadonlyArray<{ title: string; copy: string }>;

  // Agent section
  agentEyebrow: string;
  agentTitle: string;
  agentLede: string;
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
    { label: "Product", href: "#product" },
    { label: "Surfaces", href: "#surfaces" },
    { label: "Workflow", href: "#workflow" },
    { label: "GitHub", href: GITHUB_URL },
  ],
  mobileNav: [
    { label: "Product", href: "#product" },
    { label: "Surfaces", href: "#surfaces" },
    { label: "Workflow", href: "#workflow" },
    { label: "GitHub", href: GITHUB_URL },
    { label: "Main site", href: MAIN_SITE_URL },
  ],
  mainSiteLabel: "Main site",
  menuLabel: "Menu",
  langToggleLabel: "中文",
  themeToggleLabel: "Theme",

  wordmark: "Vibe Coding Live",
  eyebrow: "Editorial broadcast workbench",
  h1: "AI-prepared broadcast graphics for coding streams",
  lede: "Describe the session. Review the config. Let OBS own the real capture while Vibe Coding Live renders the editorial frame and export kit.",
  tryDemo: "Try Demo",
  openStudio: "Open Studio",
  copyAgentPrompt: "Copy Agent Setup Prompt",
  heroChips: ["No auto-apply", "Transparent OBS frame", "Overlay / cover / poster / wallpapers"],
  heroNote: "Demo mode is local-only. Private studio at",
  heroStudioLink: "/studio",
  viewGithub: "View on GitHub",

  showcaseAlt: "Vibe Coding Live overlay export",
  showcaseLabel: "overlay · 1920×1080",

  featuresEyebrow: "Features",
  featuresTitle: "What could you do with Vibe Coding Live?",
  features: [
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
  ],

  surfacesEyebrow: "Studio system",
  surfacesTitle: "From one idea to a broadcast-ready live studio",
  surfacesIntro: "Describe the session once. Review the AI proposal. Let OBS own the real capture while Vibe Coding Live renders the editorial frame, metadata and export kit.",
  surfacesAriaLabel: "Live studio system",
  surfacePanelEyebrow: "Studio layer",
  surfaceCards: [
    {
      id: "prepare",
      kind: "wide",
      title: "Prepare with Agent",
      src: "/product/agent-proposal-dark.png",
      alt: "Vibe Studio Session Config agent returning a reviewed proposal",
      width: 3960,
      height: 2128,
      summary: "Describe the stream in plain language. The Session Config Agent drafts title, sections, stack, socials and bottom bar — no manual form filling.",
      points: [
        "Natural-language brief becomes a structured config",
        "Title, sections, stack, socials proposed in one pass",
        "Faster prep than editing every field by hand",
      ],
    },
    {
      id: "review",
      kind: "wide",
      title: "Review safely",
      src: "/product/json-drawer-review-dark.png",
      alt: "Vibe Studio JSON review drawer with a proposal staged for manual apply",
      width: 3960,
      height: 2128,
      summary: "AI output is never auto-applied. The proposal opens in a JSON review drawer with a field-level diff. You inspect, then Apply — or discard.",
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
      alt: "OBS-style broadcast composition with the real capture under the Vibe Studio frame",
      width: 1174,
      height: 660,
      summary: "Vibe Coding Live owns only the transparent editorial frame. Real screen capture, camera and windows stay free underneath in OBS or Livehime.",
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
      alt: "Vibe Studio broadcast kit exported from one session config",
      width: 2400,
      height: 1350,
      summary: "One session config drives the high-value public assets: overlay, cover, poster and desktop/mobile wallpapers. Export All keeps the whole package visually aligned.",
      points: [
        "Overlay, cover, poster and wallpapers from one state",
        "Desktop and mobile wallpaper variants stay aligned",
        "Export All for the whole package before you go live",
      ],
      gallery: galleryImagesForLocale("en"),
    },
  ],

  workflowEyebrow: "Workflow",
  workflowTitle: "From session prep to OBS, in four steps",
  workflow: [
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
  ],

  agentEyebrow: "Agent-assisted session prep",
  agentTitle: "AI prepares. You review. OBS renders.",
  agentLede: "The Session Config Agent drafts a live-session config from your brief. You read the proposal, inspect the diff, and apply it only when it looks right. OBS then renders the overlay, sidebar and bottom bar as clean browser sources.",
  agentFlow: [
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
  ],
  agentSafety: [
    "AI output is never auto-applied. A returned config opens in the JSON review drawer, exactly like Import.",
    "The API key stays on the server. It never enters the client bundle, localStorage, or logs.",
  ],
  agentProviders: "Works with any OpenAI-compatible provider — DeepSeek, OpenAI, Kimi, z.ai and others — configured by server env. No key configured? The agent falls back to a local copy handoff.",

  getStartedEyebrow: "Get started",
  getStartedTitle: "Start with an agent-ready handoff.",
  getStartedLede: "Most setup work is better delegated: clone, inspect, run, configure AI keys, and prepare OBS routes. The demo stays safe and local-only.",
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

If I ask for AI setup, configure provider values only through server env. Never expose API keys,
never put keys in browser code or localStorage, and never log them.

If AI generates a live-session config, do not auto-apply it. Use the JSON review/apply path so I can inspect and apply manually.
Keep OBS, database, runtime state and localStorage unchanged unless I explicitly ask.`,
  agentTasks: [
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
  ],
  humanChecklist: [
    { label: "Install", value: "pnpm install" },
    { label: "Dev server", value: "pnpm dev" },
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
      answer: "Vibe Studio is an AI-assisted broadcast graphics workbench for coding livestreams. It prepares editorial overlays, covers, posters and wallpapers while OBS owns the real screen capture.",
    },
    {
      question: "Is the public demo connected to my private stream?",
      answer: "No. Demo mode uses local browser storage and avoids real provider calls, database writes and OBS live-state publishing.",
    },
    {
      question: "Does the AI agent ever auto-apply changes?",
      answer: "No. Returned configs open in the JSON review drawer. You apply them manually. The agent never writes directly to OBS, localStorage, the database, or runtime state.",
    },
    {
      question: "Where does my API key go?",
      answer: "Only server-side env. The browser sees a configured/not-configured status, never the key itself, and keys are not written to localStorage.",
    },
    {
      question: "Can I still use this as a private studio?",
      answer: "Yes. Open /studio for the full workspace that can connect to server-side AI, database persistence and OBS automation.",
    },
    {
      question: "How do I use it with OBS?",
      answer: "Add the OBS routes as browser sources: overlay, sidebar and bottom bar. Place your real screen capture and camera underneath the transparent overlay frame.",
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
      answer: "Yes. Send the agent to /skill.md first. It is a compact setup guide for installing, running, configuring AI safely and wiring OBS routes.",
    },
  ],

  footerBrand: "Aklman · 2026",
};

const zhContent: LandingContent = {
  brand: "Aklman",
  nav: [
    { label: "产品", href: "#product" },
    { label: "能力", href: "#surfaces" },
    { label: "流程", href: "#workflow" },
    { label: "GitHub", href: GITHUB_URL },
  ],
  mobileNav: [
    { label: "产品", href: "#product" },
    { label: "能力", href: "#surfaces" },
    { label: "流程", href: "#workflow" },
    { label: "GitHub", href: GITHUB_URL },
    { label: "主站", href: MAIN_SITE_URL },
  ],
  mainSiteLabel: "主站",
  menuLabel: "菜单",
  langToggleLabel: "EN",
  themeToggleLabel: "主题",

  wordmark: "Vibe Coding Live",
  eyebrow: "编辑式直播图形工作台",
  h1: "面向编程直播的 AI 直播图形",
  lede: "描述直播内容，审阅配置，让 OBS 掌控真实画面，Vibe Coding Live 负责编辑式框架与导出套装。",
  tryDemo: "体验 Demo",
  openStudio: "打开 Studio",
  copyAgentPrompt: "复制 Agent 配置提示词",
  heroChips: ["不自动应用", "透明 OBS 框架", "合成画面 / 封面 / 海报 / 壁纸"],
  heroNote: "Demo 模式仅限本地。私有工作台地址",
  heroStudioLink: "/studio",
  viewGithub: "在 GitHub 查看",

  showcaseAlt: "Vibe Coding Live 合成画面导出",
  showcaseLabel: "overlay · 1920×1080",

  featuresEyebrow: "功能",
  featuresTitle: "用 Vibe Coding Live 能做什么？",
  features: [
    {
      title: "直播合成画面构建器",
      copy: "设计透明主画面框架、摄像头位、侧栏与底栏，无需手工重建每个画面区域。",
    },
    {
      title: "Session Config Agent",
      copy: "向 Agent 描述直播计划，在 JSON 审阅抽屉中检查生成的配置，确认后再应用。",
    },
    {
      title: "OBS 浏览器源",
      copy: "将合成画面、侧栏与底栏作为干净的浏览器源，OBS 负责真实屏幕捕获。",
    },
  ],

  surfacesEyebrow: "工作室系统",
  surfacesTitle: "从一句话到可直播的完整工作台",
  surfacesIntro: "描述直播内容，审阅 AI 提案，让 OBS 掌控真实画面，Vibe Coding Live 渲染编辑式框架、元数据与导出套装。",
  surfacesAriaLabel: "直播工作室系统",
  surfacePanelEyebrow: "工作台层级",
  surfaceCards: [
    {
      id: "prepare",
      kind: "wide",
      title: "Agent 准备",
      src: "/product/agent-proposal-dark.png",
      alt: "Vibe Studio Session Config Agent 返回审阅提案",
      width: 3960,
      height: 2128,
      summary: "用自然语言描述直播，Session Config Agent 生成标题、段落、工具栈、社交链接与底栏——无需手工填表。",
      points: [
        "自然语言描述转为结构化配置",
        "标题、段落、工具栈、社交链接一次生成",
        "比逐字段手填更快的准备方式",
      ],
    },
    {
      id: "review",
      kind: "wide",
      title: "安全审阅",
      src: "/product/json-drawer-review-dark.png",
      alt: "Vibe Studio JSON 审阅抽屉，提案等待手动应用",
      width: 3960,
      height: 2128,
      summary: "AI 输出不会自动应用。提案进入 JSON 审阅抽屉，显示字段级 diff，你检查后 Apply 或丢弃。",
      points: [
        "提案进入审阅抽屉，不直接改直播状态",
        "应用前可见字段级 diff",
        "Agent 不直接写入 OBS 或数据库",
      ],
    },
    {
      id: "compose",
      kind: "wide",
      title: "OBS 合成",
      src: "/product/obs-main-screen-dark.png",
      alt: "OBS 式直播合成，真实捕获在 Vibe Studio 框架之下",
      width: 1174,
      height: 660,
      summary: "Vibe Coding Live 只负责透明编辑式框架，真实屏幕捕获、摄像头与窗口保留在 OBS 或直播姬底层自由摆放。",
      points: [
        "合成画面是透明 UI 框架，不锁定布局",
        "屏幕捕获与摄像头留在 OBS 底层",
        "侧栏与底栏是独立浏览器源",
      ],
    },
    {
      id: "export",
      kind: "gallery",
      title: "导出套装",
      src: "/product/broadcast-kit-dark.png",
      alt: "Vibe Studio 从一份配置导出的直播套装",
      width: 2400,
      height: 1350,
      summary: "一份 session config 驱动高价值公开资产：合成画面、封面、海报与桌面/手机壁纸。Export All 保持整套视觉一致。",
      points: [
        "合成画面、封面、海报、壁纸来自同一状态",
        "桌面与手机壁纸变体保持对齐",
        "开播前 Export All 一次导出整套",
      ],
      gallery: galleryImagesForLocale("zh"),
    },
  ],

  workflowEyebrow: "流程",
  workflowTitle: "从准备到 OBS，四步完成",
  workflow: [
    {
      title: "描述直播",
      copy: "写一段简短描述，或让 Agent 起草。Agent 提出配置，此时不应用任何内容。",
    },
    {
      title: "审阅配置",
      copy: "在 JSON 审阅抽屉中打开提案，检查 diff，然后 Apply 或丢弃。你始终掌控。",
    },
    {
      title: "连接 OBS",
      copy: "将合成画面、侧栏与底栏添加为浏览器源。OBS 或直播姬保留底层真实屏幕捕获。",
    },
    {
      title: "导出套装",
      copy: "导出合成画面、封面、海报与壁纸。Export All 从同一状态导出完整公开套装。",
    },
  ],

  agentEyebrow: "Agent 辅助直播准备",
  agentTitle: "AI 准备 · 人工审阅 · OBS 渲染",
  agentLede: "Session Config Agent 根据你的描述生成直播配置。你阅读提案、检查 diff，确认后再应用。OBS 将合成画面、侧栏与底栏渲染为干净的浏览器源。",
  agentFlow: [
    {
      step: "01",
      title: "Agent 生成直播配置",
      copy: "描述直播内容，Agent 返回提案配置——标题、段落、工具栈、社交链接——以 JSON 格式呈现。",
    },
    {
      step: "02",
      title: "人工审阅并应用",
      copy: "提案进入 JSON 审阅抽屉，检查字段级 diff 后 Apply。不会自动应用任何内容。",
    },
    {
      step: "03",
      title: "OBS 渲染浏览器源",
      copy: "合成画面、侧栏与底栏渲染为干净的浏览器源。OBS 负责框架下方的真实捕获。",
    },
  ],
  agentSafety: [
    "AI 输出不会自动应用。返回的配置进入 JSON 审阅抽屉，与 Import 完全一致。",
    "API key 仅存于服务器，不进入客户端 bundle、localStorage 或日志。",
  ],
  agentProviders: "兼容任何 OpenAI 兼容 provider——DeepSeek、OpenAI、Kimi、z.ai 等——通过服务器环境变量配置。未配置 key？Agent 回退到本地复制交接。",

  getStartedEyebrow: "开始使用",
  getStartedTitle: "从 Agent 就绪的交接开始",
  getStartedLede: "大部分配置工作更适合委托：克隆、检查、运行、配置 AI key、准备 OBS 路由。Demo 保持安全、仅限本地。",
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

如果需要配置 AI，只通过服务器环境变量配置 provider 值。不要暴露 API key，
不要把 key 放在浏览器代码或 localStorage，不要记录 key。

如果 AI 生成了 live-session config，不要自动应用。使用 JSON 审阅/应用路径，让我检查后手动应用。
除非我明确要求，不要改变 OBS、数据库、运行时状态和 localStorage。`,
  agentTasks: [
    {
      id: "run-demo",
      label: "运行本地 Demo",
      prompt: `先读 /skill.md。
然后帮我从 https://github.com/aklmans/vibe-studio 运行 Vibe Studio 本地 Demo。
用 pnpm。查 AGENTS.md 和 README.md 的安装和 dev 命令。
公开 Demo 在 /demo——本地运行，无 provider 调用、无数据库写入、无 OBS 副作用。
启动 dev server 并打开 /demo 确认加载。`,
    },
    {
      id: "configure-ai",
      label: "配置 AI provider",
      prompt: `先读 /skill.md。
然后帮我配置 Vibe Studio 的 Session Config Agent。
查 AGENTS.md 和 README.md 的 Session Config Agent 部分。
Agent 使用 OpenAI 兼容 Chat Completions 适配器——在 .env.local 设置（仅服务器，不提交）：
  SESSION_AGENT_PROVIDER, SESSION_AGENT_BASE_URL, SESSION_AGENT_API_KEY, SESSION_AGENT_MODEL, SESSION_AGENT_USER_AGENT
API key 仅存于服务器——不要暴露 API key，不要放入客户端 bundle、localStorage 或日志。
未配置 key？Agent 回退到本地复制交接。AI 输出不会自动应用；使用 JSON 审阅/应用。`,
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
将真实屏幕捕获和摄像头放在 overlay 框架下方。Overlay 只负责 UI 框架，不负责真实捕获。`,
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
      answer: "Vibe Studio 是面向编程直播的 AI 辅助直播图形工作台。它准备编辑式合成画面、封面、海报与壁纸，OBS 负责真实屏幕捕获。",
    },
    {
      question: "公开 Demo 连着我的私有直播吗？",
      answer: "不。Demo 模式使用本地浏览器存储，不触发真实 provider 调用、数据库写入或 OBS 实时状态发布。",
    },
    {
      question: "AI Agent 会自动应用更改吗？",
      answer: "不会。返回的配置进入 JSON 审阅抽屉，你手动应用。Agent 不直接写入 OBS、localStorage、数据库或运行时状态。",
    },
    {
      question: "我的 API key 存在哪里？",
      answer: "仅存于服务器环境变量。浏览器只看到已配置/未配置状态，永远看不到 key 本身，key 不会写入 localStorage。",
    },
    {
      question: "我可以把它当私有 Studio 用吗？",
      answer: "可以。打开 /studio 进入完整工作台，可连接服务器端 AI、数据库持久化与 OBS 自动化。",
    },
    {
      question: "如何配合 OBS 使用？",
      answer: "将 OBS 路由添加为浏览器源：合成画面、侧栏与底栏。将真实屏幕捕获和摄像头放在透明 overlay 框架下方。",
    },
    {
      question: "真实屏幕捕获在哪里？",
      answer: "Overlay 负责框架。OBS 或直播姬负责底层真实屏幕/视频捕获，布局保持灵活。",
    },
    {
      question: "可以导出整套直播套装吗？",
      answer: "可以。应用从同一状态导出合成画面、封面、海报与桌面/手机壁纸。侧栏与底栏源仍可用于 OBS 流程，但公开套装聚焦更高价值的可分享资产。",
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
