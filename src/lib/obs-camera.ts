export type ObsCameraMode = "avatar" | "empty";

export function normalizeObsCameraMode(value: unknown): ObsCameraMode {
  return value === "empty" || value === "avatar" ? value : "avatar";
}
