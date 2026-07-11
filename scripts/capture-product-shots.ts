/*
 * Regenerate the landing + README product imagery from the SHIPPED product.
 *
 * Everything is captured through the app's own pipelines — canvas assets go
 * through the real Export downloads, UI shots are exact-viewport screenshots,
 * and the OBS composition uses the real /obs/overlay route fed via the
 * live-state bridge. No hand-mocked pixels.
 *
 * Prerequisites:
 *   1. A running dev server:  pnpm dev            (default BASE http://localhost:3000)
 *   2. Google Chrome installed (used via playwright-core's "chrome" channel),
 *      or set PLAYWRIGHT_EXECUTABLE to a Chromium binary.
 *   3. Optional: SESSION_AGENT_* configured in .env.local — the agent shots
 *      are skipped (with a warning) when no provider is configured.
 *
 * Usage:
 *   pnpm shots                 # capture everything, place files, build variants
 *   ONLY=slices pnpm shots     # one step: exports | vertical | agent | obs | slices
 *   BASE=http://localhost:3100 pnpm shots
 *
 * Output map (dark + light where applicable):
 *   public/product/<name>-{dark,light}.png   — landing sources
 *   public/product/<name>.png                — un-suffixed mirrors (dark set)
 *   docs/assets/<name>.png                   — README previews (dark set)
 * followed by scripts/optimize-landing-images.ts for avif/webp variants.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type Page } from "playwright-core";

import { DEMO_STATE_BY_LOCALE, type OverlayState } from "../src/types.ts";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ONLY = process.env.ONLY ?? "";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const PRODUCT_DIR = path.join(repoRoot, "public/product");
const README_DIR = path.join(repoRoot, "docs/assets");
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-shots-"));

const THEMES = ["dark", "light"] as const;
type Theme = (typeof THEMES)[number];

/** Names that mirror into the un-suffixed public/product and README sets. */
const README_SET = [
  "vibe-coding-overlay",
  "vibe-coding-cover",
  "vibe-coding-poster",
  "vibe-coding-sidebar",
  "vibe-coding-bottom-bar",
  "vibe-coding-wallpaper-desktop-4k",
  "vibe-coding-wallpaper-desktop-qhd",
  "vibe-coding-wallpaper-mobile",
] as const;
const UNSUFFIXED_SET = [
  "vibe-coding-overlay",
  "vibe-coding-cover",
  "vibe-coding-poster",
  "vibe-coding-sidebar",
  "vibe-coding-bottom-bar",
] as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const want = (step: string) => !ONLY || ONLY === step;
const shot = (name: string, theme: Theme) => path.join(workDir, `${name}-${theme}.png`);

/**
 * The staged showcase state: the EN demo seed on the lecture layout with a
 * six-section timed run of show — two sections checked off, the live pointer
 * on a guest-speaker section, section + on-air timers running.
 */
function stagedState(): OverlayState {
  const base = structuredClone(DEMO_STATE_BY_LOCALE.en);
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

  base.layout = "lecture-left";
  base.liveSession.startedAt = minutesAgo(23);
  base.sidebar.agendas.lecture = {
    activeSection: 2,
    activeSectionStartedAt: minutesAgo(7),
    sections: [
      { title: "Opening & housekeeping", minutes: 5, bullets: [] },
      { title: "Why long-running agents fail", minutes: 15, bullets: [] },
      {
        title: "Guest deep-dive: context engineering",
        minutes: 20,
        bullets: [],
        speaker: "Prof. Lin",
        speakerLines: ["School of Computing · Professor", "Author of “Systems by Design”"],
      },
      { title: "Live build: agenda-driven overlay", minutes: 15, bullets: [] },
      { title: "Q&A with chat", minutes: 10, bullets: [] },
      { title: "Wrap-up & next stream", minutes: 5, bullets: [] },
    ],
    sectionsDone: [[], [], [], [], [], []],
    completed: [true, true, false, false, false, false],
  };
  base.sidebar.agendas.workbench = {
    ...base.sidebar.agendas.workbench,
    activeSection: 1,
    activeSectionStartedAt: minutesAgo(4),
  };
  return base;
}

async function newPage(
  browser: Browser,
  options: { width: number; height: number; scale?: number; theme: Theme },
) {
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.scale ?? 2,
    acceptDownloads: true,
  });
  await context.addInitScript(
    ([state, theme]: [OverlayState, Theme]) => {
      const staged = JSON.parse(JSON.stringify(state)) as { theme: string };
      staged.theme = theme;
      window.localStorage.setItem("vibe-overlay-state", JSON.stringify(staged));
      window.localStorage.setItem("vibe-overlay-locale", "en");
    },
    [stagedState(), options.theme] as [OverlayState, Theme],
  );
  const page = await context.newPage();
  return { context, page };
}

