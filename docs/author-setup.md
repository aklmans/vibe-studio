# Author setup — macOS + Bilibili Livehime automation / 作者环境自动化

> **English** first, [简体中文](#简体中文) below.
>
> This is the author's personal streaming accelerator: a macOS-only script
> that derives OBS profiles/scene collections, starts the virtual camera and
> hands off to Bilibili Livehime. **None of it is required to use Vibe
> Studio** — the portable path is the 5-minute manual OBS setup in the README.

## What `pnpm live:prepare` does

```bash
pnpm live:prepare          # landscape setup
pnpm live:prepare:mobile   # portrait — derives the Vibe Vertical OBS profile + collection
pnpm live:status           # show Next / OBS / Livehime status
pnpm live:stop             # stop OBS Virtual Camera, quit OBS, stop the local Next server
pnpm live:restart          # stop, then prepare again (accepts --layout mobile)
```

The script:

1. Ensures the Next.js app is available on `http://localhost:3000`.
2. Updates the OBS scene named `Vibe Live Overlay` in the matching scene collection.
3. Points the overlay Browser Sources at:
   - `http://localhost:3000/obs/overlay?camera=empty`
   - `http://localhost:3000/obs/overlay?camera=avatar`
4. Resets the expected OBS source order and visibility.
5. Opens OBS with the resolved profile/collection and the `Vibe Live Overlay` scene.
6. Starts OBS Virtual Camera after OBS has finished launching.
7. Opens the web app and Bilibili Livehime.

The script never clicks Bilibili's start-live button. Confirm the title,
category, microphone, preview, and final start action manually in Livehime.

For Bilibili accounts that cannot push directly from OBS, the chain is:

```text
Vibe web app -> OBS Browser Source -> OBS scene composition -> OBS Virtual Camera -> Bilibili Livehime camera source
```

`pnpm live:stop` intentionally leaves Bilibili Livehime open because closing
it can interrupt an active stream. Close Livehime manually after ending the
livestream.

`pnpm live:prepare` edits local OBS config files under
`~/Library/Application Support/obs-studio/` and writes timestamped backups
before changing them.

## Second monitor in the camera slot

For the second-monitor option in Composition · OBS, add a macOS Screen
Capture source in OBS once, name it exactly `Vibe Second Screen Capture`, and
point it at display 2; `pnpm live:prepare` will keep it parked in the camera
slot.

## Portrait (`--layout mobile`)

On first run the script derives a `Vibe Vertical` OBS profile (1080×1920 base
canvas) and a `Vibe Vertical` scene collection from your landscape setup
(same scene + source names, portrait browser sources, captures parked on the
mobile rects), then opens OBS on that pair — just switch the Studio's scene
layout to Mobile.

## OBS Virtual Camera notes (macOS)

Important: do not start OBS with `--startvirtualcam`. On macOS this can
trigger OBS's "The virtual camera is not installed" dialog before the camera
system extension has finished loading. `pnpm live:prepare` intentionally
starts OBS first, enables obs-websocket, then calls `StartVirtualCam` through
WebSocket after OBS is ready.

If OBS still reports that the virtual camera is not installed:

1. Open `System Settings -> General -> Login Items & Extensions -> Camera Extensions`.
2. Enable `OBS Virtual Camera`.
3. Restart OBS, or restart macOS if the extension state looks stale.
4. Run `pnpm live:prepare` again.

Verify the extension state with:

```bash
systemextensionsctl list
```

The expected entry is `OBS Virtual Camera` with `[activated enabled]`.

---

# 简体中文

> 这是作者本人的直播加速脚本:仅限 macOS,负责派生 OBS profile / 场景集合、
> 启动虚拟摄像头并交接给 Bilibili 直播姬。**使用 Vibe Studio 不需要它** ——
> 通用路径是 README 里 5 分钟的手动 OBS 接入。

## `pnpm live:prepare` 做什么

```bash
pnpm live:prepare          # 横屏准备
pnpm live:prepare:mobile   # 竖屏 —— 自动派生 Vibe Vertical OBS profile 与场景集合
pnpm live:status           # 显示 Next / OBS / 直播姬 状态
pnpm live:stop             # 停止 OBS 虚拟摄像头、退出 OBS、停止本地 Next 服务
pnpm live:restart          # 先停止,再重新 prepare(支持 --layout mobile)
```

脚本会:

1. 确保 Next.js 应用在 `http://localhost:3000` 可用。
2. 更新匹配场景集合里名为 `Vibe Live Overlay` 的 OBS 场景。
3. 把覆盖层的 Browser Source 指向:
   - `http://localhost:3000/obs/overlay?camera=empty`
   - `http://localhost:3000/obs/overlay?camera=avatar`
4. 重置预期的 OBS 源顺序与可见性。
5. 用解析出的 profile / collection 打开 OBS,并切到 `Vibe Live Overlay` 场景。
6. 在 OBS 完成启动后开启 OBS 虚拟摄像头。
7. 打开 web app 和 Bilibili 直播姬。

脚本从不点击 Bilibili 的"开始直播"按钮。请在直播姬里手动确认标题、分区、
麦克风、预览和最终开播动作。

对于无法直接从 OBS 推流的 Bilibili 账号,链路是:

```text
Vibe web app -> OBS Browser Source -> OBS 场景合成 -> OBS 虚拟摄像头 -> Bilibili 直播姬摄像头源
```

`pnpm live:stop` 特意不关闭直播姬(关闭可能中断正在进行的直播),结束后请手动关闭。

`pnpm live:prepare` 会编辑 `~/Library/Application Support/obs-studio/` 下的
本地 OBS 配置文件,修改前会写入带时间戳的备份。

## 第二显示器进相机位

在 OBS 里手动加一个 macOS 屏幕捕获源,命名精确为
`Vibe Second Screen Capture` 并指向显示器 2;`pnpm live:prepare` 会把它停在
相机槽里,Composition · OBS 里即可选用。

## 竖屏(`--layout mobile`)

首次运行时从你的横屏配置派生出 `Vibe Vertical` OBS profile(1080×1920 基准
画布)与 `Vibe Vertical` 场景集合(场景与源名不变、browser source 竖屏视口、
捕获源停靠到竖屏槽位),然后用这对配置打开 OBS —— 你只需把 Studio 的场景布局
切到手机竖屏。

## OBS 虚拟摄像头(macOS)

不要用 `--startvirtualcam` 启动 OBS:在 macOS 上,这可能在摄像头系统扩展加载
完成前触发"虚拟摄像头未安装"对话框。脚本特意先启动 OBS、启用 obs-websocket,
等 OBS 就绪后再通过 WebSocket 调用 `StartVirtualCam`。

如果 OBS 仍报告虚拟摄像头未安装:

1. 打开 `System Settings -> General -> Login Items & Extensions -> Camera Extensions`。
2. 启用 `OBS Virtual Camera`。
3. 重启 OBS,若扩展状态异常则重启 macOS。
4. 再次运行 `pnpm live:prepare`。

用 `systemextensionsctl list` 查看扩展状态,预期条目为 `OBS Virtual Camera`
且状态 `[activated enabled]`。
