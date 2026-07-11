# 部署交接(给作者的一页说明)

目标:让"零安装体验"成为分发主入口。两条路径按需选,都不需要改代码。

## 路径 A:Vercel 公开展示站(推荐先做这个)

1. 打开 <https://vercel.com/new>,导入 `aklmans/vibe-studio` 仓库(或直接用 README 里的 Deploy 按钮)。
2. Framework 自动识别为 Next.js,构建命令/输出保持默认(Vercel 原生支持 pnpm,会读取 `pnpm-lock.yaml`)。
3. 环境变量(Production):
   - `VIBE_SHOWCASE=1` —— 让 `/` 出落地页,`/demo` 可公开试玩。
   - `NEXT_PUBLIC_SITE_URL=https://vibe-studio.aklman.com`(或最终域名)。
   - 可选(让访客能试 Agent):`SESSION_AGENT_PROVIDER` / `SESSION_AGENT_BASE_URL` / `SESSION_AGENT_API_KEY` / `SESSION_AGENT_MODEL`。
   - 建议同时设 `SESSION_AGENT_RATE_LIMIT=10`、`SESSION_AGENT_MAX_TOKENS=4096`(不设时即这两个默认值),**并在 provider 后台设消费上限**——这是真正的兜底。
   - 不要设 `DATABASE_URL`,展示站不需要持久化。
4. 绑定域名:Vercel 项目 → Settings → Domains → 添加 `vibe-studio.aklman.com`,按提示在 DNS 加 CNAME。
5. 部署完成后的验收清单:
   - `/` 出落地页;`/demo` 可编辑、可导出;`/studio` 可达(展示站上它是共享演示环境,live-state 写入已被 404 屏蔽)。
   - `/skill.md` 可访问(落地页 "Copy agent prompt" 用的就是它)。
   - `/api/obs/composition` 返回 404(展示站防护生效)。
   - 若配了 Agent key:在 `/demo` 跑一次 Generate config,确认限流文案正常。
6. 把落地页/README 里的体验链接换成正式域名,发到目标社区。

## 路径 B:Docker 自托管(私有完整版)

```bash
# 仅应用(localStorage 草稿模式)
docker compose up --build

# 应用 + PostgreSQL(首次需要建表)
docker compose --profile db up --build
DATABASE_URL=postgres://vibe:vibe@localhost:5432/vibe_coding_live pnpm db:push
```

- 环境变量在 `docker-compose.yml` 的 `app.environment` 里按需取消注释;私有部署**不要**设 `VIBE_SHOWCASE`。
- 镜像基于 `next.config.ts` 的 `output: "standalone"`,运行时只有 `node server.js`,无 node_modules。
- OBS 侧照常:browser source 指向 `http://<主机>:3000/obs/*`。

## 已知边界(本次不做)

- 多租户:`/studio` 与 `/api/live-state` 是单用户设计;公开展示站上 `/studio` 是共享演示环境(写 OBS live-state 已禁用),不要把它当成给访客的私有工作台。
- 桌面打包(Electron/Tauri)未做,如需离线单文件分发再立项。
