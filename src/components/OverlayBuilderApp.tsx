"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { DEFAULT_STATE_BY_LOCALE, DEMO_STATE_BY_LOCALE, type OverlayState } from "../types";
import FirstRunWizard from "./FirstRunWizard";
import {
  DEMO_OVERLAY_STATE_STORAGE_KEY,
  OVERLAY_STATE_STORAGE_KEY,
} from "../lib/storage-keys";
import OverlayCanvas from "./OverlayCanvas";
import CoverCanvas from "./CoverCanvas";
import PosterCanvas from "./PosterCanvas";
import WallpaperCanvas from "./WallpaperCanvas";
import SidebarPanel from "./SidebarPanel";
import BottomBarPanel from "./BottomBarPanel";
import LiveDataManager, { type SessionConfigFocus } from "./live-data/LiveDataManager";
import TopBar from "./topbar/TopBar";
import Inspector from "./inspector/Inspector";
import CommandPalette from "./CommandPalette";
import {
  exportFullOverlay,
  exportSidebar,
  exportBottomBar,
  exportCover,
  exportPoster,
  exportWallpaper,
} from "../utils/exportImage";
import { hasStoredOverlayState, loadOverlayState, saveOverlayState } from "../stateStorage";
import { shouldPersistOverlayDraft, shouldShowFirstRun } from "../lib/first-run";
import { prepareNextSessionState } from "../lib/next-session";
import {
  UI_BORDERS,
  UI_COLORS,
  applyAppAppearance,
} from "../lib/design-tokens";
import {
  COVER_CANVAS_DIMENSIONS,
  POSTER_CANVAS_DIMENSIONS,
} from "../lib/canvas-dimensions";
import { getLayout } from "../lib/overlay-layout";
import { produceState } from "../lib/state";
import { exportForTab } from "../lib/export-targets";
import { exportFileName } from "../lib/export-filename";
import { ExportTimeoutError, withExportTimeout } from "../lib/export-timeout";
import { publishLiveState } from "../lib/live-state-client";
import { IDLE_OBS_SYNC, type ObsSyncState } from "./live-data/obs-sync";
import {
  applyLiveDataToOverlayState,
  overlayStateToLiveData,
  type LiveSessionSummary,
} from "../lib/live-data";
import { formatDateKey } from "../lib/live-data-api";
import {
  endCurrentLiveSession as endRemoteLiveSession,
  fetchCurrentLiveData,
  saveCurrentLiveData as saveRemoteLiveData,
  startCurrentLiveSession as startRemoteLiveSession,
  type LiveDataApiResult,
} from "../lib/live-data-client";
import { APP_TABS } from "../lib/tabs";
import {
  applyStudioProfileToState,
  clearStudioProfile,
  loadStudioProfile,
  saveStudioProfile,
  type StudioProfile,
} from "../lib/studio-profile";
import {
  WALLPAPER_PRESETS,
  getWallpaperPreset,
  getPresetLabels,
} from "../lib/wallpaper";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useLocale, loadLocale } from "../hooks/useLocale";

// Offscreen export stage styles — rendered at native resolution, invisible to user
const exportStageStyle: React.CSSProperties = {
  position: "fixed",
  left: -10000,
  top: 0,
  pointerEvents: "none",
  opacity: 1,
  zIndex: -1,
};

export function stateForLocaleChange(
  current: OverlayState,
  locale: keyof typeof DEFAULT_STATE_BY_LOCALE,
): OverlayState {
  void locale;
  return current;
}

export const PREVIEW_HEADER_STYLES = {
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    flexShrink: 0,
    gap: "8px 16px",
    minHeight: 30,
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: "1 1 360px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  badge: {
    fontFamily: "var(--app-font-mono)",
    fontSize: 10,
    color: UI_COLORS.accentText,
    background: UI_COLORS.previewBadgeSurface,
    padding: "4px 9px",
    borderRadius: 5,
    border: UI_BORDERS.control,
    letterSpacing: "0.06em",
    flexShrink: 0,
  },
  hint: {
    fontSize: 11,
    color: UI_COLORS.textMuted,
    lineHeight: 1.4,
    minWidth: 0,
    flex: "1 1 220px",
    whiteSpace: "normal",
    overflowWrap: "break-word",
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    minWidth: 0,
    flex: "1 1 320px",
    flexWrap: "wrap",
    marginLeft: "auto",
  },
  metrics: {
    fontSize: 10,
    color: UI_COLORS.textSubtle,
    fontFamily: "monospace",
    lineHeight: 1.45,
    pointerEvents: "none",
    userSelect: "none",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    maxWidth: "min(100%, 520px)",
    textAlign: "right",
  },
  exportError: {
    fontSize: 12,
    color: UI_COLORS.danger,
    background: UI_COLORS.dangerSurface,
    border: UI_BORDERS.danger,
    borderRadius: 6,
    padding: "4px 12px",
    maxWidth: "100%",
  },
} satisfies Record<string, React.CSSProperties>;

