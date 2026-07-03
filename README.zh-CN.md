# Vibe Studio

[English](README.md) · **简体中文**

一个用 Next.js 构建的直播图形设计应用,面向 Study With Me、Coding With Me、Build in Public、Vibe Coding、游戏、聊天、共同工作等各类"with me"直播形式。它让创作者拥有一套有设计感的视觉框架,而不必在 OBS 或直播姬里逐个手搭场景;用一个可选的 Agent 起草直播内容;并导出可直接开播的覆盖层(overlay)、封面、海报和壁纸素材。

仓库地址:https://github.com/aklmans/vibe-studio

## 设计

Vibe Studio 采用温暖、编辑风格的直播工作室设计语言:暖色表面、精致排版、等宽字体呈现元数据、极细分隔线、克制的强调色 —— 足够沉静,适合长时间直播,并在视频里清晰可读。完整方向记录在 [`DESIGN_LANGUAGE.md`](DESIGN_LANGUAGE.md)。

视觉改动不得破坏的契约:导出尺寸与文件名、OBS 路由、离屏导出架构、状态持久化、live-data API,以及键盘/导出工作流。

## 预览

下方预览图是从覆盖层构建器导出的示例,已提交在 `docs/assets/`。

### 封面

<p align="center">
  <img src="docs/assets/vibe-coding-cover.png" alt="Vibe Studio 封面" width="820">
</p>

### 海报

<p align="center">
  <img src="docs/assets/vibe-coding-poster.png" alt="Vibe Studio 海报" width="820">
</p>

### 完整直播覆盖层

<p align="center">
  <img src="docs/assets/vibe-coding-overlay.png" alt="Vibe Studio 完整直播覆盖层" width="820">
</p>

### 导出切片

<table>
  <tr>
    <th>侧栏</th>
    <th>底栏</th>
  </tr>
  <tr>
    <td width="34%">
      <img src="docs/assets/vibe-coding-sidebar.png" alt="Vibe Studio 侧栏导出">
    </td>
    <td width="66%">
      <img src="docs/assets/vibe-coding-bottom-bar.png" alt="Vibe Studio 底栏导出">
    </td>
  </tr>
</table>

### 壁纸

一次壁纸导出会同时生成三种尺寸,它们共享 封面/海报 的品牌语言,但去掉直播专属元素,因此在屏幕共享里呈现为安静的品牌壁纸。

<p align="center">
  <img src="docs/assets/vibe-coding-wallpaper-desktop-4k.png" alt="Vibe Studio 壁纸 - 桌面 4K" width="820">
</p>

<table>
  <tr>
    <th>桌面 QHD · 2560×1440</th>
    <th>移动端 · 1290×2796</th>
  </tr>
  <tr>
    <td width="70%">
      <img src="docs/assets/vibe-coding-wallpaper-desktop-qhd.png" alt="Vibe Studio 壁纸 - 桌面 QHD">
    </td>
    <td width="30%">
      <img src="docs/assets/vibe-coding-wallpaper-mobile.png" alt="Vibe Studio 壁纸 - 移动端">
    </td>
  </tr>
</table>

## 快速开始

安装依赖:

```bash
pnpm install
```

运行应用:

```bash
pnpm dev
```

打开 `http://localhost:3000`。若该端口被占用,Next.js 会自动选择下一个可用端口并在终端打印。

默认情况下(自托管 / 本地),`/` 会重定向到 `/studio` —— 营销落地页不是入口。双语落地页只有在设置了 `VIBE_SHOWCASE=1` 的公开展示部署上,才会占用 `/`(见 `.env.example`)。无论哪种情况,应用都位于 `/studio`(完整工作区)和 `/demo`(纯浏览器本地),OBS 源在 `/obs/*` 下。

想在本地预览落地页,运行 `pnpm dev:showcase`(它会设置 `VIBE_SHOWCASE=1`),然后打开 `/`。

### AI Agent 配置指南

