export type WallpaperPresetId = "desktop-4k" | "desktop-qhd" | "mobile";

export type WallpaperOrientation = "horizontal" | "portrait";

export interface WallpaperPreset {
  id: WallpaperPresetId;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
  orientation: WallpaperOrientation;
}

/**
 * Three target wallpaper sizes that the builder always exports together.
 * Horizontal pair shares the desktop layout (4K is the design baseline);
 * portrait is iPhone Pro Max friendly with safe-area padding for clock + dock.
 */
export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "desktop-4k",
    label: "Desktop 4K",
    shortLabel: "4K",
    width: 3840,
    height: 2160,
    orientation: "horizontal",
  },
  {
    id: "desktop-qhd",
    label: "Desktop QHD",
    shortLabel: "QHD",
    width: 2560,
    height: 1440,
    orientation: "horizontal",
  },
  {
    id: "mobile",
    label: "Mobile",
    shortLabel: "Mobile",
    width: 1290,
    height: 2796,
    orientation: "portrait",
  },
];

export const HORIZONTAL_BASE = { width: 3840, height: 2160 } as const;
export const PORTRAIT_BASE = { width: 1290, height: 2796 } as const;

export function isWallpaperPresetId(value: unknown): value is WallpaperPresetId {
  return (
    value === "desktop-4k" || value === "desktop-qhd" || value === "mobile"
  );
}

export function getWallpaperPreset(id: WallpaperPresetId): WallpaperPreset {
  return WALLPAPER_PRESETS.find((p) => p.id === id) ?? WALLPAPER_PRESETS[0];
}