interface LiveDataPersistenceState {
  databaseConfigured: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  session: LiveSessionSummary | null;
}

type WorkbenchTab = Exclude<OverlayState["activeTab"], "live">;

interface OverlayBuilderAppProps {
  /** Public product demo: local editing/export only; no AI provider, DB or OBS live-state side effects. */
  demoMode?: boolean;
}

export default function App({ demoMode = false }: OverlayBuilderAppProps) {
  const { t, locale } = useLocale();
  // The demo keeps its own storage draft and rich seed content; the private
  // studio starts neutral and layers the saved Brand profile on top.
  const stateStorageKey = demoMode
    ? DEMO_OVERLAY_STATE_STORAGE_KEY
    : OVERLAY_STATE_STORAGE_KEY;
  const [studioProfile, setStudioProfile] = useState<StudioProfile | null>(() => loadStudioProfile());
  const [state, setStateRaw] = useState<OverlayState>(() =>
    demoMode
      ? loadOverlayState(undefined, DEMO_STATE_BY_LOCALE[loadLocale()], DEMO_OVERLAY_STATE_STORAGE_KEY)
      : loadOverlayState(undefined, applyStudioProfileToState(DEFAULT_STATE_BY_LOCALE[loadLocale()], loadStudioProfile())),
  );
  // First-run setup: only the private studio, only when nothing has ever been
  // persisted (no draft, no brand profile). Computed once in the initializer —
  // the app is client-only (`ssr: false`). While the wizard is open the draft
  // autosave is deferred (see the persist effect below), so a refresh or crash
  // mid-wizard boots back into the wizard instead of silently dismissing it.
  const [firstRunOpen, setFirstRunOpen] = useState(() =>
    shouldShowFirstRun({
      demoMode,
      hasStoredDraft: hasStoredOverlayState(),
      hasBrandProfile: Boolean(loadStudioProfile()),
    }),
  );
  const [liveDateKey] = useState(() => formatDateKey(new Date()));
  const [previewMetrics, setPreviewMetrics] = useState<PreviewMetrics | null>(
    null,
  );
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  // Success feedback for exports (filename or file count); auto-clears.
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [sessionConfigFocus, setSessionConfigFocus] = useState<SessionConfigFocus | null>(null);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [obsSync, setObsSync] = useState<ObsSyncState>(IDLE_OBS_SYNC);
  // The tab to return to when the Session Config dialog closes.
  const lastNonLiveTabRef = useRef<WorkbenchTab>("overlay");
  const [liveDataPersistence, setLiveDataPersistence] =
    useState<LiveDataPersistenceState>({
      databaseConfigured: false,
      loading: !demoMode,
      saving: false,
      error: null,
      savedAt: null,
      session: null,
    });
  const prevLocaleRef = useRef(locale);
  // UI language can change while editing. Live-data persistence is tied to the
  // current broadcast session, so it must not auto-switch to another locale row
  // and overwrite the user's content when the interface language changes.
  const liveDataLocaleRef = useRef(locale);
  const liveSessionRef = useRef<LiveSessionSummary | null>(null);

  const applyLoadedLiveData = useCallback((result: LiveDataApiResult) => {
    const liveData = result.liveData;
    liveSessionRef.current = liveData?.session ?? null;
    if (liveData) {
      setStateRaw((current) =>
        applyLiveDataToOverlayState(current, liveData),
      );
    }
    setLiveDataPersistence((current) => ({
      ...current,
      databaseConfigured: result.databaseConfigured,
      loading: false,
      saving: false,
      error: null,
      session: liveData?.session ?? null,
    }));
  }, []);

  useEffect(() => {
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
      setStateRaw((current) => stateForLocaleChange(current, locale));
    }
  }, [locale]);

  const reloadLiveData = useCallback(() => {
    if (demoMode) {
      setLiveDataPersistence((current) => ({
        ...current,
        databaseConfigured: false,
        loading: false,
        saving: false,
        error: null,
        savedAt: null,
        session: null,
      }));
      liveSessionRef.current = null;
      return () => {};
    }

    const controller = new AbortController();
    setLiveDataPersistence((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    void fetchCurrentLiveData(liveDataLocaleRef.current, liveDateKey, controller.signal)
      .then(applyLoadedLiveData)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLiveDataPersistence((current) => ({
          ...current,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load live data",
        }));
      });

    return () => controller.abort();
  }, [applyLoadedLiveData, demoMode, liveDateKey]);

  useEffect(() => reloadLiveData(), [reloadLiveData]);

  // Preview ref (for the visible scaled canvas — not used for export)
  const previewOverlayRef = useRef<HTMLDivElement | null>(null);
  const previewCoverRef = useRef<HTMLDivElement | null>(null);
  const previewPosterRef = useRef<HTMLDivElement | null>(null);

  // Offscreen export-only refs — always mounted, no transforms
  const exportOverlayRef = useRef<HTMLDivElement | null>(null);
  const exportSidebarRef = useRef<HTMLDivElement | null>(null);
  const exportBottomBarRef = useRef<HTMLDivElement | null>(null);
  const exportCoverRef = useRef<HTMLDivElement | null>(null);
  const exportPosterRef = useRef<HTMLDivElement | null>(null);
  const exportWallpaperRefs = useRef<Map<string, HTMLDivElement | null>>(
    new Map(),
  );

  const setState = useCallback((next: OverlayState) => {
    setStateRaw(next);
  }, []);

  useLayoutEffect(() => {
    applyAppAppearance(state.theme);
  }, [state.theme]);

  useEffect(() => {
    // Deferred while the first-run wizard is open: the wizard is modal (no
    // edits underneath), and an early autosave would make a mid-wizard refresh
    // look like a returning studio. Completing/skipping flips firstRunOpen,
    // which re-runs this effect and records the decision immediately.
    if (!shouldPersistOverlayDraft({ demoMode, firstRunOpen })) return;
    saveOverlayState(state, undefined, stateStorageKey);
  }, [state, stateStorageKey, demoMode, firstRunOpen]);

  // Push the current state to the live-state store (OBS sources mirror it) and
  // surface the real push status in the source-of-truth bar. Debounced so rapid
  // edits don't spam the API or flicker the chip; the in-flight push is aborted
  // when a newer edit supersedes it.
  useEffect(() => {
    if (demoMode) {
      setObsSync(IDLE_OBS_SYNC);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setObsSync((prev) => ({ ...prev, status: "syncing", error: null }));
      publishLiveState(state, locale, controller.signal)
        .then((result) => {
          setObsSync({
            status: "synced",
            revision: result.revision,
            lastPushedAt: result.updatedAt || new Date().toISOString(),
            error: null,
          });
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setObsSync((prev) => ({
            ...prev,
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          }));
          console.warn("Failed to publish live OBS state", err);
        });
    }, 400);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [demoMode, state, locale]);

  useEffect(() => {
    if (demoMode || !liveDataPersistence.databaseConfigured || !liveSessionRef.current) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const session = {
        ...liveSessionRef.current!,
        startedAt: state.liveSession.startedAt,
        updatedAt: new Date().toISOString(),
      };
      const liveData = overlayStateToLiveData(state, session);

      setLiveDataPersistence((current) => ({
        ...current,
        saving: true,
        error: null,
      }));

      void saveRemoteLiveData(liveDataLocaleRef.current, liveDateKey, liveData, controller.signal)
        .then((result) => {
          liveSessionRef.current = result.liveData?.session ?? liveSessionRef.current;
          setLiveDataPersistence((current) => ({
            ...current,
            databaseConfigured: result.databaseConfigured,
            saving: false,
            error: null,
            savedAt: result.liveData ? new Date().toISOString() : current.savedAt,
            session: result.liveData?.session ?? current.session,
          }));
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setLiveDataPersistence((current) => ({
            ...current,
            saving: false,
            error: err instanceof Error ? err.message : "Failed to save live data",
          }));
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    liveDataPersistence.databaseConfigured,
    liveDateKey,
    demoMode,
    state,
  ]);

  const handleStartLiveSession = useCallback(() => {
    if (demoMode) return;
    setLiveDataPersistence((current) => ({
      ...current,
      saving: true,
      error: null,
    }));
    void startRemoteLiveSession(liveDataLocaleRef.current, liveDateKey)
      .then(applyLoadedLiveData)
      .catch((err) => {
        setLiveDataPersistence((current) => ({
          ...current,
          saving: false,
          error: err instanceof Error ? err.message : "Failed to start live session",
        }));
      });
  }, [applyLoadedLiveData, demoMode, liveDateKey]);

  const handleEndLiveSession = useCallback(() => {
    if (demoMode) return;
    setLiveDataPersistence((current) => ({
      ...current,
      saving: true,
      error: null,
    }));
    void endRemoteLiveSession(liveDataLocaleRef.current, liveDateKey)
      .then(applyLoadedLiveData)
      .catch((err) => {
        setLiveDataPersistence((current) => ({
          ...current,
          saving: false,
          error: err instanceof Error ? err.message : "Failed to end live session",
        }));
      });
  }, [applyLoadedLiveData, demoMode, liveDateKey]);

  // The overlay surface is layout-sized (portrait on mobile). Declared before
  // the export callbacks whose dependency arrays read it during render.
  const overlayCanvas = getLayout(state.layout).canvas;

  const handleExport = useCallback(
    async (
      type: "overlay" | "sidebar" | "bottom-bar" | "cover" | "poster" | "wallpaper" | "all",
      fn: () => Promise<void>,
      doneMessage?: string,
    ) => {
      setExporting(type);
      setExportError(null);
      setExportNotice(null);
      try {
        // Watchdog: a hung capture (e.g. an embed fetch that never settles)
        // must never leave the button in a permanent Exporting… state.
        await withExportTimeout(fn());
        if (doneMessage) setExportNotice(doneMessage);
      } catch (err) {
        setExportError(
          err instanceof ExportTimeoutError
            ? t("export.timeout")
            : err instanceof Error
              ? err.message
              : t("export.failed"),
        );
      } finally {
        setExporting(null);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!exportNotice) return;
    const timer = setTimeout(() => setExportNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [exportNotice]);

  // Exports are named after the host's stream, not the app:
  // <title-slug>-<surface>-<date>.png
  const exportName = useCallback(
    (surface: string) => exportFileName(state.cover.title, surface),
    [state.cover.title],
  );

  const handleExportOverlay = useCallback(() => {
    const el = exportOverlayRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    const portrait = overlayCanvas.height > overlayCanvas.width;
    const name = exportName(portrait ? "overlay-vertical" : "overlay");
    handleExport("overlay", () => exportFullOverlay(el, overlayCanvas, name), `${t("export.done")} ${name}`);
  }, [handleExport, overlayCanvas, exportName, t]);

  const handleExportSidebar = useCallback(() => {
    const el = exportSidebarRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    const name = exportName("sidebar");
    handleExport("sidebar", () => exportSidebar(el, name), `${t("export.done")} ${name}`);
  }, [handleExport, exportName, t]);

  const handleExportBottomBar = useCallback(() => {
    const el = exportBottomBarRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    const name = exportName("bottom-bar");
    handleExport("bottom-bar", () => exportBottomBar(el, name), `${t("export.done")} ${name}`);
  }, [handleExport, exportName, t]);

  const handleExportCover = useCallback(() => {
    const el = exportCoverRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    const name = exportName("cover");
    handleExport("cover", () => exportCover(el, name), `${t("export.done")} ${name}`);
  }, [handleExport, exportName, t]);

  const handleExportPoster = useCallback(() => {
    const el = exportPosterRef.current;
    if (!el) {
      setExportError(t("export.notReady"));
      return;
    }
    const name = exportName("poster");
    handleExport("poster", () => exportPoster(el, name), `${t("export.done")} ${name}`);
  }, [handleExport, exportName, t]);

  const handleExportWallpaper = useCallback(() => {
    handleExport("wallpaper", async () => {
      for (const preset of WALLPAPER_PRESETS) {
        const el = exportWallpaperRefs.current.get(preset.id);
        if (!el) {
          throw new Error(`Wallpaper export node missing: ${preset.id}`);
        }
        await exportWallpaper(
          el,
          exportName(`wallpaper-${preset.id}`),
          preset.width,
          preset.height,
        );
      }
    }, t("export.doneWallpaper"));
  }, [handleExport, exportName, t]);

  // Export every artifact in one action. Sequential — the offscreen export
  // nodes and the browser's download channel are shared, so one PNG at a time
  // keeps each correct (and naturally spaces the downloads). Wallpaper expands
  // to its full preset set, so "all" is 8 files (overlay/cover/poster + 3
  // wallpapers + sidebar + bottom-bar).
  const handleExportAll = useCallback(() => {
    handleExport("all", async () => {
      const overlay = exportOverlayRef.current;
      const cover = exportCoverRef.current;
      const poster = exportPosterRef.current;
      const sidebar = exportSidebarRef.current;
      const bottomBar = exportBottomBarRef.current;
      if (!overlay || !cover || !poster || !sidebar || !bottomBar) {
        throw new Error(t("export.notReady"));
      }
      const portrait = overlayCanvas.height > overlayCanvas.width;
      await exportFullOverlay(overlay, overlayCanvas, exportName(portrait ? "overlay-vertical" : "overlay"));
      await exportCover(cover, exportName("cover"));
      await exportPoster(poster, exportName("poster"));
      for (const preset of WALLPAPER_PRESETS) {
        const el = exportWallpaperRefs.current.get(preset.id);
        if (!el) throw new Error(`Wallpaper export node missing: ${preset.id}`);
        await exportWallpaper(
          el,
          exportName(`wallpaper-${preset.id}`),
          preset.width,
          preset.height,
        );
      }
      await exportSidebar(sidebar, exportName("sidebar"));
      await exportBottomBar(bottomBar, exportName("bottom-bar"));
    }, t("export.doneAll"));
  }, [handleExport, overlayCanvas, exportName, t]);

  const handleSaveStudioProfile = useCallback((profile: StudioProfile) => {
    saveStudioProfile(profile);
    setStudioProfile(profile);
    setStateRaw((current) => applyStudioProfileToState(current, profile));
  }, []);

  const handleClearStudioProfile = useCallback(() => {
    clearStudioProfile();
    setStudioProfile(null);
  }, []);

  const handleReset = useCallback(() => {
    // Demo resets to its rich seed; the studio resets to neutral defaults with
    // the saved Brand layer re-applied. The current scene layout and app tab
    // stay put — a reset never silently switches the scene or closes the
    // Session Config dialog.
    setStateRaw((current) => {
      const base = demoMode
        ? DEMO_STATE_BY_LOCALE[locale]
        : applyStudioProfileToState(DEFAULT_STATE_BY_LOCALE[locale], studioProfile);
      return { ...base, layout: current.layout, activeTab: current.activeTab };
    });
  }, [demoMode, locale, studioProfile]);

  // "Prepare next session" — keep brand + presentation, clear this stream's
  // content back to the locale defaults (see src/lib/next-session.ts).
  const handlePrepareNextSession = useCallback(() => {
    setStateRaw((current) => prepareNextSessionState(current, studioProfile, locale));
  }, [studioProfile, locale]);

  const handleFirstRunComplete = useCallback(
    (profile: StudioProfile) => {
      handleSaveStudioProfile(profile);
      if (profile.avatarUrl) {
        // The wizard's upload becomes the cover subject too, so the very first
        // canvas the host sees carries their face, not an empty slot.
        setStateRaw((current) => ({
          ...current,
          cover: {
            ...current.cover,
            visual: "avatar",
            portraitUrl: profile.avatarUrl,
          },
        }));
      }
      setFirstRunOpen(false);
    },
    [handleSaveStudioProfile],
  );

  const handleExportCurrent = useCallback(() => {
    exportForTab(state.activeTab, {
      onExportOverlay: handleExportOverlay,
      onExportCover: handleExportCover,
      onExportPoster: handleExportPoster,
      onExportWallpaper: handleExportWallpaper,
    })();
  }, [
    state.activeTab,
    handleExportOverlay,
    handleExportCover,
    handleExportPoster,
    handleExportWallpaper,
  ]);

  const TAB_ORDER = APP_TABS;

  // Gear / ⌘, / command-palette "Settings" now open the single config surface:
  // the Session Config dialog, deep-linked to its Studio Appearance group.
  const openSessionConfigAppearance = () => {
    setSessionConfigFocus({ mode: "settings", group: "appearance", nonce: Date.now() });
    setState(
      produceState(state, (draft) => {
        draft.activeTab = "live";
      }),
    );
  };
  // Command-palette route for "prepare next session": open Session Config on
  // the Session group, where the button (and its confirm) lives.
  const openSessionConfigSession = () => {
    setSessionConfigFocus({ mode: "settings", group: "session", nonce: Date.now() });
    setState(
      produceState(state, (draft) => {
        draft.activeTab = "live";
      }),
    );
  };
  const consumeSessionConfigFocus = useCallback(() => setSessionConfigFocus(null), []);

  useKeyboardShortcuts({
    onCommandPalette: () => setCmdkOpen((v) => !v),
    onSwitchTab: (idx) => {
      const tab = TAB_ORDER[idx];
      if (tab) {
        setState(
          produceState(state, (draft) => {
            draft.activeTab = tab;
          }),
        );
      }
    },
    onExportCurrent: handleExportCurrent,
    onOpenSettings: openSessionConfigAppearance,
  });

  const wallpaperPreset = getWallpaperPreset(state.wallpaper.previewPresetId);
  const isLiveDataTab = state.activeTab === "live";
  if (state.activeTab !== "live") {
    lastNonLiveTabRef.current = state.activeTab;
  }
  const previewTab: WorkbenchTab =
    state.activeTab === "live" ? lastNonLiveTabRef.current : state.activeTab;
  const previewState = isLiveDataTab ? { ...state, activeTab: previewTab } : state;
  const closeSessionConfig = () =>
    setState(
      produceState(state, (draft) => {
        draft.activeTab = lastNonLiveTabRef.current;
      }),
    );
  const isCoverTab = previewTab === "cover";
  const isWallpaperTab = previewTab === "wallpaper";
  const isPosterTab = previewTab === "poster";
  // Poster keeps its own fixed canvas and must not follow the overlay layout.
  const previewW = isWallpaperTab
    ? wallpaperPreset.width
    : isCoverTab
      ? COVER_CANVAS_DIMENSIONS.width
      : isPosterTab
        ? POSTER_CANVAS_DIMENSIONS.width
        : overlayCanvas.width;
  const previewH = isWallpaperTab
    ? wallpaperPreset.height
    : isCoverTab
      ? COVER_CANVAS_DIMENSIONS.height
      : isPosterTab
        ? POSTER_CANVAS_DIMENSIONS.height
        : overlayCanvas.height;

  const tabBadge = (() => {
    switch (previewTab) {
      case "overlay":
        return `${t("tabBadge.overlay")} · ${overlayCanvas.width}×${overlayCanvas.height}`;
      case "cover":
        return t("tabBadge.cover");
      case "poster":
        return t("tabBadge.poster");
      case "wallpaper":
        return `${t("tab.wallpaper").toUpperCase()} · ${getPresetLabels(locale)[wallpaperPreset.id].label} · ${wallpaperPreset.width}×${wallpaperPreset.height}`;
    }
  })();

  return (
    <>
      {/* ─── Offscreen export-only nodes ────────────────────────────────────
          Always mounted. Positioned far off-screen so they are painted by the
          browser (opacity:1, no display:none) but never seen by the user.
          No CSS transform or scaling — native resolution only.
      ─────────────────────────────────────────────────────────────────────── */}

      {/* Full layout-sized overlay export (16:9 layouts or portrait mobile) */}
      <div style={exportStageStyle}>
        <OverlayCanvas ref={exportOverlayRef} state={state} />
      </div>

      {/* Sidebar-only export — 470×760 */}
      <div style={exportStageStyle}>
        <SidebarPanel ref={exportSidebarRef} state={state} />
      </div>

      {/* Bottom bar-only export — 1856×180 */}
      <div style={exportStageStyle}>
        <BottomBarPanel ref={exportBottomBarRef} state={state} />
      </div>

      {/* Cover export — always mounted regardless of active tab */}
      <div style={exportStageStyle}>
        <CoverCanvas ref={exportCoverRef} state={state} />
      </div>

      {/* Poster export */}
      <div style={exportStageStyle}>
        <PosterCanvas ref={exportPosterRef} state={state} />
      </div>

      {/* Wallpaper exports — one offscreen node per preset (4K / QHD / Mobile) */}
      {WALLPAPER_PRESETS.map((preset) => (
        <div key={preset.id} style={exportStageStyle}>
          <WallpaperCanvas
            ref={(node) => {
              if (node) exportWallpaperRefs.current.set(preset.id, node);
              else exportWallpaperRefs.current.delete(preset.id);
            }}
            state={state}
            preset={preset}
          />
        </div>
      ))}

      {/* ─── Main UI ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: UI_COLORS.shellBg,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
          overflow: "hidden",
        }}
        data-appearance={state.theme}
      >
        {demoMode && (
          <div
            data-testid="demo-notice"
            role="note"
            style={{
              fontFamily: "var(--app-font-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: UI_COLORS.textMuted,
              borderBottom: UI_BORDERS.panel,
              padding: "5px 16px",
              flexShrink: 0,
            }}
          >
            {t("demo.notice")}
          </div>
        )}
        <TopBar
          state={state}
          onChange={setState}
          exporting={exporting}
          onExportOverlay={handleExportOverlay}
          onExportSidebar={handleExportSidebar}
          onExportBottomBar={handleExportBottomBar}
          onExportCover={handleExportCover}
          onExportPoster={handleExportPoster}
          onExportWallpaper={handleExportWallpaper}
          onExportAll={handleExportAll}
          onOpenSettings={openSessionConfigAppearance}
          onOpenCommandPalette={() => setCmdkOpen(true)}
        />

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
          }}
        >
          {/* Main Preview Area */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px 24px",
              gap: 12,
              background: UI_COLORS.shellBg,
            }}
          >
            <div
              style={PREVIEW_HEADER_STYLES.header}
            >
              <div style={PREVIEW_HEADER_STYLES.leftGroup}>
                <div
                  style={PREVIEW_HEADER_STYLES.badge}
                >
                  {tabBadge}
                </div>
                <div style={PREVIEW_HEADER_STYLES.hint}>
                  {isLiveDataTab ? t("app.liveDataHint") : t("app.previewHint")}
                </div>
              </div>

              <div
                style={PREVIEW_HEADER_STYLES.rightGroup}
              >
                {previewMetrics && (
                  <div
                    data-testid="preview-debug"
                    style={PREVIEW_HEADER_STYLES.metrics}
                  >
                    {formatPreviewMetrics(previewMetrics)}
                  </div>
                )}

                {exportError && (
                  <div
                    style={PREVIEW_HEADER_STYLES.exportError}
                  >
                    {exportError}
                  </div>
                )}
                {!exportError && exportNotice && (
                  <div
                    data-testid="export-notice"
                    role="status"
                    style={{
                      fontFamily: "var(--app-font-mono)",
                      fontSize: 10,
                      color: UI_COLORS.accentText,
                      border: UI_BORDERS.control,
                      borderRadius: 5,
                      padding: "4px 9px",
                      letterSpacing: "0.06em",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exportNotice}
                  </div>
                )}
              </div>
            </div>

            <PreviewFrame
              nativeW={previewW}
              nativeH={previewH}
              onMetricsChange={setPreviewMetrics}
            >
              {previewTab === "overlay" ? (
                <OverlayCanvas ref={previewOverlayRef} state={previewState} onChange={setState} />
              ) : previewTab === "cover" ? (
                <CoverCanvas
                  ref={previewCoverRef}
                  state={previewState}
                  editable
                  onChange={setState}
                />
              ) : previewTab === "poster" ? (
                <PosterCanvas
                  ref={previewPosterRef}
                  state={previewState}
                  editable
                  onChange={setState}
                />
              ) : (
                <WallpaperCanvas
                  state={previewState}
                  preset={wallpaperPreset}
                  editable
                  onChange={setState}
                />
              )}
            </PreviewFrame>
          </div>

          <Inspector state={previewState} onChange={setState} demoMode={demoMode} />
        </div>

        {isLiveDataTab && (
          <LiveDataManager
            state={state}
            onChange={setState}
            dateKey={liveDateKey}
            demoMode={demoMode}
            persistence={liveDataPersistence}
            obsSync={obsSync}
            onReload={reloadLiveData}
            onStartSession={handleStartLiveSession}
            onEndSession={handleEndLiveSession}
            onReset={handleReset}
            onPrepareNextSession={demoMode ? undefined : handlePrepareNextSession}
            onClose={closeSessionConfig}
            focus={sessionConfigFocus}
            onFocusConsumed={consumeSessionConfigFocus}
            studioProfile={studioProfile}
            onSaveStudioProfile={handleSaveStudioProfile}
            onClearStudioProfile={handleClearStudioProfile}
          />
        )}
      </div>

      {firstRunOpen && (
        <FirstRunWizard
          onComplete={handleFirstRunComplete}
          onSkip={() => setFirstRunOpen(false)}
        />
      )}

      <CommandPalette
        open={cmdkOpen}
        onClose={() => setCmdkOpen(false)}
        state={state}
        onChange={setState}
        onExportOverlay={handleExportOverlay}
        onExportCover={handleExportCover}
        onExportPoster={handleExportPoster}
        onExportWallpaper={handleExportWallpaper}
        onExportSidebar={handleExportSidebar}
        onExportBottomBar={handleExportBottomBar}
        onExportAll={handleExportAll}
        onOpenSettings={openSessionConfigAppearance}
        onPrepareNextSession={demoMode ? undefined : openSessionConfigSession}
      />
    </>
  );
}

interface PreviewMetrics {
  containerW: number;
  containerH: number;
  scale: number;
  canvasW: number;
  canvasH: number;
}

export function calculatePreviewScale(
  containerSize: { w: number; h: number },
  nativeW: number,
  nativeH: number,
  fallbackScale = 0.5,
) {
  if (
    containerSize.w <= 0 ||
    containerSize.h <= 0 ||
    nativeW <= 0 ||
    nativeH <= 0
  ) {
    return fallbackScale;
  }

  return Math.min(containerSize.w / nativeW, containerSize.h / nativeH);
}

export function formatPreviewMetrics(metrics: PreviewMetrics) {
  return `container ${metrics.containerW}×${metrics.containerH} · scale ${metrics.scale.toFixed(4)} · canvas ${metrics.canvasW}×${metrics.canvasH}`;
}

function PreviewFrame({
  nativeW,
  nativeH,
  onMetricsChange,
  children,
}: {
  nativeW: number;
  nativeH: number;
  onMetricsChange?: (metrics: PreviewMetrics) => void;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      setContainerSize((current) =>
        current.w === cw && current.h === ch ? current : { w: cw, h: ch },
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = calculatePreviewScale(containerSize, nativeW, nativeH);
  const scaledW = Math.round(nativeW * scale);
  const scaledH = Math.round(nativeH * scale);

  useLayoutEffect(() => {
    if (containerSize.w <= 0 || containerSize.h <= 0) return;
    onMetricsChange?.({
      containerW: containerSize.w,
      containerH: containerSize.h,
      scale,
      canvasW: scaledW,
      canvasH: scaledH,
    });
  }, [
    containerSize.w,
    containerSize.h,
    onMetricsChange,
    scale,
    scaledW,
    scaledH,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        // Complete editorial frame around the preview stage so the canvas reads
        // as bounded (not floating) — especially in Light where the warm-paper
        // canvas matches the shell surface. A hairline only: no fill, no shadow.
        // Shared by every canvas tab (Overlay / Cover / Poster / Wallpaper) and
        // never part of the exported PNG, which renders from offscreen nodes.
        border: `1px solid ${UI_COLORS.border}`,
        borderRadius: 2,
        boxSizing: "border-box",
      }}
    >
      {/* Outer wrapper sized to scaled dimensions */}
      <div
        data-testid="canvas-scale-wrapper"
        style={{
          width: scaledW,
          height: scaledH,
          position: "relative",
          flexShrink: 0,
          boxShadow:
            UI_COLORS.previewShadow,
          // Exports are square-cornered, so the preview frame is too — it must
          // not promise a rounded corner the PNG won't have.
          borderRadius: 2,
        }}
      >
        {/* Inner canvas at native resolution, scaled top-left */}
        <div
          style={{
            width: nativeW,
            height: nativeH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
