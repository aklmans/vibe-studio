import { UI_COLORS } from "./design-tokens";

export type ObsCameraMode = "avatar" | "empty";

export interface ObsCameraFrameColors {
  shellBackground: string;
  stageBackground: string;
}

export function normalizeObsCameraMode(value: unknown): ObsCameraMode {
  return value === "empty" || value === "avatar" ? value : "avatar";
}

export function getObsCameraFrameColors(mode: ObsCameraMode): ObsCameraFrameColors {
  if (mode === "empty") {
    return {
      shellBackground: "transparent",
      stageBackground: "transparent",
    };
  }

  return {
    shellBackground: UI_COLORS.cameraShell,
    stageBackground: UI_COLORS.cameraStage,
  };
}
