import { useRef } from "react";
import { OverlayState } from "../types";
import { THEME_PRESETS, type ThemeMode } from "../lib/theme";
import SidebarSectionEditor from "./SidebarSectionEditor";
import BadgesEditor from "./BadgesEditor";
import SocialsEditor from "./SocialsEditor";
import BottomBarSegmentEditor from "./BottomBarSegmentEditor";
import LiveSessionEditor from "./LiveSessionEditor";
import StackEditor from "./StackEditor";
import WallpaperEditor from "./WallpaperEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface EditorPanelProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  onExportOverlay: () => void;
  onExportSidebar: () => void;
  onExportBottomBar: () => void;
  onExportCover: () => void;
  onExportPoster: () => void;
  onExportWallpaper: () => void;
  onReset: () => void;
  exporting: string | null;
}

function SectionInput({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#C7D2FE",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#0F1122",
          border: "1px solid #2a3060",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 13,
          color: "#F4F7FF",
          outline: "none",
          fontFamily: "inherit",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#8DA8FF")}
        onBlur={(e) => (e.target.style.borderColor = "#2a3060")}
      />
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  hint,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  testId?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: "space-between",
      }}
    >
      {/* Mini preview swatch — hover to see what this token controls */}
      <div
        title={hint}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: value,
          border: "1px solid rgba(255,255,255,0.12)",
          flexShrink: 0,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <label style={{ fontSize: 12, color: "#C7D2FE" }} title={hint}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: 10, color: "#6B7CA8", lineHeight: 1.3 }}>
            {hint}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          data-testid={testId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 28,
            height: 24,
            border: "1px solid #2a3060",
            borderRadius: 4,
            padding: 1,
            background: "transparent",
            cursor: "pointer",
          }}
        />
        <span style={{ fontSize: 11, color: "#8DA8FF", fontFamily: "monospace" }}>{value}</span>
      </div>
    </div>
  );
}

function ToggleButton({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0",
      }}
    >
      <span style={{ fontSize: 13, color: "#C7D2FE" }}>{label}</span>
      <button
        data-testid={testId}
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          border: "none",
          cursor: "pointer",
          background: checked ? "#8DA8FF" : "#1F2235",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#F4F7FF",
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

function ExportButton({
  label,
  onClick,
  loading,
  testId,
  accent,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  testId?: string;
  accent?: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        padding: "8px 12px",
        background: loading ? "#1F2235" : accent ? `${accent}18` : "#1A1C2E",
        border: `1px solid ${accent || "#8DA8FF"}40`,
        borderRadius: 7,
        color: accent || "#8DA8FF",
        fontSize: 12,
        fontWeight: 500,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "all 0.15s",
        opacity: loading ? 0.5 : 1,
        letterSpacing: "0.02em",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.target as HTMLElement).style.background = `${accent || "#8DA8FF"}25`;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          (e.target as HTMLElement).style.background = accent ? `${accent}18` : "#1A1C2E";
        }
      }}
    >
      {loading ? "Exporting..." : label}
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#8DA8FF",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "16px 0 8px",
        borderTop: "1px solid #1F2235",
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

