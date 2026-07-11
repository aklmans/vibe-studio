export const OVERLAY_STATE_STORAGE_KEY = "vibe-overlay-state";

/**
 * The public demo keeps its own draft, isolated from the private studio's
 * state, so playing with /demo never rewrites the host's real workspace and a
 * demo visit never suppresses the studio's first-run setup.
 */
export const DEMO_OVERLAY_STATE_STORAGE_KEY = "vibe-overlay-state-demo";
