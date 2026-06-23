import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import { patchSection, produceState } from "../lib/state";
import { THEME_PRESETS, type ThemeMode } from "../lib/theme";
import { useLocale } from "../hooks/useLocale";
import type { Locale } from "../lib/i18n";

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
  const { t, locale, setLocale } = useLocale();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");

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
    fn();
    onClose();
  };

  const switchTab = (tab: OverlayState["activeTab"]) =>
    onChange(
      produceState(state, (draft) => {
        draft.activeTab = tab;
      }),
    );

  const applyTheme = (mode: ThemeMode) =>
    onChange(
      produceState(state, (draft) => {
        draft.theme = mode;
        draft.colors = { ...THEME_PRESETS[mode] };
      }),
    );

  const toggleVisibility = (
    section: "main" | "camera" | "sidebar" | "sidebar-social" | "bottom-bar",
  ) => {
    switch (section) {
      case "main":
        onChange(patchSection(state, "mainScreen", { visible: !state.mainScreen.visible }));
        break;
      case "camera":
        onChange(
          patchSection(state, "mainScreen", {
            cameraVisible: !state.mainScreen.cameraVisible,
          }),
        );
        break;
      case "sidebar":
        onChange(patchSection(state, "sidebar", { visible: !state.sidebar.visible }));
        break;
      case "sidebar-social":
        onChange(
          patchSection(state, "sidebar", {
            socialVisible: !state.sidebar.socialVisible,
          }),
        );
        break;
      case "bottom-bar":
        onChange(patchSection(state, "bottomBar", { visible: !state.bottomBar.visible }));
        break;
    }
  };

  return (
    <>
      <style>{`
        [cmdk-item=""][data-selected="true"] {
          background: ${UI_COLORS.hoverSurface};
          box-shadow: inset 2px 0 0 ${UI_COLORS.accent};
        }
        [cmdk-item=""][data-disabled="true"] {
          opacity: 0.5;
          pointer-events: none;
        }
        [cmdk-group-heading=""] {
          font-family: var(--app-font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${UI_COLORS.textMuted};
          padding: 10px 14px 5px;
        }
      `}</style>

      <div
        data-testid="cmdk-scrim"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: UI_COLORS.overlayScrim,
          zIndex: 100,
        }}
      />

      <div
        data-testid="cmdk-dialog"
        role="dialog"
        aria-label={t("topbar.commandPalette")}
        style={{
          position: "fixed",
          top: "18vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(640px, 92vw)",
          background: UI_COLORS.appSurface,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: 8,
          boxShadow: UI_COLORS.commandShadow,
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
            color: UI_COLORS.text,
            fontFamily: "inherit",
          }}
        >
          <div
            style={{
              padding: "13px 16px",
              borderBottom: `1px solid ${UI_COLORS.border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 14, color: UI_COLORS.textMuted }}>⌕</span>
            <Command.Input
              ref={inputRef}
              data-testid="cmdk-input"
              value={search}
              onValueChange={setSearch}
              autoFocus
              placeholder={t("cmdk.placeholder")}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: UI_COLORS.text,
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
                color: UI_COLORS.textMuted,
                textAlign: "center",
              }}
            >
              {t("cmdk.empty")}
            </Command.Empty>

            <Group heading={t("cmdk.group.switchTab")}>
              <Item
                value="tab-overlay 合成画面 overlay"
                onSelect={run(() => switchTab("overlay"))}
                shortcut={`${Mod} 1`}
                active={state.activeTab === "overlay"}
                testId="cmdk-tab-overlay"
              >
                {t("cmdk.tab.overlay")}
              </Item>
              <Item
                value="tab-live 直播数据 live data sections live bar"
                onSelect={run(() => switchTab("live"))}
                active={state.activeTab === "live"}
                testId="cmdk-tab-live"
              >
                {t("cmdk.tab.live")}
              </Item>
              <Item
                value="tab-cover 封面 cover"
                onSelect={run(() => switchTab("cover"))}
                shortcut={`${Mod} 2`}
                active={state.activeTab === "cover"}
                testId="cmdk-tab-cover"
              >
                {t("cmdk.tab.cover")}
              </Item>
              <Item
                value="tab-poster 海报 poster"
                onSelect={run(() => switchTab("poster"))}
                shortcut={`${Mod} 3`}
                active={state.activeTab === "poster"}
                testId="cmdk-tab-poster"
              >
                {t("cmdk.tab.poster")}
              </Item>
              <Item
                value="tab-wallpaper 壁纸 wallpaper"
                onSelect={run(() => switchTab("wallpaper"))}
                shortcut={`${Mod} 4`}
                active={state.activeTab === "wallpaper"}
                testId="cmdk-tab-wallpaper"
              >
                {t("cmdk.tab.wallpaper")}
              </Item>
            </Group>

            <Group heading={t("cmdk.group.export")}>
              <Item
                value="export-current 导出当前 export current"
                onSelect={run(currentTabExporter(state, {
                  onExportOverlay,
                  onExportCover,
                  onExportPoster,
                  onExportWallpaper,
                }))}
                shortcut={`${Mod} E`}
                testId="cmdk-export-current"
              >
                {t("cmdk.export.current")}
              </Item>
              <Item value="export-overlay 导出 overlay full png" onSelect={run(onExportOverlay)} testId="cmdk-export-overlay">
                {t("export.fullOverlay")}
              </Item>
              <Item value="export-cover 导出封面 cover png" onSelect={run(onExportCover)} testId="cmdk-export-cover">
                {t("export.coverPng")}
              </Item>
              <Item value="export-poster 导出海报 poster png" onSelect={run(onExportPoster)} testId="cmdk-export-poster">
                {t("export.posterPng")}
              </Item>
              <Item
                value="export-wallpaper 导出壁纸 wallpaper set png"
                onSelect={run(onExportWallpaper)}
                testId="cmdk-export-wallpaper"
              >
                {t("export.wallpaperSet")}
              </Item>
              <Item value="export-sidebar 导出侧栏 sidebar slice" onSelect={run(onExportSidebar)} testId="cmdk-export-sidebar">
                {t("export.sidebar")}
              </Item>
              <Item
                value="export-bottom-bar 导出底栏 bottom bar slice"
                onSelect={run(onExportBottomBar)}
                testId="cmdk-export-bottom-bar"
              >
                {t("export.bottomBar")}
              </Item>
            </Group>

            <Group heading={t("cmdk.group.theme")}>
              <Item
                value="theme-light 主题 light 浅色 paper"
                onSelect={run(() => applyTheme("light"))}
                active={state.theme === "light"}
                testId="cmdk-theme-light"
              >
                {t("cmdk.theme.light")}
              </Item>
              <Item
                value="theme-dark 主题 dark 深色"
                onSelect={run(() => applyTheme("dark"))}
                active={state.theme === "dark"}
                testId="cmdk-theme-dark"
              >
                {t("cmdk.theme.dark")}
              </Item>
            </Group>

            <Group heading={t("cmdk.group.visibility")}>
              <Item
                value="toggle-main 显示切换 main screen 主画面"
                onSelect={run(() => toggleVisibility("main"))}
                testId="cmdk-toggle-main"
              >
                {state.mainScreen.visible ? t("cmdk.hide") : t("cmdk.show")} {t("toggle.mainScreen")}
              </Item>
              <Item
                value="toggle-camera 显示切换 camera frame 摄像头"
                onSelect={run(() => toggleVisibility("camera"))}
                testId="cmdk-toggle-camera"
              >
                {state.mainScreen.cameraVisible ? t("cmdk.hide") : t("cmdk.show")} {t("toggle.cameraFrame")}
              </Item>
              <Item
                value="toggle-sidebar 显示切换 sidebar 侧栏"
                onSelect={run(() => toggleVisibility("sidebar"))}
                testId="cmdk-toggle-sidebar"
              >
                {state.sidebar.visible ? t("cmdk.hide") : t("cmdk.show")} {t("toggle.rightSidebar")}
              </Item>
              <Item
                value="toggle-sidebar-social 显示切换 social 社交 sidebar"
                onSelect={run(() => toggleVisibility("sidebar-social"))}
                testId="cmdk-toggle-sidebar-social"
              >
                {state.sidebar.socialVisible ? t("cmdk.hide") : t("cmdk.show")} {t("toggle.sidebarSocial")}
              </Item>
              <Item
                value="toggle-bottom-bar 显示切换 bottom bar 底栏"
                onSelect={run(() => toggleVisibility("bottom-bar"))}
                testId="cmdk-toggle-bottom-bar"
              >
                {state.bottomBar.visible ? t("cmdk.hide") : t("cmdk.show")} {t("toggle.bottomBar")}
              </Item>
            </Group>

            <Group heading={t("cmdk.group.language")}>
              <Item
                value="locale language 语言 english"
                onSelect={run(() => setLocale("en"))}
                testId="cmdk-locale-en"
              >
                {t("cmdk.locale.en")}
              </Item>
              <Item
                value="locale language 语言 chinese 中文"
                onSelect={run(() => setLocale("zh"))}
                testId="cmdk-locale-zh"
              >
                {t("cmdk.locale.zh")}
              </Item>
            </Group>

            <Group heading={t("cmdk.group.app")}>
              <Item
                value="settings 设置 preferences"
                onSelect={run(onOpenSettings)}
                shortcut={`${Mod} ,`}
                testId="cmdk-open-settings"
              >
                {t("cmdk.settings")}
              </Item>
              <Item
                value="reset defaults 重置 reset"
                onSelect={run(onReset)}
                testId="cmdk-reset"
                tone="danger"
              >
                {t("cmdk.reset")}
              </Item>
            </Group>
          </Command.List>

          <div
            style={{
              padding: "8px 14px",
              borderTop: `1px solid ${UI_COLORS.border}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 11,
              color: UI_COLORS.textMuted,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>{t("cmdk.navigate")}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Kbd>↵</Kbd>
              <span>{t("cmdk.select")}</span>
            </span>
            <span style={{ marginLeft: "auto" }}>
              {Mod}K {t("cmdk.toggleHint")}
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}

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
    case "live":
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
        color: tone === "danger" ? UI_COLORS.danger : UI_COLORS.text,
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
              background: UI_COLORS.accent,
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
        fontFamily: "var(--app-font-mono)",
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 3,
        border: `1px solid ${UI_COLORS.border}`,
        background: UI_COLORS.controlSurface,
        color: UI_COLORS.accentText,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}
