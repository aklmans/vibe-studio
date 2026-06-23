import { DARK_PRESET, type ColorTokens, type ThemeMode } from "./lib/theme";
import type { BadgeConfig } from "./lib/badges";
import type { SocialConfig } from "./lib/socials";
import type { BottomBarSlot } from "./lib/bottomBar";
import type { WallpaperPresetId } from "./lib/wallpaper";
import type { Locale } from "./lib/i18n";
import type { AppTab } from "./lib/tabs";

/**
 * Cover visual type — the single, explicit choice for the cover's subject:
 *  - "avatar"  → a personal headshot (cover.portraitUrl, default /avatar.png)
 *  - "scene"   → the studio figure scene (cover.sceneUrl, default /vibe-studio-bg.png)
 *  - "title"   → no image, pure editorial typography
 *
 * This replaces the ambiguous "Show Avatar" toggle as the cover's primary
 * abstraction. The legacy shared `cover.avatarUrl` / `cover.avatarVisible` are
 * intentionally left in place for the Poster / Wallpaper / Overlay broadcast
 * assets and are no longer read by the cover.
 */
export type CoverVisual = "avatar" | "scene" | "title";

export interface OverlayState {
  sidebar: {
    visible: boolean;
    socialVisible: boolean;
    activeSection: number;
    sectionsDone: boolean[][];
    sections: {
      title: string;
      bullets: string[];
    }[];
  };
  bottomBar: {
    visible: boolean;
    segments: BottomBarSlot[];
  };
  liveSession: {
    startedAt: string;
  };
  stack: {
    items: string[];
  };
  mainScreen: {
    visible: boolean;
    cameraVisible: boolean;
  };
  cover: {
    title: string;
    badges: BadgeConfig[];
    // Shared broadcast avatar — still rendered by Poster / Wallpaper /
    // Overlay. The cover no longer reads these; it uses `visual` + the cover
    // image fields below.
    avatarUrl: string;
    avatarVisible: boolean;
    // Cover visual type + its per-type images (cover-scoped, decoupled from the
    // shared broadcast avatar above).
    visual: CoverVisual;
    sceneUrl: string;
    portraitUrl: string;
    todayLabel: string;
    todayTopic: string;
    manifestoVisible: boolean;
    manifestoLine1: string;
    manifestoLine2: string;
    manifestoLine3: string;
    hookVisible: boolean;
    hookText: string;
    closingVisible: boolean;
    closingPrefix: string;
    closingStruck: string;
    closingHighlight: string;
    closingSuffix: string;
    socialVisible: boolean;
    socials: SocialConfig[];
  };
  wallpaper: {
    previewPresetId: WallpaperPresetId;
    brandLabel: string;
    brandLabelVisible: boolean;
    slogan: string;
    sloganVisible: boolean;
    avatarVisible: boolean;
    badgesVisible: boolean;
    socialVisible: boolean;
  };
  colors: ColorTokens;
  theme: ThemeMode;
  activeTab: AppTab;
}

