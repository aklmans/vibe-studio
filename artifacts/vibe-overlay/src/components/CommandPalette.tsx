import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import type { OverlayState } from "../types";
import { THEME_PRESETS, type ThemeMode } from "../lib/theme";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  onExportOverlay: () => void;
  onExportCover: () => void;
  onExportPoster: () => void;
  onExportWallpaper: () => void;
  onExportSidebar: () => void;
  onExportBottomBar: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const Mod = isMac ? "⌘" : "Ctrl";

/**
 * ⌘K command palette. Fuzzy-searchable list of every action that's reachable
 * elsewhere in the UI: tab switch, export, settings, theme, and toggles.
 *
 * Uses cmdk for the matching/keyboard logic but is styled inline to match the
 * rest of the app — the shadcn wrapper would force Tailwind class layout.
 */
export default function CommandPalette({
  open,
  onClose,
  state,
  onChange,
  onExportOverlay,
  onExportCover,
  onExportPoster,
  onExportWallpaper,
  onExportSidebar,
  onExportBottomBar,
  onOpenSettings,
  onReset,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");

  // When the palette opens, drive focus into the cmdk input. cmdk attaches its
  // arrow/enter keydown handler to the Command root and only sees events that
  // bubble from a focused descendant — without this, the trigger button keeps
  // focus and navigation/select are silently dead.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const run = (fn: () => void) => () => {
    onClose();
    // Defer one tick so cmdk can finish its own keydown handling first.
    setTimeout(fn, 0);
  };

  const switchTab = (tab: OverlayState["activeTab"]) =>
    onChange({ ...state, activeTab: tab });

  const applyTheme = (mode: ThemeMode) =>
    onChange({ ...state, theme: mode, colors: { ...THEME_PRESETS[mode] } });

  const toggleVisibility = (
    section: "main" | "camera" | "sidebar" | "sidebar-social" | "bottom-bar",
  ) => {
    switch (section) {
      case "main":
        onChange({
          ...state,
          mainScreen: { ...state.mainScreen, visible: !state.mainScreen.visible },
        });
        break;
      case "camera":
        onChange({
          ...state,
          mainScreen: {
            ...state.mainScreen,
            cameraVisible: !state.mainScreen.cameraVisible,
          },
        });
        break;
      case "sidebar":
        onChange({
          ...state,
          sidebar: { ...state.sidebar, visible: !state.sidebar.visible },
        });
        break;
      case "sidebar-social":
        onChange({
          ...state,
          sidebar: {
            ...state.sidebar,
            socialVisible: !state.sidebar.socialVisible,
          },
        });
        break;
      case "bottom-bar":
        onChange({
          ...state,
          bottomBar: { ...state.bottomBar, visible: !state.bottomBar.visible },
        });
        break;
    }
  };

  return (
    <>
      {/* Selection / hover styles for cmdk items — inline-styled siblings can't pick these up. */}
      <style>{`
        [cmdk-item=""][data-selected="true"] {
          background: #1F2235;
        }
        [cmdk-item=""][data-disabled="true"] {
          opacity: 0.5;
          pointer-events: none;
        }
        [cmdk-group-heading=""] {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8DA8FF;
          padding: 8px 12px 4px;
        }
      `}</style>

      {/* Scrim */}
      <div
        data-testid="cmdk-scrim"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 100,
        }}
      />

      {/* Dialog */}
      <div
        data-testid="cmdk-dialog"
        role="dialog"
        aria-label="Command palette"
        style={{
          position: "fixed",
          top: "18vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(640px, 92vw)",
          background: "#0D0E1C",
          border: "1px solid #2a3060",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          zIndex: 110,
          overflow: "hidden",
        }}
      >
        <Command
          label="Vibe Overlay command palette"
          loop
          style={{
            display: "flex",
            flexDirection: "column",
            background: "transparent",
            color: "#F4F7FF",
            fontFamily: "inherit",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #1F2235",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 14, color: "#6B7CA8" }}>⌕</span>
            <Command.Input
              ref={inputRef}
              data-testid="cmdk-input"
              value={search}
              onValueChange={setSearch}
              autoFocus
              placeholder="Type a command or search…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F4F7FF",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />
            <Kbd>esc</Kbd>
          </div>

          <Command.List
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              padding: "6px 6px 8px",
            }}
          >
            <Command.Empty
              style={{
                padding: "20px 16px",
                fontSize: 13,
                color: "#6B7CA8",
                textAlign: "center",
              }}
            >
              No matching command.
            </Command.Empty>

            <Group heading="Switch tab">
              <Item
                value="tab-overlay"
                onSelect={run(() => switchTab("overlay"))}
                shortcut={`${Mod} 1`}
                active={state.activeTab === "overlay"}
                testId="cmdk-tab-overlay"
              >
                Go to Overlay
              </Item>
              <Item
                value="tab-cover"
                onSelect={run(() => switchTab("cover"))}
                shortcut={`${Mod} 2`}
                active={state.activeTab === "cover"}
                testId="cmdk-tab-cover"
              >
                Go to Cover
              </Item>
              <Item
                value="tab-poster"
                onSelect={run(() => switchTab("poster"))}
                shortcut={`${Mod} 3`}
                active={state.activeTab === "poster"}
                testId="cmdk-tab-poster"
              >
                Go to Poster
              </Item>
              <Item
                value="tab-wallpaper"
                onSelect={run(() => switchTab("wallpaper"))}
                shortcut={`${Mod} 4`}
                active={state.activeTab === "wallpaper"}
                testId="cmdk-tab-wallpaper"
              >
                Go to Wallpaper
              </Item>
            </Group>

            <Group heading="Export">
              <Item
                value="export-current"
                onSelect={run(currentTabExporter(state, {
                  onExportOverlay,
                  onExportCover,
                  onExportPoster,
                  onExportWallpaper,
                }))}
                shortcut={`${Mod} E`}
                testId="cmdk-export-current"
              >
                Export current tab
              </Item>
              <Item value="export-overlay" onSelect={run(onExportOverlay)} testId="cmdk-export-overlay">
                Export Full Overlay PNG
              </Item>
              <Item value="export-cover" onSelect={run(onExportCover)} testId="cmdk-export-cover">
                Export Cover PNG
              </Item>
              <Item value="export-poster" onSelect={run(onExportPoster)} testId="cmdk-export-poster">
                Export Poster PNG
              </Item>
              <Item
                value="export-wallpaper"
                onSelect={run(onExportWallpaper)}
                testId="cmdk-export-wallpaper"
              >
                Export Wallpaper Set (3 PNGs)
              </Item>
              <Item value="export-sidebar" onSelect={run(onExportSidebar)} testId="cmdk-export-sidebar">
                Export Sidebar slice
              </Item>
              <Item
                value="export-bottom-bar"
                onSelect={run(onExportBottomBar)}
                testId="cmdk-export-bottom-bar"
              >
                Export Bottom Bar slice
              </Item>
            </Group>

            <Group heading="Theme">
              <Item
                value="theme-neon"
                onSelect={run(() => applyTheme("neon"))}
                active={state.theme === "neon"}
                testId="cmdk-theme-neon"
              >
                Apply Neon theme
              </Item>
              <Item
                value="theme-editorial"
                onSelect={run(() => applyTheme("editorial"))}
                active={state.theme === "editorial"}
                testId="cmdk-theme-editorial"
              >
                Apply Editorial theme
              </Item>
            </Group>

            <Group heading="Visibility">
              <Item
                value="toggle-main"
                onSelect={run(() => toggleVisibility("main"))}
                testId="cmdk-toggle-main"
              >
                {state.mainScreen.visible ? "Hide" : "Show"} Main Screen
              </Item>
              <Item
                value="toggle-camera"
                onSelect={run(() => toggleVisibility("camera"))}
                testId="cmdk-toggle-camera"
              >
                {state.mainScreen.cameraVisible ? "Hide" : "Show"} Camera Frame
              </Item>
              <Item
                value="toggle-sidebar"
                onSelect={run(() => toggleVisibility("sidebar"))}
                testId="cmdk-toggle-sidebar"
              >
                {state.sidebar.visible ? "Hide" : "Show"} Right Sidebar
              </Item>
              <Item
                value="toggle-sidebar-social"
                onSelect={run(() => toggleVisibility("sidebar-social"))}
                testId="cmdk-toggle-sidebar-social"
              >
                {state.sidebar.socialVisible ? "Hide" : "Show"} Sidebar Social
                Info
              </Item>
              <Item
                value="toggle-bottom-bar"
                onSelect={run(() => toggleVisibility("bottom-bar"))}
                testId="cmdk-toggle-bottom-bar"
              >
                {state.bottomBar.visible ? "Hide" : "Show"} Bottom Bar
              </Item>
            </Group>

            <Group heading="App">
              <Item
                value="open-settings"
                onSelect={run(onOpenSettings)}
                shortcut={`${Mod} ,`}
                testId="cmdk-open-settings"
              >
                Open Settings
              </Item>
              <Item
                value="reset-defaults"
                onSelect={run(onReset)}
                testId="cmdk-reset"
                tone="danger"
              >
                Reset to Defaults…
              </Item>
            </Group>
          </Command.List>

          <div
            style={{
              padding: "8px 14px",
              borderTop: "1px solid #1F2235",
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 11,
              color: "#6B7CA8",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>navigate</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Kbd>↵</Kbd>
              <span>select</span>
            </span>
            <span style={{ marginLeft: "auto" }}>
              {Mod}K toggles this palette
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

function currentTabExporter(
  state: OverlayState,
  exporters: {
    onExportOverlay: () => void;
    onExportCover: () => void;
    onExportPoster: () => void;
    onExportWallpaper: () => void;
  },
): () => void {
  switch (state.activeTab) {
    case "overlay":
      return exporters.onExportOverlay;
    case "cover":
      return exporters.onExportCover;
    case "poster":
      return exporters.onExportPoster;
    case "wallpaper":
      return exporters.onExportWallpaper;
  }
}

interface GroupProps {
  heading: string;
  children: React.ReactNode;
}

function Group({ heading, children }: GroupProps) {
  return (
    <Command.Group
      heading={heading}
      style={{ padding: "6px 0" }}
    >
      {children}
    </Command.Group>
  );
}

interface ItemProps {
  children: React.ReactNode;
  onSelect: () => void;
  value: string;
  shortcut?: string;
  active?: boolean;
  tone?: "default" | "danger";
  testId?: string;
}

function Item({
  children,
  onSelect,
  value,
  shortcut,
  active,
  tone = "default",
  testId,
}: ItemProps) {
  return (
    <Command.Item
      data-testid={testId}
      value={value}
      onSelect={onSelect}
      style={{
        padding: "8px 12px",
        margin: "0 6px",
        borderRadius: 6,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 13,
        color: tone === "danger" ? "#FF6FAE" : "#F4F7FF",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {active && (
          <span
            aria-hidden
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#7DD3FC",
              flexShrink: 0,
            }}
          />
        )}
        {children}
      </span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Command.Item>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 4,
        border: "1px solid #2a3060",
        background: "#0F1122",
        color: "#8DA8FF",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}
