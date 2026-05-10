export type Locale = "zh" | "en";

export const dict = {
  zh: {
    // ─── TopBar ───────────────────────────────────────────────────────
    "topbar.search": "搜索…",
    "topbar.commandPalette": "命令面板",
    "topbar.settings": "设置",

    // ─── Tabs / tab badges ────────────────────────────────────────────
    "tab.overlay": "合成画面",
    "tab.cover": "封面",
    "tab.poster": "海报",
    "tab.wallpaper": "壁纸",
    "tabBadge.overlay": "合成画面 · 1920×1080",
    "tabBadge.cover": "封面 · 1920×1080",
    "tabBadge.poster": "海报 · 1920×1080",

    // ─── Inspector ────────────────────────────────────────────────────
    "inspector.overlay.hint": "直播合成画面",
    "inspector.cover.hint": "开播前 / 结束后封面",
    "inspector.poster.hint": "长版开播预告海报",
    "inspector.wallpaper.hint": "品牌壁纸 — 4K · QHD · 手机",

    // ─── Inspector group titles & hints ───────────────────────────────
    "group.visibility": "显示",
    "group.visibility.hint": "切换主要画面区域",
    "group.brand": "品牌身份",
    "group.brand.hint": "头像 · 标题 · 副标题 · 智能体徽标",
    "group.brand.hintAlt": "头像 · 标题 · 智能体徽标（共享）",
    "group.todaysBuild": "今日构建",
    "group.todaysBuild.hint": "卡片标签 + 话题文案",
    "group.socials": "社交",
    "group.socials.hint": "开启后可见",
    "group.manifesto": "宣言",
    "group.manifesto.hint": "3 行文字块",
    "group.hookText": "副标题",
    "group.hookText.hint": "标题下方的中文小字",
    "group.closingLine": "收尾金句",
    "group.closingLine.hint": "高级 — 前缀 · 删除线 · 高亮 · 后缀",
    "group.sections": "进度段落",
    "group.sections.hint": "三条侧栏追踪",
    "group.liveBar": "直播条",
    "group.liveBar.hint": "开播计时 · 工具栈 · 3 个片段",
    "group.previewSize": "预览尺寸",
    "group.previewSize.hint": "选择在预览区渲染的尺寸",
    "group.brandLabel": "品牌标语",
    "group.brandLabel.hint": "壁纸专属文案",
    "group.dangerZone": "危险区域",

    // ─── Toggle labels ────────────────────────────────────────────────
    "toggle.mainScreen": "主画面",
    "toggle.cameraFrame": "摄像头画面",
    "toggle.rightSidebar": "右侧栏",
    "toggle.sidebarSocial": "侧栏社交信息",
    "toggle.bottomBar": "底栏",
    "toggle.showSocialCard": "显示社交卡片",
    "toggle.showManifesto": "显示宣言",
    "toggle.showHookText": "显示副标题",
    "toggle.showClosingLine": "显示收尾金句",
    "toggle.showAvatar": "显示头像",
    "toggle.showAgentBadges": "显示智能体徽标",
    "toggle.showSocialInfo": "显示社交信息",
    "toggle.showBrandLabel": "显示品牌标签",
    "toggle.showSlogan": "显示标语",

    // ─── Field labels ─────────────────────────────────────────────────
    "label.cardLabel": "卡片标签",
    "label.topic": "话题",
    "label.title": "标题",
    "label.subtitle": "副标题",
    "label.brandLabel": "品牌标签",
    "label.slogan": "标语",
    "label.line1": "第 1 行",
    "label.line2": "第 2 行",
    "label.line3": "第 3 行",
    "label.prefix": "前缀",
    "label.strikethrough": "删除线词",
    "label.highlight": "高亮短语",
    "label.suffix": "后缀",
    "label.hookText": "中文副标",
    "label.activeSection": "当前段落",
    "label.liveSession": "直播时间",
    "label.stack": "工具栈",
    "label.segment": "片段",
    "label.section": "段落",
    "label.bullet": "要点",
    "label.badge": "徽标",
    "label.social": "社交",
    "label.displayLabel": "显示名称",
    "label.iconUrl": "图标 URL",
    "label.socialLabel": "标签",
    "label.socialValue": "值",
    "label.customColor": "自定义颜色",
    "label.custom": "自定义…",

    // ─── Buttons ──────────────────────────────────────────────────────
    "btn.upload": "上传照片",
    "btn.replace": "替换照片",
    "btn.clear": "清除",
    "btn.startNow": "现在开播",
    "btn.cancel": "取消",
    "btn.markDone": "标记完成",
    "btn.markUndone": "标记未完成",
    "btn.remove": "移除",

    // ─── Settings ────────────────────────────────────────────────────
    "settings.title": "设置",
    "settings.subtitle": "主题 · 颜色 · 重置",
    "settings.theme": "主题",
    "settings.themeHint": "预设配色方案",
    "settings.colorsSurface": "颜色 — 背景",
    "settings.colorsText": "颜色 — 文字",
    "settings.colorsAccent": "颜色 — 强调",
    "settings.closeSettings": "关闭设置",
    "color.bgDark": "深色背景",
    "color.bgDarkHint": "外部画布背景",
    "color.bgPanel": "面板背景",
    "color.bgPanelHint": "侧栏 / 底栏 / 摄像头区块填充",
    "color.border": "边框",
    "color.borderHint": "面板细线边框 + 强调分隔线",
    "color.text": "正文",
    "color.textHint": "要点文字与标题",
    "color.mutedText": "弱化文字",
    "color.mutedTextHint": "次要标注与未激活段落",
    "color.subtleText": "辅助文字",
    "color.subtleTextHint": "标注与脚注级别文字",
    "color.cyan": "青色",
    "color.cyanHint": "段落 1 强调（侧栏 + 底栏）",
    "color.pink": "粉色",
    "color.pinkHint": "段落 2 强调 + 「关注我」标题",
    "color.warm": "暖色",
    "color.warmHint": "段落 3 强调 + 暖色预设标签",

    // ─── Danger zone / Reset ─────────────────────────────────────────
    "reset.title": "恢复默认？",
    "reset.description": "这将丢弃所有修改 — 段落、要点、底栏文字、封面/海报文案和颜色覆盖 — 并恢复出厂状态。此操作不可撤销。",
    "reset.button": "恢复默认",
    "reset.confirm": "全部恢复",

    // ─── Command palette ─────────────────────────────────────────────
    "cmdk.placeholder": "输入命令或搜索…",
    "cmdk.empty": "没有匹配的命令。",
    "cmdk.navigate": "导航",
    "cmdk.select": "选择",
    "cmdk.toggleHint": "切换此面板",
    "cmdk.show": "显示",
    "cmdk.hide": "隐藏",

    // ─── cmdk groups ──────────────────────────────────────────────────
    "cmdk.group.switchTab": "切换标签",
    "cmdk.group.export": "导出",
    "cmdk.group.theme": "主题",
    "cmdk.group.visibility": "显示",
    "cmdk.group.language": "语言",
    "cmdk.group.app": "应用",

    // ─── cmdk items ──────────────────────────────────────────────────
    "cmdk.tab.overlay": "跳到 合成画面 (Overlay)",
    "cmdk.tab.cover": "跳到 封面 (Cover)",
    "cmdk.tab.poster": "跳到 海报 (Poster)",
    "cmdk.tab.wallpaper": "跳到 壁纸 (Wallpaper)",
    "cmdk.export.current": "导出当前标签",
    "cmdk.theme.neon": "应用 Neon 主题",
    "cmdk.theme.editorial": "应用 Editorial 主题",
    "cmdk.settings": "打开设置",
    "cmdk.reset": "恢复默认…",
    "cmdk.locale.en": "Switch to English",
    "cmdk.locale.zh": "切换到中文",

    // ─── Export ───────────────────────────────────────────────────────
    "export.overlay": "导出 合成画面",
    "export.cover": "导出 封面",
    "export.poster": "导出 海报",
    "export.wallpaper": "导出壁纸集",
    "export.fullOverlay": "完整 合成画面 PNG",
    "export.coverPng": "封面 PNG",
    "export.posterPng": "海报 PNG",
    "export.wallpaperSet": "壁纸集 (3 PNG)",
    "export.sidebar": "侧栏切片",
    "export.bottomBar": "底栏切片",
    "export.exporting": "导出中…",
    "export.moreOptions": "更多导出选项",
    "export.failed": "导出失败",
    "export.notReady": "导出节点未就绪",

    // ─── App ─────────────────────────────────────────────────────────
    "app.previewHint": "缩放预览 — 导出为原始分辨率",
    "app.brand": "Vibe Overlay",

    // ─── Live bar / canvas ────────────────────────────────────────────
    "live.onAir": "开播",
    "live.live": "直播",
    "live.started": "已开始",
    "live.notSet": "未设置开始时间，开播段会显示 —:——",
    "live.startNow": "现在开播",

    // ─── Bottom bar ──────────────────────────────────────────────────
    "bar.onAir": "开播",
    "bar.progress": "进度",
    "bar.stack": "栈",
    "bar.topic": "话题",
    "bar.text": "文本",
    "bar.emptyStack": "在编辑器中添加工具",

    // ─── Canvas rendered strings ─────────────────────────────────────
    "canvas.followMe": "关注我",
    "canvas.upcoming": "即将开始",
    "canvas.screenCapture": "屏幕捕获",
    "canvas.camera": "摄像头",

    // ─── Social kind labels (editor) ─────────────────────────────────
    "social.bilibili": "B站",
    "social.blog": "博客",
    "social.github": "GitHub",
    "social.qq": "QQ群",
    "social.x": "X",
    "social.youtube": "YouTube",
    "social.wechat": "微信",
    "social.custom": "自定义…",

    // ─── Badge kind labels ────────────────────────────────────────────
    "badge.claude": "Claude",
    "badge.codex": "Codex",
    "badge.gemini": "Gemini",
    "badge.grok": "Grok",
    "badge.custom": "自定义…",

    // ─── Avatar uploader ─────────────────────────────────────────────
    "avatar.showAvatar": "显示头像",
    "avatar.replacePhoto": "替换照片",
    "avatar.uploadPhoto": "上传照片",
    "avatar.uploaded": "照片已上传",

    // ─── Brand identity note ──────────────────────────────────────────
    "brandIdentity.note": "头像 · 标题 · 徽标 在 Cover · Poster · Wallpaper 之间共享，改一处三处都生效。",

    // ─── Stack editor ────────────────────────────────────────────────
    "stackEditor.placeholder": "新增工具，回车确认",

    // ─── Bottom bar segment editor ───────────────────────────────────
    "segmentEditor.liveDesc": "直播开始时间在直播时间区设置，时长会按秒自动刷新。",
    "segmentEditor.stackDesc": "内容在直播时间 › 工具栈列表中编辑。",
    "segmentEditor.mirrorDesc": "自动镜像 Cover/Poster 中的今日构建。",
    "segmentEditor.title": "标题",
    "segmentEditor.text": "文本",

    // ─── Wallpaper presets ────────────────────────────────────────────
    "wallpaper.desktop4k": "桌面 4K",
    "wallpaper.desktopQhd": "桌面 QHD",
    "wallpaper.mobile": "手机",

    // ─── Language ─────────────────────────────────────────────────────
    "language.en": "English",
    "language.zh": "中文",
  },

  en: {
    // ─── TopBar ───────────────────────────────────────────────────────
    "topbar.search": "Search…",
    "topbar.commandPalette": "Command palette",
    "topbar.settings": "Settings",

    // ─── Tabs / tab badges ────────────────────────────────────────────
    "tab.overlay": "Overlay",
    "tab.cover": "Cover",
    "tab.poster": "Poster",
    "tab.wallpaper": "Wallpaper",
    "tabBadge.overlay": "OVERLAY · 1920×1080",
    "tabBadge.cover": "COVER · 1920×1080",
    "tabBadge.poster": "POSTER · 1920×1080",

    // ─── Inspector ────────────────────────────────────────────────────
    "inspector.overlay.hint": "Live broadcast composition",
    "inspector.cover.hint": "Pre-stream / post-stream cover",
    "inspector.poster.hint": "Long-form pre-stream poster",
    "inspector.wallpaper.hint": "Brand wallpapers — 4K · QHD · Mobile",

    // ─── Inspector group titles & hints ───────────────────────────────
    "group.visibility": "Visibility",
    "group.visibility.hint": "Toggle major surfaces",
    "group.brand": "Brand",
    "group.brand.hint": "Avatar · title · subtitle · agent badges",
    "group.brand.hintAlt": "Avatar · title · agent badges (shared)",
    "group.todaysBuild": "Today's Build",
    "group.todaysBuild.hint": "Card label + topic copy",
    "group.socials": "Socials",
    "group.socials.hint": "Visible only when toggled on",
    "group.manifesto": "Manifesto",
    "group.manifesto.hint": "3-line block",
    "group.hookText": "Hook Text",
    "group.hookText.hint": "Chinese subline below the title",
    "group.closingLine": "Closing Line",
    "group.closingLine.hint": "Advanced — prefix · struck · highlight · suffix",
    "group.sections": "Sections",
    "group.sections.hint": "Three sidebar tracks",
    "group.liveBar": "Live Bar",
    "group.liveBar.hint": "On-Air timer · stack · 3 segments",
    "group.previewSize": "Preview Size",
    "group.previewSize.hint": "Pick which size renders in the stage",
    "group.brandLabel": "Brand Label & Slogan",
    "group.brandLabel.hint": "Wallpaper-only copy",
    "group.dangerZone": "Danger Zone",

    // ─── Toggle labels ────────────────────────────────────────────────
    "toggle.mainScreen": "Main Screen",
    "toggle.cameraFrame": "Camera Frame",
    "toggle.rightSidebar": "Right Sidebar",
    "toggle.sidebarSocial": "Sidebar Social Info",
    "toggle.bottomBar": "Bottom Bar",
    "toggle.showSocialCard": "Show Social Card",
    "toggle.showManifesto": "Show Manifesto",
    "toggle.showHookText": "Show Hook Text",
    "toggle.showClosingLine": "Show Closing Line",
    "toggle.showAvatar": "Show Avatar",
    "toggle.showAgentBadges": "Show Agent Badges",
    "toggle.showSocialInfo": "Show Social Info",
    "toggle.showBrandLabel": "Show Brand Label",
    "toggle.showSlogan": "Show Slogan",

    // ─── Field labels ─────────────────────────────────────────────────
    "label.cardLabel": "Card Label",
    "label.topic": "Topic",
    "label.title": "Title",
    "label.subtitle": "Subtitle",
    "label.brandLabel": "Brand Label",
    "label.slogan": "Slogan",
    "label.line1": "Line 1",
    "label.line2": "Line 2",
    "label.line3": "Line 3",
    "label.prefix": "Prefix",
    "label.strikethrough": "Strikethrough word",
    "label.highlight": "Highlighted phrase",
    "label.suffix": "Suffix",
    "label.hookText": "Chinese Hook",
    "label.activeSection": "Active Section",
    "label.liveSession": "Live Session",
    "label.stack": "Stack",
    "label.segment": "Segment",
    "label.section": "Section",
    "label.bullet": "Bullet",
    "label.badge": "Badge",
    "label.social": "Social",
    "label.displayLabel": "Display label",
    "label.iconUrl": "Icon URL",
    "label.socialLabel": "Label",
    "label.socialValue": "Value",
    "label.customColor": "Custom color",
    "label.custom": "Custom…",

    // ─── Buttons ──────────────────────────────────────────────────────
    "btn.upload": "Upload Photo",
    "btn.replace": "Replace Photo",
    "btn.clear": "Clear",
    "btn.startNow": "Start Now",
    "btn.cancel": "Cancel",
    "btn.markDone": "Mark done",
    "btn.markUndone": "Mark undone",
    "btn.remove": "Remove",

    // ─── Settings ────────────────────────────────────────────────────
    "settings.title": "Settings",
    "settings.subtitle": "Theme · colors · reset",
    "settings.theme": "Theme",
    "settings.themeHint": "Preset color sets",
    "settings.colorsSurface": "Colors — Surface",
    "settings.colorsText": "Colors — Text",
    "settings.colorsAccent": "Colors — Accent",
    "settings.closeSettings": "Close settings",
    "color.bgDark": "Background Dark",
    "color.bgDarkHint": "Outer canvas background",
    "color.bgPanel": "Panel Background",
    "color.bgPanelHint": "Sidebar / bottom-bar / camera tile fill",
    "color.border": "Border",
    "color.borderHint": "Panel hairline borders + accent dividers",
    "color.text": "Text",
    "color.textHint": "Main bullet copy and titles",
    "color.mutedText": "Muted Text",
    "color.mutedTextHint": "Secondary captions and inactive sections",
    "color.subtleText": "Subtle Text",
    "color.subtleTextHint": "Eyebrow labels and footnote-level text",
    "color.cyan": "Cyan",
    "color.cyanHint": "Section 1 accent (sidebar + bottom bar)",
    "color.pink": "Pink",
    "color.pinkHint": "Section 2 accent + 'Follow me' header",
    "color.warm": "Warm",
    "color.warmHint": "Section 3 accent + warm preset chips",

    // ─── Danger zone / Reset ─────────────────────────────────────────
    "reset.title": "Reset to defaults?",
    "reset.description": "This will discard all of your edits — sections, bullets, bottom-bar text, cover/poster copy, and color overrides — and load the factory state. This action cannot be undone.",
    "reset.button": "Reset Defaults",
    "reset.confirm": "Reset everything",

    // ─── Command palette ─────────────────────────────────────────────
    "cmdk.placeholder": "Type a command or search…",
    "cmdk.empty": "No matching command.",
    "cmdk.navigate": "navigate",
    "cmdk.select": "select",
    "cmdk.toggleHint": "toggles this palette",
    "cmdk.show": "Show",
    "cmdk.hide": "Hide",

    // ─── cmdk groups ──────────────────────────────────────────────────
    "cmdk.group.switchTab": "Switch tab",
    "cmdk.group.export": "Export",
    "cmdk.group.theme": "Theme",
    "cmdk.group.visibility": "Visibility",
    "cmdk.group.language": "Language",
    "cmdk.group.app": "App",

    // ─── cmdk items ──────────────────────────────────────────────────
    "cmdk.tab.overlay": "Go to Overlay",
    "cmdk.tab.cover": "Go to Cover",
    "cmdk.tab.poster": "Go to Poster",
    "cmdk.tab.wallpaper": "Go to Wallpaper",
    "cmdk.export.current": "Export current tab",
    "cmdk.theme.neon": "Apply Neon theme",
    "cmdk.theme.editorial": "Apply Editorial theme",
    "cmdk.settings": "Open Settings",
    "cmdk.reset": "Reset to Defaults…",
    "cmdk.locale.en": "Switch to English",
    "cmdk.locale.zh": "切换到中文",

    // ─── Export ───────────────────────────────────────────────────────
    "export.overlay": "Export Overlay",
    "export.cover": "Export Cover",
    "export.poster": "Export Poster",
    "export.wallpaper": "Export Wallpaper Set",
    "export.fullOverlay": "Full Overlay PNG",
    "export.coverPng": "Cover PNG",
    "export.posterPng": "Poster PNG",
    "export.wallpaperSet": "Wallpaper Set (3 PNGs)",
    "export.sidebar": "Sidebar slice",
    "export.bottomBar": "Bottom Bar slice",
    "export.exporting": "Exporting…",
    "export.moreOptions": "More export options",
    "export.failed": "Export failed",
    "export.notReady": "Export node not ready",

    // ─── App ─────────────────────────────────────────────────────────
    "app.previewHint": "Scaled preview — export at full resolution",
    "app.brand": "Vibe Overlay",

    // ─── Live bar / canvas ────────────────────────────────────────────
    "live.onAir": "On Air",
    "live.live": "LIVE",
    "live.started": "Started",
    "live.notSet": "No start time set — On Air segment will show —:——",
    "live.startNow": "Start Now",

    // ─── Bottom bar ──────────────────────────────────────────────────
    "bar.onAir": "On Air",
    "bar.progress": "Progress",
    "bar.stack": "Stack",
    "bar.topic": "Topic",
    "bar.text": "Text",
    "bar.emptyStack": "Add tools in the editor",

    // ─── Canvas rendered strings ─────────────────────────────────────
    "canvas.followMe": "Follow me",
    "canvas.upcoming": "Upcoming",
    "canvas.screenCapture": "Screen Capture",
    "canvas.camera": "Camera",

    // ─── Social kind labels (editor) ─────────────────────────────────
    "social.bilibili": "Bilibili",
    "social.blog": "Blog",
    "social.github": "GitHub",
    "social.qq": "QQ Group",
    "social.x": "X",
    "social.youtube": "YouTube",
    "social.wechat": "WeChat",
    "social.custom": "Custom…",

    // ─── Badge kind labels ────────────────────────────────────────────
    "badge.claude": "Claude",
    "badge.codex": "Codex",
    "badge.gemini": "Gemini",
    "badge.grok": "Grok",
    "badge.custom": "Custom…",

    // ─── Avatar uploader ─────────────────────────────────────────────
    "avatar.showAvatar": "Show Avatar",
    "avatar.replacePhoto": "Replace Photo",
    "avatar.uploadPhoto": "Upload Photo",
    "avatar.uploaded": "Photo uploaded",

    // ─── Brand identity note ──────────────────────────────────────────
    "brandIdentity.note": "Avatar · Title · Badges are shared across Cover · Poster · Wallpaper. Edit once, applied everywhere.",

    // ─── Stack editor ────────────────────────────────────────────────
    "stackEditor.placeholder": "Add tool, press Enter",

    // ─── Bottom bar segment editor ───────────────────────────────────
    "segmentEditor.liveDesc": "Live start time is set in the Live Session area. Duration refreshes automatically.",
    "segmentEditor.stackDesc": "Content is edited in the Live Session → Stack list.",
    "segmentEditor.mirrorDesc": "Auto-mirrors TODAY'S BUILD from Cover/Poster.",
    "segmentEditor.title": "Title",
    "segmentEditor.text": "Text",

    // ─── Wallpaper presets ────────────────────────────────────────────
    "wallpaper.desktop4k": "Desktop 4K",
    "wallpaper.desktopQhd": "Desktop QHD",
    "wallpaper.mobile": "Mobile",

    // ─── Language ─────────────────────────────────────────────────────
    "language.en": "English",
    "language.zh": "中文",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type TranslationKey = keyof (typeof dict)["zh"];