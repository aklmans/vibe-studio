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

## 部署

试用 Vibe Studio 并不需要在终端里安装——部署一次,分享 URL 即可。完整的分步说明(含公开展示站的检查清单)见 [`docs/deploy.md`](docs/deploy.md)。

**Vercel**(一键,无需数据库):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faklmans%2Fvibe-studio)

**Docker**(自托管):

```bash
docker compose up --build              # 仅应用(localStorage 草稿模式)
docker compose --profile db up --build # 应用 + PostgreSQL 持久化
```

所有环境变量均为可选;一个都不设也能运行:

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 持久化(首次需执行 `pnpm db:push`)。不设 = localStorage 草稿模式。 |
| `SESSION_AGENT_PROVIDER` / `SESSION_AGENT_BASE_URL` / `SESSION_AGENT_API_KEY` / `SESSION_AGENT_MODEL` | 服务端 AI agent。不设 = 本地复制交接兜底。 |
| `VIBE_SHOWCASE` | `1` 时 `/` 提供营销落地页并启用演示防护。不设 = `/` 重定向到 `/studio`。 |
| `SESSION_AGENT_RATE_LIMIT` / `SESSION_AGENT_MAX_TOKENS` | 仅展示站生效的 agent 滥用防护。 |
| `NEXT_PUBLIC_SITE_URL` | 页面元数据中的规范 URL。 |

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

## 上屏(OBS)—— 5 分钟,任何系统

覆盖层就是一张透明网页;OBS(或任何支持 browser source 的工具)把它渲染在你的真实画面之上。这一节没有任何 macOS / Bilibili 专属内容。

1. 运行应用(`pnpm dev`),或使用你的部署 URL。
2. 在 OBS 里把画布设为 1920×1080(`设置 → 视频`);手机竖屏布局则设为 1080×1920。
3. 添加一个 **浏览器源(Browser source)**:
   - URL:`http://localhost:3000/obs/overlay?camera=empty`(`?camera=avatar` 会在相机位画出头像主题)
   - 宽 1920 × 高 1080(竖屏:1080 × 1920)
4. 把真实源(屏幕捕获、摄像头、游戏)放在覆盖层**下方** —— 布局的主画面 / 相机区域是透明挖洞。
5. 想自己拼画面,可用切片源:`/obs/sidebar`(470×760)与 `/obs/bottom-bar`(1856×180)。
6. Studio 里的修改会实时推送到浏览器源(SSE),无需刷新。

直播时,**Composition · OBS** 控件(仅本地 / 私有 Studio —— 在覆盖层检查器,并镜像于 **Session Config → Broadcast**)可通过 obs-websocket 驱动你本地的 OBS:为主画面与相机位挑选源、交换显示器区域、恢复保存的合成。它是可选的 —— OBS 不可达时整组只是一行安静的"连接 OBS"。

**macOS + Bilibili 直播姬自动化**(作者自己的环境:`pnpm live:prepare` 全家桶 —— profile / 场景派生、OBS 虚拟摄像头、直播姬交接、第二屏接线)见 [`docs/author-setup.md`](docs/author-setup.md)。

## 场景布局

覆盖层由布局驱动:**场景布局**决定存在哪些区域(透明的、由 OBS 填充的挖洞)与面板(覆盖层自己绘制的框),以及各自的位置。在覆盖层 inspector 或 **Session Config → Broadcast** 里选择布局,再给每个区域挑选源。几何的单一真源在 `src/lib/overlay-layout.ts`。

- **工作台**(1920×1080)—— 经典编程直播框架:主捕获在左、侧栏右上、摄像头(或当前焦点卡)右下、底栏在下。
- **讲座 · 左 / 右**(1920×1080)—— 讲座框架:顶部 header 条(品牌 Logo + 系列名,外加本场话题与开播后的日期 + LIVE 徽章)、讲者列(摄像头在上、讲者卡在下:本场标题、讲者姓名与头衔行)、以及精确 16:9 的幻灯片区。每节可选填**讲者**——讲师卡会介绍当前节的嘉宾(附一行安静的『主持 ·』署名),未填则回落到主持人。
- **手机竖屏**(1080×1920)—— 自上而下拼接的竖版框架:header、屏幕分享(主区域)、其下的摄像头、纤细底栏、底部讲者卡。两个区域都是 OBS 填充的挖洞,合成控件可用。macOS 上可用 `pnpm live:prepare:mobile` 自动派生竖屏 OBS profile / 场景集合(见 [`docs/author-setup.md`](docs/author-setup.md));任何系统上,把 OBS 画布设为 1080×1920 并按上文添加浏览器源即可。也可导出为图片框架供手机 App 推流使用。

每类布局拥有**独立的底栏**:工作台底栏(开播 / 进度 / 栈)、讲座底栏(开播 / **议程** / **关注**,左右两个讲座镜像共用一份)与竖屏底栏是三份互不影响的数据 —— 改其中一份绝不会碰到另外两份;切换布局只是切换正在渲染与编辑的那一份。议程段直接从你的章节渲染"当前第 n/N 节 + 本节已用时 / 计划时长 + 下一节" —— 每节可选填计划时长(分钟,属 v1 内容,Agent 起草时可一并安排),每次切节都会重计本节时间;关注段展示你指定的社交账号(未指定则回退到第一个可见)。所有段落类型在任何布局的底栏编辑器里都可选用。

