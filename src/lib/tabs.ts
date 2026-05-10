export const APP_TABS = [
  "overlay",
  "live",
  "cover",
  "poster",
  "wallpaper",
] as const;

export type AppTab = (typeof APP_TABS)[number];

export const CANVAS_TABS = ["overlay", "cover", "poster", "wallpaper"] as const;

export type CanvasTab = (typeof CANVAS_TABS)[number];

export function isAppTab(value: unknown): value is AppTab {
  return APP_TABS.includes(value as AppTab);
}

export function isCanvasTab(value: unknown): value is CanvasTab {
  return CANVAS_TABS.includes(value as CanvasTab);
}
