export interface OverlayState {
  sidebar: {
    visible: boolean;
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
  };
  cover: {
    title: string;
    subtitle: string;
    badge1: string;
    badge2: string;
  };
  colors: {
    bgDark: string;
    bgPanel: string;
    borderColor: string;
    textColor: string;
    mutedText: string;
    cyanAccent: string;
    pinkAccent: string;
    warmAccent: string;
  };
  activeTab: "overlay" | "cover";
}

export const DEFAULT_STATE: OverlayState = {
  sidebar: {
    visible: true,
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
  },
  cover: {
    title: "Vibe Coding With Me",
    subtitle: "Claude × Codex · AI Coding Study Live",
    badge1: "Claude",
    badge2: "Codex",
  },
  colors: {
    bgDark: "#10111D",
    bgPanel: "#191A2A",
    borderColor: "#8DA8FF",
    textColor: "#F4F7FF",
    mutedText: "#C7D2FE",
    cyanAccent: "#7DD3FC",
    pinkAccent: "#FF6FAE",
    warmAccent: "#FFB86B",
  },
  activeTab: "overlay",
};
