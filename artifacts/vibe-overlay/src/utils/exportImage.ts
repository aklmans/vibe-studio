import { toPng } from "html-to-image";

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

export async function exportFullOverlay(canvasEl: HTMLElement): Promise<void> {
  await exportElementAsPng(canvasEl, {
    filename: "vibe-coding-overlay.png",
    width: 1920,
    height: 1080,
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
    width: 1920,
    height: 1080,
    backgroundColor: null,
  });
}

export async function exportPoster(posterEl: HTMLElement): Promise<void> {
  await exportElementAsPng(posterEl, {
    filename: "vibe-coding-poster.png",
    width: 1920,
    height: 1080,
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
