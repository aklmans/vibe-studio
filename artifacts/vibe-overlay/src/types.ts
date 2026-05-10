import { NEON_PRESET, type ColorTokens, type ThemeMode } from "./lib/theme";
import type { BadgeConfig } from "./lib/badges";
import type { SocialConfig } from "./lib/socials";
import type { BottomBarSlot } from "./lib/bottomBar";
import type { WallpaperPresetId } from "./lib/wallpaper";

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
    avatarUrl: string;
    avatarVisible: boolean;
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
  activeTab: "overlay" | "cover" | "poster" | "wallpaper";
}

export const DEFAULT_STATE: OverlayState = {
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
    cameraVisible: false,
  },
  cover: {
    title: "Building With Agents",
    badges: [
      { visible: true, kind: "claude", label: "Claude", customIconUrl: "" },
      { visible: true, kind: "codex", label: "Codex", customIconUrl: "" },
      { visible: false, kind: "gemini", label: "Gemini", customIconUrl: "" },
      { visible: false, kind: "grok", label: "Grok", customIconUrl: "" },
    ],
    avatarUrl: "",
    avatarVisible: true,
    todayLabel: "TODAY'S BUILD",
    todayTopic: "多 Agent Coding 实战",
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
    socialVisible: false,
    socials: [
      { visible: true, kind: "bilibili", label: "B站", value: "", customColor: "" },
      { visible: true, kind: "blog", label: "博客", value: "", customColor: "" },
      { visible: true, kind: "github", label: "GitHub", value: "", customColor: "" },
      { visible: true, kind: "qq", label: "QQ群", value: "", customColor: "" },
      { visible: false, kind: "x", label: "X", value: "", customColor: "" },
      { visible: false, kind: "youtube", label: "YouTube", value: "", customColor: "" },
    ],
  },
  wallpaper: {
    previewPresetId: "desktop-4k",
    brandLabel: "VIBE CODING",
    brandLabelVisible: true,
    slogan: "Build clearly. Ship loudly.",
    sloganVisible: true,
    avatarVisible: true,
    badgesVisible: true,
    socialVisible: true,
  },
  colors: {
    ...NEON_PRESET,
  },
  theme: "neon",
  activeTab: "overlay",
};
