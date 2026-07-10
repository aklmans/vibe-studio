/*
 * The single source of truth for overlay geometry.
 *
 * A layout answers "where do the regions and panels sit"; the composition layer
 * (obs-composition.ts) answers "which source goes in which region". Layout +
 * composition = the scene.
 *
 * Everything that used to hardcode these numbers now reads them from here:
 *   - OverlayCanvas.tsx   renders the backdrop cutouts + panels
 *   - live-prepare.ts     writes the offline OBS scene-collection transforms
 *   - obs-composition.ts  builds live obs-websocket transforms, and infers
 *                         which region a capture currently occupies
 *   - canvas-dimensions / obs-sources  size the overlay surface
 *
 * Pure and client-safe: no imports, no node APIs. Geometry is in canvas
 * coordinates (top-left origin), so `regions` map 1:1 onto OBS scene-item
 * positions when the OBS base canvas matches `canvas`.
 */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Regions OBS fills with a real capture — drawn as transparent cutouts. */
export type RegionId = "main" | "camera";

/** Chrome the overlay itself draws. A layout declares which ones it has. */
export type PanelId = "sidebar" | "bottomBar" | "cameraPanel";

/** Only the current layout ships today; lecture-* and mobile widen this union. */
export type LayoutId = "workbench";

export interface OverlayLayout {
  id: LayoutId;
  canvas: { width: number; height: number };
  /** Transparent cutouts. OBS source transforms derive from these. */
  regions: Record<RegionId, Rect>;
  /** Absent key = this layout has no such panel (drives the visibility UI). */
  panels: Partial<Record<PanelId, Rect>>;
}

const EDGE = 24;
const WORKBENCH_MAIN: Rect = { left: EDGE, top: EDGE, width: 1440, height: 810 };
const WORKBENCH_BOTTOM_TOP = WORKBENCH_MAIN.top + WORKBENCH_MAIN.height + EDGE;

/**
 * The layout Vibe Studio has always rendered: main capture left, sidebar top
 * right, camera (or the current-focus card) bottom right, bottom bar beneath
 * the main frame. Pinned field-by-field in overlay-layout.test.ts.
 */
export const WORKBENCH_LAYOUT: OverlayLayout = {
  id: "workbench",
  canvas: { width: 1920, height: 1080 },
  regions: {
    main: WORKBENCH_MAIN,
    // Inset inside the camera panel's window chrome, hence not flush with it.
    camera: { left: 1498, top: 786, width: 400, height: 272 },
  },
  panels: {
    sidebar: { left: 1496, top: EDGE, width: 400, height: 708 },
    cameraPanel: { left: 1496, top: 756, width: 400, height: 300 },
    bottomBar: {
      left: EDGE,
      top: WORKBENCH_BOTTOM_TOP,
      width: WORKBENCH_MAIN.width,
      height: 1080 - WORKBENCH_BOTTOM_TOP - EDGE,
    },
  },
};

export const DEFAULT_LAYOUT_ID: LayoutId = "workbench";

export const LAYOUTS: Record<LayoutId, OverlayLayout> = {
  workbench: WORKBENCH_LAYOUT,
};

export function getLayout(id: LayoutId = DEFAULT_LAYOUT_ID): OverlayLayout {
  return LAYOUTS[id];
}