/** Colors are a per-theme palette; flipping via the real toggle applies it. */
async function ensureTheme(page: Page, theme: Theme) {
  const current = await page.evaluate(
    () => (JSON.parse(localStorage.getItem("vibe-overlay-state") ?? "{}") as { theme?: string }).theme,
  );
  if (current !== theme) {
    await page.click('[data-testid="btn-toggle-theme"]');
    await sleep(400);
  }
}

async function exportAll(page: Page, theme: Theme) {
  const wanted: Record<string, string> = {
    "-overlay-": "vibe-coding-overlay",
    "-cover-": "vibe-coding-cover",
    "-poster-": "vibe-coding-poster",
    "-sidebar-": "vibe-coding-sidebar",
    "-bottom-bar-": "vibe-coding-bottom-bar",
    "-wallpaper-desktop-4k-": "vibe-coding-wallpaper-desktop-4k",
    "-wallpaper-desktop-qhd-": "vibe-coding-wallpaper-desktop-qhd",
    "-wallpaper-mobile-": "vibe-coding-wallpaper-mobile",
  };
  await page.click('[data-testid="btn-export-menu-toggle"]');
  await sleep(300);
  const downloads: import("playwright-core").Download[] = [];
  page.on("download", (download) => downloads.push(download));
  await page.click('[data-testid="export-menu-all"]');
  const deadline = Date.now() + 120_000;
  while (downloads.length < 8 && Date.now() < deadline) await sleep(500);
  if (downloads.length < 8) throw new Error(`Export All produced ${downloads.length}/8 downloads`);
  for (const download of downloads) {
    const name = download.suggestedFilename();
    for (const [fragment, out] of Object.entries(wanted)) {
      if (name.includes(fragment)) await download.saveAs(shot(out, theme));
    }
  }
}

