import { WORKBENCH_LAYOUT } from "./overlay-layout";

/** The overlay surface is layout-sized; cover/poster are their own canvases. */
export const OVERLAY_CANVAS_DIMENSIONS = WORKBENCH_LAYOUT.canvas;

export const COVER_CANVAS_DIMENSIONS = {
  width: 1280,
  height: 720,
} as const;

export const POSTER_CANVAS_DIMENSIONS = {
  width: 1920,
  height: 1080,
} as const;
