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
export type PanelId = "header" | "sidebar" | "intro" | "bottomBar" | "cameraPanel";

export type LayoutId = "workbench" | "lecture-left" | "lecture-right" | "mobile";

export interface OverlayLayout {
  id: LayoutId;
  canvas: { width: number; height: number };
  /**
   * Transparent cutouts. OBS source transforms derive from these. `camera` is
   * absent on layouts without a separate camera slot (mobile: the phone app's
   * own video fills the main region, and there is no local-OBS composition).
   */
  regions: { main: Rect; camera?: Rect };
  /** Absent key = this layout has no such panel (drives the visibility UI). */
  panels: Partial<Record<PanelId, Rect>>;
}

const EDGE = 24;
const GAP = 24;

/** The camera panel is a window: a 2px border and a 28px titlebar wrap the hole. */
const CAMERA_CHROME_BORDER = 2;
const CAMERA_CHROME_TITLEBAR = 28;

/**
 * The transparent camera cutout implied by a camera panel's chrome. Deriving it
 * (rather than writing both rects by hand) is what keeps the hole and the window
 * from drifting apart — the bug the old cross-file "must match" comment guarded.
 */
export function cameraCutoutFor(panel: Rect): Rect {
  return {
    left: panel.left + CAMERA_CHROME_BORDER,
    top: panel.top + CAMERA_CHROME_BORDER + CAMERA_CHROME_TITLEBAR,
    width: panel.width,
    height: panel.height - CAMERA_CHROME_TITLEBAR,
  };
}

// ─── workbench ──────────────────────────────────────────────────────────────

const WORKBENCH_MAIN: Rect = { left: EDGE, top: EDGE, width: 1440, height: 810 };
const WORKBENCH_CAMERA_PANEL: Rect = { left: 1496, top: 756, width: 400, height: 300 };
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
    camera: cameraCutoutFor(WORKBENCH_CAMERA_PANEL),
  },
  panels: {
    sidebar: { left: 1496, top: EDGE, width: 400, height: 708 },
    cameraPanel: WORKBENCH_CAMERA_PANEL,
    bottomBar: {
      left: EDGE,
      top: WORKBENCH_BOTTOM_TOP,
      width: WORKBENCH_MAIN.width,
      height: 1080 - WORKBENCH_BOTTOM_TOP - EDGE,
    },
  },
};

// ─── lecture ────────────────────────────────────────────────────────────────
//
// A header band across the top, a presenter column on one side (camera above an
// intro card), and the main capture — the slides — filling the rest at an exact
// 16:9. There is no sidebar: the intro card is the presenter's identity, and the
// slides carry the content.

const HEADER_HEIGHT = 96;
const LECTURE_CONTENT_TOP = EDGE + HEADER_HEIGHT + GAP; // 144
const LECTURE_CONTENT_BOTTOM = 1080 - EDGE; // 1056
const LECTURE_COLUMN_WIDTH = 440;
const LECTURE_MAIN: { width: number; height: number } = { width: 1408, height: 792 }; // 16:9
const LECTURE_CAMERA_PANEL_HEIGHT = 280;
const LECTURE_INTRO_TOP = LECTURE_CONTENT_TOP + LECTURE_CAMERA_PANEL_HEIGHT + GAP; // 448
const LECTURE_BOTTOM_TOP = LECTURE_CONTENT_TOP + LECTURE_MAIN.height + GAP; // 960

const LECTURE_HEADER: Rect = { left: EDGE, top: EDGE, width: 1920 - EDGE * 2, height: HEADER_HEIGHT };
const LECTURE_BOTTOM_HEIGHT = LECTURE_CONTENT_BOTTOM - LECTURE_BOTTOM_TOP; // 96
const LECTURE_INTRO_HEIGHT = LECTURE_CONTENT_BOTTOM - LECTURE_INTRO_TOP; // 608

/** Column on the left, slides on the right. */
const LECTURE_LEFT_COLUMN_X = EDGE; // 24
const LECTURE_LEFT_MAIN_X = EDGE + LECTURE_COLUMN_WIDTH + GAP; // 488