公开站点在 `/skill.md` 提供一份精简的 AI-Agent 交接说明。部署后,agent 可以从这里开始:

```text
Read https://<deployment-domain>/skill.md first, then follow it to run and configure Vibe Studio.
```

本地也提供同一份说明,已提交在 [`public/skill.md`](public/skill.md)。

## 常用命令

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm db:push
pnpm live:prepare
pnpm live:status
pnpm live:stop
pnpm live:restart
```

测试使用 Node.js 内置测试运行器 + `tsx`。测试文件与源码同目录,命名为 `*.test.ts`。

## OBS 与 Bilibili 直播姬设置

对于无法直接从 OBS 推流的 Bilibili 账号,把 OBS 当作合成器,再通过 OBS 虚拟摄像头把画面喂给 Bilibili 直播姬:

```text
Vibe web app -> OBS Browser Source -> OBS scene composition -> OBS Virtual Camera -> Bilibili Livehime camera source
```

用下面命令准备本地直播环境:

```bash
pnpm live:prepare
```

常用生命周期命令:

```bash
pnpm live:status    # 显示 Next / OBS / 直播姬 状态。
pnpm live:stop      # 停止 OBS 虚拟摄像头、退出 OBS、并停止本地 Next 服务。
pnpm live:restart   # 停止本地直播工具,然后重新运行 live:prepare。
```

该脚本会:

1. 确保 Next.js 应用在 `http://localhost:3000` 可用。
2. 更新匹配场景集合里名为 `Vibe Live Overlay` 的 OBS 场景。
3. 把覆盖层的 Browser Source 指向:
   - `http://localhost:3000/obs/overlay?camera=empty`
   - `http://localhost:3000/obs/overlay?camera=avatar`
4. 重置预期的 OBS 源顺序与可见性。
5. 用解析出的 profile / collection 打开 OBS,并切到 `Vibe Live Overlay` 场景。
6. 在 OBS 完成启动后开启 OBS 虚拟摄像头。
7. 打开 web app 和 Bilibili 直播姬。

脚本从不点击 Bilibili 的"开始直播"按钮。请在直播姬里手动确认标题、分区、麦克风、预览和最终开播动作。

直播时,**Composition · OBS** 控件(仅本地 / 私有 Studio —— 在覆盖层 inspector 里,并在 **Session Config → Broadcast** 里同样提供)可以为每个区域挑选源:主屏可显示显示器 1、显示器 2 或应用窗口;摄像槽可显示摄像头、第二块显示器、头像主题,或什么都不放。你可以交换两个显示器区域,并从保存的预设里恢复整套合成 —— 全部通过 obs-websocket 驱动你本地的 OBS。第二显示器这个选项,需要在 OBS 里手动加一个 macOS 屏幕捕获源,命名精确为 `Vibe Second Screen Capture` 并指向显示器 2;`pnpm live:prepare` 会把它停在摄像槽里。

`pnpm live:stop` 特意不关闭 Bilibili 直播姬,因为关闭它可能中断正在进行的直播。直播结束后请手动关闭直播姬。

重要 OBS 提示:不要用 `--startvirtualcam` 启动 OBS。在 macOS 上,这可能在摄像头系统扩展加载完成前触发 OBS 的"虚拟摄像头未安装"对话框。`pnpm live:prepare` 特意先启动 OBS、启用 obs-websocket,等 OBS 就绪后再通过 WebSocket 调用 `StartVirtualCam`。

如果 OBS 仍报告虚拟摄像头未安装:

1. 打开 `System Settings -> General -> Login Items & Extensions -> Camera Extensions`。
2. 启用 `OBS Virtual Camera`。
3. 重启 OBS,若扩展状态看起来异常则重启 macOS。
4. 再次运行 `pnpm live:prepare`。

可以用下面命令查看扩展状态:

```bash
systemextensionsctl list
```

预期条目是 `OBS Virtual Camera`,状态为 `[activated enabled]`。