**议程与场景布局绑定**:每个场景 profile(工作台 / 讲座 / 竖屏)拥有完全独立的议程 —— 各自的节列表、完成标记、当前节与本节计时,键位与底栏一致。切换布局即切换渲染与编辑的那份议程;讲座的流程绝不会漏进工作台侧栏(反之亦然),且每个场景的本节计时跨布局切换持续运行。v1 配置中的 `sections` 是**当前场景**的流程 —— 导入、导出与 AI 编辑都作用于当前场景,不打扰其他场景的议程。旧版状态会把已有议程迁移到工作台 profile;讲座与竖屏则以各自的默认(纯"标题+时长"条目)起步。

单份议程最多 **12 节**,条目(bullets)可选 —— 纯议程条目就是"标题 + 计划时长"。共享的章节管理器(Overlay 检查器与 **Session Config → Session**,标题都注明当前编辑的场景)负责节与条目的增、删、排序;每次结构变更都原子地维护当前节、逐条完成标记,以及同一 profile 的进度段所指向的节。在管理器里选中某节只是选择编辑对象 —— 直播推进只发生在 Broadcast 的议程推进台;管理器里当前直播中的节带有安静的标记。工作台广播画布上,侧栏从当前节起显示 **3 节滑动窗口**(靠尾部时回拉保持满窗),超过 3 节时出现小的 `0X–0Y / 0Z` 指示;不超过 3 节则与以前逐像素一致。

讲座布局中,讲者卡在讲者信息之下带有**流程清单**:编号行 + 计划分钟。完成是**手动**的 —— 主持人在章节管理器或议程推进台里勾掉某节;推进到下一节绝不会自动标记上一节。勾过的节呈完成态(强调色勾 + 划线),当前节带强调色 rail 与实时"已用 / 计划"计时,其余节保持安静。超过 5 节时与侧栏一样滑窗,并带同款 mono 指示。

**Session Config → Broadcast → 议程推进**是直播中的控制台:上一节 / 下一节(每次推进重计本节时间)、任意跳节、原地重计时,以及关注位账号选择。

讲座的 header 与讲者卡读取**品牌层**(Session Config → Session):Logo、系列 / 栏目名、讲者头衔行 —— 写一次每场复用,AI 永不编辑。

## 会话持久化(Live Data 数据库)

**Session Config** 标签 —— 由 live-data 持久化层支撑 —— 可以把侧栏章节、任务、底栏分段、工具栈条目,以及直播开始 / 结束时间戳持久化到 PostgreSQL。("Live Data" 是这个持久化 / API 层的名字,不是一个页面:面向用户的标签是 **Session Config**。)如果没有配置 `DATABASE_URL`,应用会停留在本地草稿模式,继续使用 `localStorage` 加上内存里的 OBS live-state 端点。

配置数据库:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/vibe_coding_live
pnpm db:push
pnpm dev
```

Schema 在 `src/db/schema.ts`,SQL 迁移已提交在 `drizzle/` 下(至 `0006_section_done.sql` —— 场景独立议程 + 手动完成标记)。数据库 API 挂在 `/api/sessions` 下,而 `/api/live-state` 仍是实时 OBS 桥接。

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
- **Agent 只编辑直播内容** —— 标题、副标题、章节(含每节可选的计划时长)、工具栈和话题徽标。身份与品牌(作者、头像、社交链接、主题 / 配色)是**品牌层**:设一次、每场复用、AI 永不更改。模型回复里的内容会被合并回你当前的配置,所以模型回复动不了身份或品牌。
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
- 完整覆盖层:`1920x1080`(16:9 布局)
- 完整覆盖层 · 手机竖屏布局:`1080x1920`
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
- 配置边界:[`live-session.config.json`](docs/live-session.config.md) 是每场直播的内容可移植核心(v1);未来的 [`studio.config.json`](docs/internal/studio.config.md) 用于 studio 级设置(仅草案);运行时状态留在 `OverlayState` / `localStorage`。这个拆分固定在 `src/lib/session-config-boundary.ts`。配置通过手动导入 / 导出移动,而非监听文件。
- 品牌层:可复用的身份与外观 —— 作者、头像、社交链接、主题、配色,以及讲座 header 字段(Logo、系列名、讲者头衔行)—— 作为 Studio Profile 单独持久化(`src/lib/studio-profile.ts`),在加载 / 重置时重新套用(写一次、每场复用)。它在 **Session Config** 里手动设置,AI agent 永不编辑,后者只起草每场的内容。
- `state.theme` 是应用全局的明 / 暗外观。应用外壳 UI 读取 `APP_THEME_TOKENS` 和 CSS 变量,而 `state.colors` 是用户可覆盖的直播 / 导出素材配色。切换 明 / 暗 目前会加载对应的素材预设作为产品默认;如果将来需要浅色 UI 配深色导出,应新增一个独立的 `assetPalette` 控件,而不是重载 `theme`。
- live-data 持久化层(在 Session Config 标签背后)在配置了 `DATABASE_URL` 时持久化到 PostgreSQL,否则回退到本地草稿。
- 本地化使用 `src/lib/i18n.ts` 里自定义的 `t()` 字典系统。
- `pnpm live:prepare` 会编辑 `~/Library/Application Support/obs-studio/` 下的本地 OBS 配置文件,并在改动前写入带时间戳的备份。
- 包管理仅用 pnpm。
- 即使视觉改变,重设计工作也应保留导出尺寸、OBS 路由、live-state API 行为和状态归一化。