/** Slides on the left, column on the right. */
const LECTURE_RIGHT_MAIN_X = EDGE; // 24
const LECTURE_RIGHT_COLUMN_X = 1920 - EDGE - LECTURE_COLUMN_WIDTH; // 1456

function lectureLayout(id: LayoutId, columnX: number, mainX: number): OverlayLayout {
  const cameraPanel: Rect = {
    left: columnX,
    top: LECTURE_CONTENT_TOP,
    width: LECTURE_COLUMN_WIDTH,
    height: LECTURE_CAMERA_PANEL_HEIGHT,
  };
  return {
    id,
    canvas: { width: 1920, height: 1080 },
    regions: {
      main: { left: mainX, top: LECTURE_CONTENT_TOP, ...LECTURE_MAIN },
      camera: cameraCutoutFor(cameraPanel),
    },
    panels: {
      header: LECTURE_HEADER,
      cameraPanel,
      intro: {
        left: columnX,
        top: LECTURE_INTRO_TOP,
        width: LECTURE_COLUMN_WIDTH,
        height: LECTURE_INTRO_HEIGHT,
      },
      bottomBar: {
        left: mainX,
        top: LECTURE_BOTTOM_TOP,
        width: LECTURE_MAIN.width,
        height: LECTURE_BOTTOM_HEIGHT,
      },
    },
  };
}

export const LECTURE_LEFT_LAYOUT = lectureLayout(
  "lecture-left",
  LECTURE_LEFT_COLUMN_X,
  LECTURE_LEFT_MAIN_X,
);

export const LECTURE_RIGHT_LAYOUT = lectureLayout(
  "lecture-right",
  LECTURE_RIGHT_COLUMN_X,
  LECTURE_RIGHT_MAIN_X,
);

// ─── mobile ─────────────────────────────────────────────────────────────────
//
// Portrait 1080×1920 for phone-app / Livehime vertical streams: a header band,
// one large video cutout (the phone's camera or screen fills it from beneath —
// there is no separate camera slot and no local-OBS composition), and the
// presenter card at the bottom. Exported as a frame or served as a browser
// source; streaming itself stays in the phone app.

const MOBILE_INTRO_HEIGHT = 320;
const MOBILE_CONTENT_TOP = EDGE + HEADER_HEIGHT + GAP; // 144
const MOBILE_INTRO_TOP = 1920 - EDGE - MOBILE_INTRO_HEIGHT; // 1576

export const MOBILE_LAYOUT: OverlayLayout = {
  id: "mobile",
  canvas: { width: 1080, height: 1920 },
  regions: {
    main: {
      left: EDGE,
      top: MOBILE_CONTENT_TOP,
      width: 1080 - EDGE * 2, // 1032
      height: MOBILE_INTRO_TOP - GAP - MOBILE_CONTENT_TOP, // 1408
    },
  },
  panels: {
    header: { left: EDGE, top: EDGE, width: 1080 - EDGE * 2, height: HEADER_HEIGHT },
    intro: {
      left: EDGE,
      top: MOBILE_INTRO_TOP,
      width: 1080 - EDGE * 2,
      height: MOBILE_INTRO_HEIGHT,
    },
  },
};

// ─── registry ───────────────────────────────────────────────────────────────

export const DEFAULT_LAYOUT_ID: LayoutId = "workbench";

export const LAYOUTS: Record<LayoutId, OverlayLayout> = {
  workbench: WORKBENCH_LAYOUT,
  "lecture-left": LECTURE_LEFT_LAYOUT,
  "lecture-right": LECTURE_RIGHT_LAYOUT,
  mobile: MOBILE_LAYOUT,
};

export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];

export function isLayoutId(value: unknown): value is LayoutId {
  // Own-property check, NOT `in`: this guards untrusted input (localStorage,
  // the live-state PATCH body, ?layout=), where prototype keys like
  // "constructor" must not resolve to a non-layout object and crash renders.
  return typeof value === "string" && Object.hasOwn(LAYOUTS, value);
}

export function getLayout(id: LayoutId = DEFAULT_LAYOUT_ID): OverlayLayout {
  return LAYOUTS[id];
}
