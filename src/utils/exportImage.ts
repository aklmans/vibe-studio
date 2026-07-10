import { toPng } from "html-to-image";
import {
  COVER_CANVAS_DIMENSIONS,
  OVERLAY_CANVAS_DIMENSIONS,
  POSTER_CANVAS_DIMENSIONS,
} from "../lib/canvas-dimensions";

interface ExportOptions {
  filename: string;
  width?: number;
  height?: number;
  backgroundColor?: string | null;
}

export async function exportElementAsPng(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { filename, width, height, backgroundColor = null } = options;

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 1,
      width,
      height,
      backgroundColor: backgroundColor ?? undefined,
      style: width && height
        ? { width: `${width}px`, height: `${height}px` }
        : undefined,
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Export failed:", err);
    throw new Error(`Failed to export ${filename}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function exportFullOverlay(
  canvasEl: HTMLElement,
  canvas: { width: number; height: number } = OVERLAY_CANVAS_DIMENSIONS,
): Promise<void> {
  // The overlay surface is layout-sized: 16:9 layouts keep the classic filename
  // and dimensions; the portrait mobile layout exports as its own asset.
  const portrait = canvas.height > canvas.width;
  await exportElementAsPng(canvasEl, {
    filename: portrait ? "vibe-coding-overlay-vertical.png" : "vibe-coding-overlay.png",
    width: canvas.width,
    height: canvas.height,
    backgroundColor: null,
  });
}

export async function exportSidebar(sidebarEl: HTMLElement): Promise<void> {
  await exportElementAsPng(sidebarEl, {
    filename: "vibe-coding-sidebar.png",
    backgroundColor: undefined,
  });
}

export async function exportBottomBar(bottomBarEl: HTMLElement): Promise<void> {
  await exportElementAsPng(bottomBarEl, {
    filename: "vibe-coding-bottom-bar.png",
    backgroundColor: undefined,
  });
}

export async function exportCover(coverEl: HTMLElement): Promise<void> {
  await exportElementAsPng(coverEl, {
    filename: "vibe-coding-cover.png",
    width: COVER_CANVAS_DIMENSIONS.width,
    height: COVER_CANVAS_DIMENSIONS.height,
    backgroundColor: null,
  });
}

export async function exportPoster(posterEl: HTMLElement): Promise<void> {
  await exportElementAsPng(posterEl, {
    filename: "vibe-coding-poster.png",
    width: POSTER_CANVAS_DIMENSIONS.width,
    height: POSTER_CANVAS_DIMENSIONS.height,
    backgroundColor: null,
  });
}

export async function exportWallpaper(
  wallpaperEl: HTMLElement,
  filename: string,
  width: number,
  height: number,
): Promise<void> {
  await exportElementAsPng(wallpaperEl, {
    filename,
    width,
    height,
    backgroundColor: null,
  });
}