## 会话持久化(Live Data 数据库)

**Session Config** 标签 —— 由 live-data 持久化层支撑 —— 可以把侧栏章节、任务、底栏分段、工具栈条目,以及直播开始 / 结束时间戳持久化到 PostgreSQL。("Live Data" 是这个持久化 / API 层的名字,不是一个页面:面向用户的标签是 **Session Config**。)如果没有配置 `DATABASE_URL`,应用会停留在本地草稿模式,继续使用 `localStorage` 加上内存里的 OBS live-state 端点。

配置数据库:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/vibe_coding_live
pnpm db:push
pnpm dev
```

Schema 在 `src/db/schema.ts`,并有一份已提交的 SQL 迁移 `drizzle/0001_live_sessions.sql`。数据库 API 挂在 `/api/sessions` 下,而 `/api/live-state` 仍是实时 OBS 桥接。

## Session Config Agent(可选 AI)

**Session Config → Agent** 标签可以调用一个真实模型来起草直播**内容**,也可以完全本地运行。它由本地 / 私有 Studio 的环境变量配置(见 `.env.example`):

```bash
SESSION_AGENT_PROVIDER=deepseek
SESSION_AGENT_BASE_URL=https://api.deepseek.com   # OpenAI-compatible base URL
SESSION_AGENT_API_KEY=sk-...                       # server only — never commit
SESSION_AGENT_MODEL=deepseek-chat                  # use the provider's current model
SESSION_AGENT_USER_AGENT=Vibe-Studio/SessionConfigAgent
```

- 适配器是 **OpenAI 兼容的 Chat Completions**,所以 DeepSeek、OpenAI、Kimi、z.ai 都能用,只需设置 `BASE_URL` + `MODEL`。示例服务商:[DeepSeek](https://api-docs.deepseek.com/)(`https://api.deepseek.com`,端点 `/chat/completions`)。
- **API key 只留在你本地 / 私有 Studio 的服务端环境变量里**(路由 `/api/session-config/agent`);它绝不进入客户端包、绝不写入 `localStorage`、绝不打日志。客户端只知道 provider / model 名称。
- **Agent 只编辑直播内容** —— 标题、副标题、章节、工具栈和话题徽标。身份与品牌(作者、头像、社交链接、主题 / 配色)是**品牌层**:设一次、每场复用、AI 永不更改。模型回复里的内容会被合并回你当前的配置,所以模型回复动不了身份或品牌。
- **没有个人信息会到达 provider。** 每次调用前(线上**以及**复制交接 prompt),配置都会被投影到那几个内容键,因此身份与品牌在载荷里根本不存在;上传的头像 / 封面图片在本地降采样,绝不外发。
- **未配置 key → 回退到本地交接**(Copy handoff)。不会发起任何 provider 请求。
- AI 输出**绝不自动应用**:返回的配置会在 JSON 抽屉里打开供你审阅 + 应用,和 Import 完全一样。
- 公开 / demo 部署不收集 API key,也无法推送到你本地的 OBS。OBS 自动化只面向你自己运行和配置的本地 / 私有 Studio。
- 在配置了 provider 的托管**展示部署**(`VIBE_SHOWCASE=1`)上,`/demo` 可以用那个 provider 运行 agent,让访客现场试用 —— 按 IP 限流(`SESSION_AGENT_RATE_LIMIT`,默认 10 次 / 小时)并限制输出(`SESSION_AGENT_MAX_TOKENS`,默认 4096)。它仍然绝不持久化到数据库、绝不发布 OBS 状态、也绝不收集访客的 key。本地 / 私有 Studio 忽略这些限制,用你自己的 key 运行。真正的兜底是给 provider 账号设一个消费上限。

## 导出流程

