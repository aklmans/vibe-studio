import { WORKBENCH_LAYOUT } from "./overlay-layout";

/**
 * Browser-source sizes. The full overlay is layout-sized. Sidebar and bottom bar
 * are standalone renders at their own broadcast sizes — deliberately NOT the
 * layout's panel rects, which describe where those panels sit inside the overlay.
 */
export const OBS_SOURCES = {
  overlay: {
    label: "Full Overlay",
    width: WORKBENCH_LAYOUT.canvas.width,
    height: WORKBENCH_LAYOUT.canvas.height,
  },
  sidebar: {
    label: "Sidebar",
    width: 470,
    height: 760,
  },
  "bottom-bar": {
    label: "Bottom Bar",
    width: 1856,
    height: 180,
  },
} as const;

export type ObsSource = keyof typeof OBS_SOURCES;

export function isObsSource(value: string): value is ObsSource {
  return value in OBS_SOURCES;
}