export const DEFAULT_STATE_BY_LOCALE: Record<Locale, OverlayState> = {
  zh: {
    sidebar: {
    visible: true,
    socialVisible: false,
    activeSection: 0,
    sectionsDone: [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ],
    sections: [
      {
        title: "今日目标",
        bullets: ["配置直播画面", "优化 AI 工作流", "边做边解释"],
      },
      {
        title: "当前问题",
        bullets: ["哪一步最卡？", "如何更简单？", "下一步测什么？"],
      },
      {
        title: "输出记录",
        bullets: ["已更新布局", "已验证效果", "下一步继续简化"],
      },
    ],
  },
  bottomBar: {
    visible: true,
    segments: [
      { kind: "live" },
      { kind: "progress", sectionIndex: 0 },
      { kind: "stack" },
    ],
  },
  liveSession: {
    startedAt: "",
  },
  stack: {
    items: ["Claude Opus 4.7", "Cursor", "React + Vite"],
  },
  mainScreen: {
    visible: true,
    cameraVisible: true,
  },
  cover: {
    title: "Building With Agents",
    badges: [
      { visible: true, iconKey: "claude", iconMode: "brand", label: "Claude", customIconUrl: "" },
      { visible: true, iconKey: "codex", iconMode: "brand", label: "Codex", customIconUrl: "" },
      { visible: false, iconKey: "gemini", iconMode: "brand", label: "Gemini", customIconUrl: "" },
      { visible: false, iconKey: "grok", iconMode: "brand", label: "Grok", customIconUrl: "" },
    ],
    avatarUrl: "/avatar.png",
    avatarVisible: true,
    visual: "avatar",
    sceneUrl: "/vibe-studio-bg.png",
    portraitUrl: "/avatar.png",
    todayLabel: "今日构建",
    todayTopic: "多 Agent Coding 实战",
    manifestoVisible: false,
    manifestoLine1: "想清楚。",
    manifestoLine2: "和智能体一起搭。",
    manifestoLine3: "持续成长。",
    hookVisible: true,
    hookText: "with Aklman",
    closingVisible: false,
    closingPrefix: "享受",
    closingStruck: "编程",
    closingHighlight: "和智能体一起搭建。",
    closingSuffix: "拥有美好人生。",
    socialVisible: true,
    socials: [
      { visible: true, kind: "bilibili", label: "B站", value: "Aklman", customColor: "" },
      { visible: true, kind: "blog", label: "个人网站", value: "aklman.com", customColor: "" },
      { visible: true, kind: "qq", label: "QQ群", value: "205359827", customColor: "" },
      { visible: true, kind: "wechat", label: "微信", value: "aklman1", customColor: "" },
      { visible: true, kind: "github", label: "GitHub", value: "aklmans", customColor: "" },
    ],
  },
  wallpaper: {
    previewPresetId: "desktop-4k",
    brandLabel: "VIBE STUDIO",
    brandLabelVisible: true,
    slogan: "Build clearly. Ship loudly.",
    sloganVisible: true,
    avatarVisible: true,
    badgesVisible: true,
    socialVisible: true,
  },
  colors: {
    ...DARK_PRESET,
  },
  theme: "dark",
    activeTab: "overlay",
  },
  en: {
    sidebar: {
      visible: true,
      socialVisible: false,
      activeSection: 0,
      sectionsDone: [
        [false, false, false],
        [false, false, false],
        [false, false, false],
      ],
      sections: [
        {
          title: "Today's Goal",
          bullets: ["Set up the stream layout", "Optimize AI workflow", "Explain as we go"],
        },
        {
          title: "Current Problem",
          bullets: ["What's the bottleneck?", "How to simplify?", "What to test next?"],
        },
        {
          title: "Session Log",
          bullets: ["Updated layout", "Verified result", "Continue simplifying next"],
        },
      ],
    },
    bottomBar: {
      visible: true,
      segments: [
        { kind: "live" },
        { kind: "progress", sectionIndex: 0 },
        { kind: "stack" },
      ],
    },
    liveSession: {
      startedAt: "",
    },
    stack: {
      items: ["Claude Opus 4.7", "Cursor", "React + Vite"],
    },
    mainScreen: {
      visible: true,
      cameraVisible: true,
    },
    cover: {
      title: "Building With Agents",
      badges: [
        { visible: true, iconKey: "claude", iconMode: "brand", label: "Claude", customIconUrl: "" },
        { visible: true, iconKey: "codex", iconMode: "brand", label: "Codex", customIconUrl: "" },
        { visible: false, iconKey: "gemini", iconMode: "brand", label: "Gemini", customIconUrl: "" },
        { visible: false, iconKey: "grok", iconMode: "brand", label: "Grok", customIconUrl: "" },
      ],
      avatarUrl: "/avatar.png",
      avatarVisible: true,
      visual: "avatar",
      sceneUrl: "/vibe-studio-bg.png",
      portraitUrl: "/avatar.png",
      todayLabel: "TODAY'S BUILD",
      todayTopic: "Multi-Agent Coding Live",
      manifestoVisible: false,
      manifestoLine1: "Think clearly.",
      manifestoLine2: "Build with agents.",
      manifestoLine3: "Keep growing.",
      hookVisible: true,
      hookText: "with Aklman",
      closingVisible: false,
      closingPrefix: "Enjoy",
      closingStruck: "programming",
      closingHighlight: "building with agents.",
      closingSuffix: "Have a great life.",
      socialVisible: true,
      socials: [
        { visible: true, kind: "youtube", label: "YouTube", value: "@aklman2018", customColor: "" },
        { visible: true, kind: "blog", label: "Website", value: "aklman.com", customColor: "" },
        { visible: true, kind: "discord", label: "Discord", value: "aklman", customColor: "" },
        { visible: true, kind: "x", label: "X", value: "@Aklman2018", customColor: "" },
        { visible: true, kind: "github", label: "GitHub", value: "aklmans", customColor: "" },
      ],
    },
    wallpaper: {
      previewPresetId: "desktop-4k",
      brandLabel: "VIBE STUDIO",
      brandLabelVisible: true,
      slogan: "Build clearly. Ship loudly.",
      sloganVisible: true,
      avatarVisible: true,
      badgesVisible: true,
      socialVisible: true,
    },
    colors: {
      ...DARK_PRESET,
    },
    theme: "dark",
    activeTab: "overlay",
  },
};

export const DEFAULT_STATE = DEFAULT_STATE_BY_LOCALE.zh;
