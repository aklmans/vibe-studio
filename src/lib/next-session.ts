import { DEFAULT_STATE_BY_LOCALE, type OverlayState } from "../types";
import type { Locale } from "./i18n";
import {
  applyStudioProfileToState,
  profileFromState,
  type StudioProfile,
} from "./studio-profile";

/**
 * "Prepare next session" — the explicit next-stream verb. Clears per-stream
 * content back to the locale defaults (title, subtitle, agendas, stack,
 * badges, live timer) while keeping everything a host would expect to survive
 * between streams:
 *
 *  - the Brand layer (name, avatar, socials, series/presenter lines) — even
 *    when no profile was saved yet, identity is derived from the current
 *    state so preparing the next stream never costs the host their name;
 *  - the current scene layout, appearance (theme + colors), panel visibility
 *    and bottom-bar structure.
 */
export function prepareNextSessionState(
  state: OverlayState,
  profile: StudioProfile | null,
  locale: Locale,
): OverlayState {
  const effectiveProfile = profile ?? profileFromState(state);
  const base = applyStudioProfileToState(
    DEFAULT_STATE_BY_LOCALE[locale],
    effectiveProfile,
  );
  return {
    ...base,
    // Presentation is not per-stream content — keep it exactly as it is.
    layout: state.layout,
    activeTab: state.activeTab,
    theme: state.theme,
    colors: { ...state.colors },
    mainScreen: { ...state.mainScreen },
    bottomBar: {
      visible: state.bottomBar.visible,
      segments: {
        workbench: state.bottomBar.segments.workbench.map((segment) => ({ ...segment })),
        lecture: state.bottomBar.segments.lecture.map((segment) => ({ ...segment })),
        mobile: state.bottomBar.segments.mobile.map((segment) => ({ ...segment })),
      },
    },
    sidebar: {
      // Agendas come from the defaults (cleared content); panel visibility is
      // presentation and stays.
      ...base.sidebar,
      visible: state.sidebar.visible,
      socialVisible: state.sidebar.socialVisible,
    },
    liveSession: { startedAt: "" },
  };
}
