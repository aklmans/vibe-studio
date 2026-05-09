import { NEON_PRESET, type ColorTokens, type ThemeMode } from "./lib/theme";

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
    segments: {
      title: string;
      text: string;
    }[];
  };
  mainScreen: {
    visible: boolean;
    cameraVisible: boolean;
  };
  cover: {
    title: string;
    badge1: string;
    badge2: string;
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
    socialBilibili: string;
    socialBlog: string;
    socialGithub: string;
    socialQQ: string;
  };
  colors: ColorTokens;
  theme: ThemeMode;
  activeTab: "overlay" | "cover" | "poster";
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
      { title: "正在做", text: "AI 工作流直播搭建" },
      { title: "下一步", text: "测试 → 解释 → 优化" },
      { title: "资料", text: "命令 · 笔记 · 链接" },
    ],
  },
  mainScreen: {
    visible: true,
    cameraVisible: false,
  },
  cover: {
    title: "Building With Agents",
    badge1: "Claude",
    badge2: "Codex",
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
    socialBilibili: "",
    socialBlog: "",
    socialGithub: "",
    socialQQ: "",
  },
  colors: {
    ...NEON_PRESET,
  },
  theme: "neon",
  activeTab: "overlay",
};