async function agentConfigured(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE}/api/session-config/agent`);
    const data = (await response.json()) as { configured?: boolean };
    return data.configured === true;
  } catch {
    return false;
  }
}

async function main() {
  // Fail fast when the dev server isn't up — every step needs it.
  try {
    await fetch(BASE);
  } catch {
    throw new Error(`No server at ${BASE}. Start one with: pnpm dev (or pass BASE=...)`);
  }

  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE;
  const browser = await chromium.launch(
    executablePath ? { executablePath } : { channel: "chrome" },
  );

  for (const theme of THEMES) {
    // 1. Canvas assets through the app's own Export All pipeline.
    if (want("exports")) {
      const { context, page } = await newPage(browser, { width: 1700, height: 1000, theme });
      await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
      await ensureTheme(page, theme);
      await sleep(800);
      await exportAll(page, theme);
      console.log(theme, "exports: ok");
      await context.close();
    }

    // 2. Vertical overlay (mobile layout) — the fifth gallery entry.
    if (want("vertical")) {
      const { context, page } = await newPage(browser, { width: 1700, height: 1000, theme });
      await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
      await ensureTheme(page, theme);
      await page.click('[data-testid="layout-mobile"]');
      await sleep(600);
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60_000 }),
        page.click('[data-testid="btn-export-primary"]'),
      ]);
      await download.saveAs(shot("vibe-coding-overlay-vertical", theme));
      console.log(theme, "vertical: ok");
      await context.close();
    }

    // 3+4. Agent proposal + JSON review drawer (needs a configured provider).
    if (want("agent")) {
      if (!(await agentConfigured())) {
        console.warn(theme, "agent: SKIPPED — no provider configured (SESSION_AGENT_* in .env.local)");
      } else {
        const { context, page } = await newPage(browser, { width: 1980, height: 1064, theme });
        await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
        await ensureTheme(page, theme);
        await page.click('[data-testid="tab-live"]');
        await sleep(400);
        await page.click('[data-testid="config-mode-agent"]');
        await sleep(400);
        await page.fill(
          '[data-testid="agent-brief-input"]',
          "60-minute lecture: long-running agents in production — guest deep-dive by Prof. Lin, live build, Q&A.",
        );
        await page.click('[data-testid="agent-run-ai"]');
        await page.waitForSelector('[data-testid="agent-proposal-apply"]', { timeout: 90_000 });
        await sleep(600);
        await page.screenshot({ path: shot("agent-proposal", theme) });
        await page.click('[data-testid="agent-proposal-review"]');
        await page.waitForSelector('[data-testid="config-input"]', { timeout: 15_000 });
        await sleep(600);
        await page.screenshot({ path: shot("json-drawer-review", theme) });
        console.log(theme, "agent + drawer: ok");
        await context.close();
      }
    }

    // 5. OBS composition: the real /obs/overlay route with the exported cover
    //    parked in the slides region as the "shared screen".
    if (want("obs")) {
      const coverPath = shot("vibe-coding-cover", theme);
      if (!fs.existsSync(coverPath)) {
        console.warn(theme, "obs: SKIPPED — needs the cover export (run the exports step first)");
      } else {
        const { context, page } = await newPage(browser, { width: 1920, height: 1080, scale: 1, theme });
        await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
        await ensureTheme(page, theme);
        await sleep(400);
        const staged = await page.evaluate(() => JSON.parse(localStorage.getItem("vibe-overlay-state") ?? "{}"));
        const response = await page.request.patch(`${BASE}/api/live-state`, {
          data: { state: staged, locale: "en" },
        });
        if (!response.ok()) throw new Error(`live-state PATCH failed: ${response.status()}`);
        // The OBS route holds an SSE stream open — networkidle never fires.
        await page.goto(`${BASE}/obs/overlay?camera=avatar`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector('[data-testid="obs-source-overlay"]', { timeout: 20_000 });
        await sleep(1500);
        const slide = fs.readFileSync(coverPath).toString("base64");
        await page.evaluate((b64: string) => {
          const img = document.createElement("img");
          img.src = `data:image/png;base64,${b64}`;
          // lecture-left main region: left 488, top 144, 1408×792 (16:9).
          Object.assign(img.style, {
            position: "fixed",
            left: "488px",
            top: "144px",
            width: "1408px",
            height: "792px",
            objectFit: "cover",
            zIndex: "-1",
          });
          document.body.prepend(img);
          document.body.style.background = "#0b0a09";
        }, slide);
        await sleep(600);
        await page.screenshot({ path: shot("obs-main-screen", theme) });
        console.log(theme, "obs composition: ok");
        await context.close();
      }
    }

    // 6. Sidebar + bottom-bar slices look their best on the classic workbench
    //    agenda (bullets, progress), not the lecture's bullet-less run of show.
    if (want("slices")) {
      const { context, page } = await newPage(browser, { width: 1700, height: 1000, theme });
      await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
      await ensureTheme(page, theme);
      await page.click('[data-testid="layout-workbench"]');
      await sleep(600);
      for (const [kind, out] of [
        ["sidebar", "vibe-coding-sidebar"],
        ["bottom-bar", "vibe-coding-bottom-bar"],
      ] as const) {
        await page.click('[data-testid="btn-export-menu-toggle"]');
        await sleep(300);
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 60_000 }),
          page.click(`[data-testid="export-menu-${kind}"]`),
        ]);
        await download.saveAs(shot(out, theme));
        await sleep(400);
      }
      console.log(theme, "workbench slices: ok");
      await context.close();
    }
  }

  await browser.close();

  // Place captured files into their tracked destinations.
  let placed = 0;
  for (const file of fs.readdirSync(workDir)) {
    const match = file.match(/^(.*)-(dark|light)\.png$/);
    if (!match) continue;
    const [, name, theme] = match;
    fs.copyFileSync(path.join(workDir, file), path.join(PRODUCT_DIR, file));
    placed++;
    if (theme === "dark") {
      if ((UNSUFFIXED_SET as readonly string[]).includes(name)) {
        fs.copyFileSync(path.join(workDir, file), path.join(PRODUCT_DIR, `${name}.png`));
      }
      if ((README_SET as readonly string[]).includes(name)) {
        fs.copyFileSync(path.join(workDir, file), path.join(README_DIR, `${name}.png`));
      }
    }
  }
  console.log(`Placed ${placed} captures into public/product (+ README mirrors).`);

  // Landing needs avif/webp variants for everything content.ts references.
  if (!ONLY) {
    const result = spawnSync("pnpm", ["exec", "tsx", "scripts/optimize-landing-images.ts"], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    if (result.status !== 0) throw new Error("optimize-landing-images failed");
  } else {
    console.log("Partial run — regenerate variants with: pnpm exec tsx scripts/optimize-landing-images.ts");
  }
}

main().catch((error: unknown) => {
  console.error("capture failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