export default function EditorPanel({
  state,
  onChange,
  onExportOverlay,
  onExportSidebar,
  onExportBottomBar,
  onExportCover,
  onExportPoster,
  onExportWallpaper,
  onReset,
  exporting,
}: EditorPanelProps) {
  const updateColor = (key: keyof typeof state.colors, value: string) => {
    onChange({ ...state, colors: { ...state.colors, [key]: value } });
  };

  const applyTheme = (mode: ThemeMode) => {
    onChange({
      ...state,
      theme: mode,
      colors: { ...THEME_PRESETS[mode] },
    });
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      onChange({ ...state, cover: { ...state.cover, avatarUrl: url } });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      data-testid="editor-panel"
      style={{
        width: 280,
        minWidth: 280,
        background: "#0D0E1C",
        borderRight: "1px solid #1F2235",
        height: "100vh",
        overflowY: "auto",
        padding: "0 0 32px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 0",
          borderBottom: "1px solid #1F2235",
          paddingBottom: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "#F4F7FF", letterSpacing: "-0.01em" }}>
          Vibe Coding
        </div>
        <div style={{ fontSize: 11, color: "#8DA8FF", letterSpacing: "0.04em", marginTop: 2 }}>
          Overlay Builder
        </div>
      </div>

      <div style={{ padding: "0 16px", flex: 1 }}>
        {/* Theme Switcher */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 16,
            background: "#0F1122",
            padding: 3,
            borderRadius: 8,
            border: "1px solid #1F2235",
          }}
        >
          {(["neon", "editorial"] as const).map((mode) => (
            <button
              key={mode}
              data-testid={`theme-${mode}`}
              onClick={() => applyTheme(mode)}
              style={{
                flex: 1,
                padding: "6px 0",
                background: state.theme === mode ? "#1F2235" : "transparent",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                color: state.theme === mode ? "#F4F7FF" : "#6B7CA8",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                transition: "all 0.15s",
              }}
            >
              {mode === "neon" ? "Neon" : "Editorial"}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 8,
            background: "#0F1122",
            padding: 3,
            borderRadius: 8,
            border: "1px solid #1F2235",
          }}
        >
          {(["overlay", "cover", "poster", "wallpaper"] as const).map((tab) => (
            <button
              key={tab}
              data-testid={`tab-${tab}`}
              onClick={() => onChange({ ...state, activeTab: tab })}
              style={{
                flex: 1,
                padding: "6px 0",
                background: state.activeTab === tab ? "#1F2235" : "transparent",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                color: state.activeTab === tab ? "#F4F7FF" : "#6B7CA8",
                cursor: "pointer",
                fontFamily: "inherit",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {state.activeTab === "overlay" && (
          <>
            {/* Visibility Toggles */}
            <SectionHeading>Visibility</SectionHeading>
            <ToggleButton
              label="Main Screen"
              checked={state.mainScreen.visible}
              onChange={(v) => onChange({ ...state, mainScreen: { ...state.mainScreen, visible: v } })}
              testId="toggle-main-screen"
            />
            <ToggleButton
              label="Camera Frame"
              checked={state.mainScreen.cameraVisible}
              onChange={(v) => onChange({ ...state, mainScreen: { ...state.mainScreen, cameraVisible: v } })}
              testId="toggle-camera"
            />
            <ToggleButton
              label="Right Sidebar"
              checked={state.sidebar.visible}
              onChange={(v) => onChange({ ...state, sidebar: { ...state.sidebar, visible: v } })}
              testId="toggle-sidebar"
            />
            <ToggleButton
              label="Sidebar Social Info"
              checked={state.sidebar.socialVisible}
              onChange={(v) => onChange({ ...state, sidebar: { ...state.sidebar, socialVisible: v } })}
              testId="toggle-sidebar-social"
            />
            <ToggleButton
              label="Bottom Bar"
              checked={state.bottomBar.visible}
              onChange={(v) => onChange({ ...state, bottomBar: { ...state.bottomBar, visible: v } })}
              testId="toggle-bottom-bar"
            />

            {/* Sidebar Sections */}
            <SectionHeading>Active Section</SectionHeading>
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "#0F1122",
                padding: 3,
                borderRadius: 8,
                border: "1px solid #1F2235",
              }}
            >
              {state.sidebar.sections.map((s, idx) => (
                <button
                  key={idx}
                  data-testid={`active-section-${idx}`}
                  onClick={() =>
                    onChange({
                      ...state,
                      sidebar: { ...state.sidebar, activeSection: idx },
                    })
                  }
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    background:
                      state.sidebar.activeSection === idx
                        ? "#1F2235"
                        : "transparent",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#F4F7FF",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.04em",
                    transition: "all 0.15s",
                  }}
                >
                  {s.title || `Section ${idx + 1}`}
                </button>
              ))}
            </div>

            <SectionHeading>Sidebar — Section 1</SectionHeading>
            <SidebarSectionEditor
              state={state}
              onChange={onChange}
              index={0}
              accentColor="#7DD3FC"
            />

            <SectionHeading>Sidebar — Section 2</SectionHeading>
            <SidebarSectionEditor
              state={state}
              onChange={onChange}
              index={1}
              accentColor="#FF6FAE"
            />

            <SectionHeading>Sidebar — Section 3</SectionHeading>
            <SidebarSectionEditor
              state={state}
              onChange={onChange}
              index={2}
              accentColor="#FFB86B"
            />

            {/* Bottom Bar */}
            <SectionHeading>Live Session</SectionHeading>
            <LiveSessionEditor state={state} onChange={onChange} />

            <SectionHeading>Stack</SectionHeading>
            <StackEditor state={state} onChange={onChange} />

            <SectionHeading>Bottom Bar — Segment 1</SectionHeading>
            <BottomBarSegmentEditor state={state} onChange={onChange} index={0} />

            <SectionHeading>Bottom Bar — Segment 2</SectionHeading>
            <BottomBarSegmentEditor state={state} onChange={onChange} index={1} />

            <SectionHeading>Bottom Bar — Segment 3</SectionHeading>
            <BottomBarSegmentEditor state={state} onChange={onChange} index={2} />
          </>
        )}

        {state.activeTab === "cover" && (
          <>
            {/* Avatar */}
            <SectionHeading>Cover — Avatar</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <ToggleButton
                label="Show Avatar"
                checked={state.cover.avatarVisible}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, avatarVisible: v } })}
                testId="cover-avatar-visible"
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    background: "#3B4FD818",
                    border: "1px solid #3B4FD840",
                    borderRadius: 7,
                    color: "#7C9FFF",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "center",
                  }}
                >
                  {state.cover.avatarUrl ? "Replace Photo" : "Upload Photo"}
                </button>
                {state.cover.avatarUrl && (
                  <button
                    onClick={() => onChange({ ...state, cover: { ...state.cover, avatarUrl: "" } })}
                    style={{
                      padding: "7px 10px",
                      background: "#FF6FAE12",
                      border: "1px solid #FF6FAE30",
                      borderRadius: 7,
                      color: "#FF6FAE",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {state.cover.avatarUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img
                    src={state.cover.avatarUrl}
                    alt="Avatar preview"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #2a3060",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#6B7CA8" }}>Photo uploaded</span>
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <SectionHeading>Cover — Title</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.cover.title}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, title: v } })}
                testId="cover-title"
              />
            </div>

            <SectionHeading>Cover — Agent Badges</SectionHeading>
            <BadgesEditor state={state} onChange={onChange} testIdPrefix="cover-badge" />

            {/* Subtitle */}
            <SectionHeading>Cover — Subtitle</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Subtitle"
                value={state.cover.hookText}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, hookText: v } })}
                testId="cover-subtitle"
              />
            </div>

            {/* Today's topic */}
            <SectionHeading>Cover — Today's Topic</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Card Label"
                value={state.cover.todayLabel}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, todayLabel: v } })}
                testId="cover-today-label"
              />
              <SectionInput
                label="Topic"
                value={state.cover.todayTopic}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, todayTopic: v } })}
                testId="cover-today-topic"
              />
            </div>

          </>
        )}

        {state.activeTab === "poster" && (
          <>
            {/* Avatar */}
            <SectionHeading>Poster — Avatar</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <ToggleButton
                label="Show Avatar"
                checked={state.cover.avatarVisible}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, avatarVisible: v } })}
                testId="poster-avatar-visible"
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    background: "#3B4FD818",
                    border: "1px solid #3B4FD840",
                    borderRadius: 7,
                    color: "#7C9FFF",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "center",
                  }}
                >
                  {state.cover.avatarUrl ? "Replace Photo" : "Upload Photo"}
                </button>
                {state.cover.avatarUrl && (
                  <button
                    onClick={() => onChange({ ...state, cover: { ...state.cover, avatarUrl: "" } })}
                    style={{
                      padding: "7px 10px",
                      background: "#FF6FAE12",
                      border: "1px solid #FF6FAE30",
                      borderRadius: 7,
                      color: "#FF6FAE",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {state.cover.avatarUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img
                    src={state.cover.avatarUrl}
                    alt="Avatar preview"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #2a3060",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#6B7CA8" }}>Photo uploaded</span>
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <SectionHeading>Poster — Title</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.cover.title}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, title: v } })}
                testId="poster-title"
              />
            </div>

            <SectionHeading>Poster — Agent Badges</SectionHeading>
            <BadgesEditor state={state} onChange={onChange} testIdPrefix="poster-badge" />

            {/* Today's topic */}
            <SectionHeading>Poster — Today's Topic</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Card Label"
                value={state.cover.todayLabel}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, todayLabel: v } })}
                testId="poster-today-label"
              />
              <SectionInput
                label="Topic"
                value={state.cover.todayTopic}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, todayTopic: v } })}
                testId="poster-today-topic"
              />
            </div>

            {/* Manifesto — optional */}
            <SectionHeading>Poster — Manifesto</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ToggleButton
                label="Show Manifesto"
                checked={state.cover.manifestoVisible}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, manifestoVisible: v } })}
                testId="poster-manifesto-visible"
              />
              {state.cover.manifestoVisible && (
                <>
                  <SectionInput
                    label="Line 1"
                    value={state.cover.manifestoLine1}
                    onChange={(v) => onChange({ ...state, cover: { ...state.cover, manifestoLine1: v } })}
                    testId="poster-manifesto-1"
                  />
                  <SectionInput
                    label="Line 2"
                    value={state.cover.manifestoLine2}
                    onChange={(v) => onChange({ ...state, cover: { ...state.cover, manifestoLine2: v } })}
                    testId="poster-manifesto-2"
                  />
                  <SectionInput
                    label="Line 3"
                    value={state.cover.manifestoLine3}
                    onChange={(v) => onChange({ ...state, cover: { ...state.cover, manifestoLine3: v } })}
                    testId="poster-manifesto-3"
                  />
                </>
              )}
            </div>

            {/* Hook text — optional */}
            <SectionHeading>Poster — Hook Text</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ToggleButton
                label="Show Hook Text"
                checked={state.cover.hookVisible}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, hookVisible: v } })}
                testId="poster-hook-visible"
              />
              {state.cover.hookVisible && (
                <SectionInput
                  label="Chinese Hook"
                  value={state.cover.hookText}
                  onChange={(v) => onChange({ ...state, cover: { ...state.cover, hookText: v } })}
                  testId="poster-hook-text"
                />
              )}
            </div>

            {/* Closing Line — advanced template, collapsible */}
            <SectionHeading>Poster — Advanced</SectionHeading>
            <details
              style={{
                background: "#0F1122",
                border: "1px solid #1F2235",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              <summary
                style={{
                  fontSize: 12,
                  color: "#C7D2FE",
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span>Closing Line · prefix · struck · highlight · suffix</span>
                <span style={{ fontSize: 10, color: "#6B7CA8" }}>optional</span>
              </summary>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px solid #1F2235",
                }}
              >
                <ToggleButton
                  label="Show Closing Line"
                  checked={state.cover.closingVisible}
                  onChange={(v) => onChange({ ...state, cover: { ...state.cover, closingVisible: v } })}
                  testId="poster-closing-visible"
                />
                {state.cover.closingVisible && (
                  <>
                    <SectionInput
                      label="Prefix"
                      value={state.cover.closingPrefix}
                      onChange={(v) => onChange({ ...state, cover: { ...state.cover, closingPrefix: v } })}
                      testId="poster-closing-prefix"
                    />
                    <SectionInput
                      label="Strikethrough word"
                      value={state.cover.closingStruck}
                      onChange={(v) => onChange({ ...state, cover: { ...state.cover, closingStruck: v } })}
                      testId="poster-closing-struck"
                    />
                    <SectionInput
                      label="Highlighted phrase"
                      value={state.cover.closingHighlight}
                      onChange={(v) => onChange({ ...state, cover: { ...state.cover, closingHighlight: v } })}
                      testId="poster-closing-highlight"
                    />
                    <SectionInput
                      label="Suffix"
                      value={state.cover.closingSuffix}
                      onChange={(v) => onChange({ ...state, cover: { ...state.cover, closingSuffix: v } })}
                      testId="poster-closing-suffix"
                    />
                  </>
                )}
              </div>
            </details>

            {/* Social Info */}
            <SectionHeading>Poster — Social Info</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ToggleButton
                label="Show Social Info"
                checked={state.cover.socialVisible}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, socialVisible: v } })}
                testId="poster-social-visible"
              />
              {state.cover.socialVisible && (
                <SocialsEditor
                  state={state}
                  onChange={onChange}
                  testIdPrefix="poster-social"
                />
              )}
            </div>
          </>
        )}

        {state.activeTab === "wallpaper" && (
          <>
            <SectionHeading>Wallpaper</SectionHeading>
            <WallpaperEditor state={state} onChange={onChange} />
          </>
        )}

        {/* Colors */}
        <SectionHeading>Colors — Surface</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ColorInput
            label="Background Dark"
            hint="Outer canvas background"
            value={state.colors.bgDark}
            onChange={(v) => updateColor("bgDark", v)}
            testId="color-bg-dark"
          />
          <ColorInput
            label="Panel Background"
            hint="Sidebar / bottom-bar / camera tile fill"
            value={state.colors.bgPanel}
            onChange={(v) => updateColor("bgPanel", v)}
            testId="color-bg-panel"
          />
          <ColorInput
            label="Border"
            hint="Panel hairline borders + accent dividers"
            value={state.colors.borderColor}
            onChange={(v) => updateColor("borderColor", v)}
            testId="color-border"
          />
        </div>

        <SectionHeading>Colors — Text</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ColorInput
            label="Text"
            hint="Main bullet copy and titles"
            value={state.colors.textColor}
            onChange={(v) => updateColor("textColor", v)}
            testId="color-text"
          />
          <ColorInput
            label="Muted Text"
            hint="Secondary captions and inactive sections"
            value={state.colors.mutedText}
            onChange={(v) => updateColor("mutedText", v)}
            testId="color-muted"
          />
          <ColorInput
            label="Subtle Text"
            hint="Eyebrow labels and footnote-level text"
            value={state.colors.subtleText}
            onChange={(v) => updateColor("subtleText", v)}
            testId="color-subtle"
          />
        </div>

        <SectionHeading>Colors — Accent</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ColorInput
            label="Cyan"
            hint="Section 1 accent (sidebar + bottom bar)"
            value={state.colors.cyanAccent}
            onChange={(v) => updateColor("cyanAccent", v)}
            testId="color-cyan"
          />
          <ColorInput
            label="Pink"
            hint="Section 2 accent + 'Follow me' header"
            value={state.colors.pinkAccent}
            onChange={(v) => updateColor("pinkAccent", v)}
            testId="color-pink"
          />
          <ColorInput
            label="Warm"
            hint="Section 3 accent + warm preset chips"
            value={state.colors.warmAccent}
            onChange={(v) => updateColor("warmAccent", v)}
            testId="color-warm"
          />
        </div>

        {/* Export Buttons */}
        <SectionHeading>Export</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <ExportButton
            label="Export Full Overlay PNG"
            onClick={onExportOverlay}
            loading={exporting === "overlay"}
            testId="btn-export-overlay"
            accent="#8DA8FF"
          />
          <ExportButton
            label="Export Right Sidebar PNG"
            onClick={onExportSidebar}
            loading={exporting === "sidebar"}
            testId="btn-export-sidebar"
            accent="#7DD3FC"
          />
          <ExportButton
            label="Export Bottom Bar PNG"
            onClick={onExportBottomBar}
            loading={exporting === "bottom-bar"}
            testId="btn-export-bottom-bar"
            accent="#FFB86B"
          />
          <ExportButton
            label="Export Cover PNG"
            onClick={onExportCover}
            loading={exporting === "cover"}
            testId="btn-export-cover"
            accent="#FF6FAE"
          />
          <ExportButton
            label="Export Poster PNG"
            onClick={onExportPoster}
            loading={exporting === "poster"}
            testId="btn-export-poster"
            accent="#C084FC"
          />
          <ExportButton
            label="Export Wallpaper Set (3 PNGs)"
            onClick={onExportWallpaper}
            loading={exporting === "wallpaper"}
            testId="btn-export-wallpaper"
            accent="#5EEAD4"
          />
        </div>

        {/* Reset */}
        <div style={{ marginTop: 12 }}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                data-testid="btn-reset"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid #2a2d4a",
                  borderRadius: 7,
                  color: "#6B7CA8",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = "#F4F7FF";
                  (e.target as HTMLElement).style.borderColor = "#3a3d5a";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = "#6B7CA8";
                  (e.target as HTMLElement).style.borderColor = "#2a2d4a";
                }}
              >
                Reset Defaults
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will discard all of your edits — sections, bullets,
                  bottom-bar text, cover/poster copy, and color overrides — and
                  load the factory state. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="btn-reset-cancel">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-testid="btn-reset-confirm"
                  onClick={onReset}
                >
                  Reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