1. 打开覆盖层构建器。
2. 在 Overlay、Session Config、Cover、Poster、Wallpaper 标签之间切换。
3. 调整文案、章节、徽标、社交链接、直播开始时间、工具栈,以及仅壁纸使用的字段。Session Config 标签直接编辑 v1 可移植核心字段(标题、副标题、作者、profile / cover、徽标、工具栈、社交链接、章节),并把同一份配置以 JSON 暴露出来。
4. 用导出控件为封面、海报、完整覆盖层、侧栏、底栏或整套壁纸生成 PNG。
5. 当某些精修示例导出需要在本 README 展示时,把它们保留在 `docs/assets/`。

当前示例尺寸:

- 封面:`1280x720`
- 海报:`1920x1080`
- 完整覆盖层:`1920x1080`
- 侧栏:`470x760`
- 底栏:`1856x180`
- 壁纸 桌面 4K:`3840x2160`
- 壁纸 桌面 QHD:`2560x1440`
- 壁纸 移动端:`1290x2796`

当前默认社交组:

- 中文:Bilibili `Aklman`、网站 `example.com`、QQ 群 `123456789`、微信 `demo-live`、GitHub `demo-org/vibe-live`。
- 英文:YouTube `@demo-live`、网站 `example.com`、Discord `demo-live`、X `@demo_live`、GitHub `demo-org/vibe-live`。

## 项目结构

```text
src/
  app/              Next.js App Router 入口、布局与全局 CSS
  components/       构建器外壳、画布渲染器、inspector 与共享 UI
  db/               Drizzle schema、PostgreSQL 客户端与 live-data 仓储
  hooks/            Locale、键盘快捷键与时间辅助
  lib/              设计 token、i18n 字典、状态辅助与模型辅助
  utils/            PNG 导出工具
scripts/            本地自动化,如 OBS / Bilibili 直播准备
public/             应用使用的静态资源
docs/assets/        README 图片与导出示例
drizzle/            live data 持久化的 SQL 迁移
```

## 实现说明

- 应用是从 App Router 挂载的纯客户端渲染覆盖层构建器。
- 画布输出以 DOM / CSS 渲染,并用 `html-to-image` 导出。
- 导出节点常驻离屏挂载,因此 PNG 捕获使用与预览相同的渲染树。
- 状态持久化在 `localStorage`,并经 `src/stateStorage.ts` 归一化。
- 配置边界:[`live-session.config.json`](docs/live-session.config.md) 是每场直播的内容可移植核心(v1);未来的 [`studio.config.json`](docs/studio.config.md) 用于 studio 级设置(仅草案);运行时状态留在 `OverlayState` / `localStorage`。这个拆分固定在 `src/lib/session-config-boundary.ts`。配置通过手动导入 / 导出移动,而非监听文件。
- 品牌层:可复用的身份与外观 —— 作者、头像、社交链接、主题、配色 —— 作为 Studio Profile 单独持久化(`src/lib/studio-profile.ts`),在加载 / 重置时重新套用(写一次、每场复用)。它在 **Session Config** 里手动设置,AI agent 永不编辑,后者只起草每场的内容。
- `state.theme` 是应用全局的明 / 暗外观。应用外壳 UI 读取 `APP_THEME_TOKENS` 和 CSS 变量,而 `state.colors` 是用户可覆盖的直播 / 导出素材配色。切换 明 / 暗 目前会加载对应的素材预设作为产品默认;如果将来需要浅色 UI 配深色导出,应新增一个独立的 `assetPalette` 控件,而不是重载 `theme`。
- live-data 持久化层(在 Session Config 标签背后)在配置了 `DATABASE_URL` 时持久化到 PostgreSQL,否则回退到本地草稿。
- 本地化使用 `src/lib/i18n.ts` 里自定义的 `t()` 字典系统。
- `pnpm live:prepare` 会编辑 `~/Library/Application Support/obs-studio/` 下的本地 OBS 配置文件,并在改动前写入带时间戳的备份。
- 包管理仅用 pnpm。
- 即使视觉改变,重设计工作也应保留导出尺寸、OBS 路由、live-state API 行为和状态归一化。
