import { OverlayState } from "../types";

interface EditorPanelProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  onExportOverlay: () => void;
  onExportSidebar: () => void;
  onExportBottomBar: () => void;
  onExportCover: () => void;
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
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
      <label style={{ fontSize: 12, color: "#C7D2FE", flex: 1 }}>{label}</label>
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
  onReset,
  exporting,
}: EditorPanelProps) {
  const updateSidebarSection = (idx: number, field: "title" | "bullets", value: string | string[]) => {
    const sections = state.sidebar.sections.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    onChange({ ...state, sidebar: { ...state.sidebar, sections } });
  };

  const updateSidebarBullet = (sectionIdx: number, bulletIdx: number, value: string) => {
    const sections = state.sidebar.sections.map((s, i) => {
      if (i !== sectionIdx) return s;
      const bullets = s.bullets.map((b, j) => (j === bulletIdx ? value : b));
      return { ...s, bullets };
    });
    onChange({ ...state, sidebar: { ...state.sidebar, sections } });
  };

  const updateSegment = (idx: number, field: "title" | "text", value: string) => {
    const segments = state.bottomBar.segments.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    onChange({ ...state, bottomBar: { ...state.bottomBar, segments } });
  };

  const updateColor = (key: keyof typeof state.colors, value: string) => {
    onChange({ ...state, colors: { ...state.colors, [key]: value } });
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
        {/* Tabs */}
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
          {(["overlay", "cover"] as const).map((tab) => (
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
                fontSize: 12,
                fontWeight: 500,
                color: state.activeTab === tab ? "#F4F7FF" : "#6B7CA8",
                cursor: "pointer",
                fontFamily: "inherit",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {tab === "overlay" ? "Overlay" : "Cover"}
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
              onChange={(v) => onChange({ ...state, mainScreen: { visible: v } })}
              testId="toggle-main-screen"
            />
            <ToggleButton
              label="Right Sidebar"
              checked={state.sidebar.visible}
              onChange={(v) => onChange({ ...state, sidebar: { ...state.sidebar, visible: v } })}
              testId="toggle-sidebar"
            />
            <ToggleButton
              label="Bottom Bar"
              checked={state.bottomBar.visible}
              onChange={(v) => onChange({ ...state, bottomBar: { ...state.bottomBar, visible: v } })}
              testId="toggle-bottom-bar"
            />

            {/* Sidebar Sections */}
            <SectionHeading>Sidebar — Section 1</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.sidebar.sections[0].title}
                onChange={(v) => updateSidebarSection(0, "title", v)}
                testId="sidebar-s1-title"
              />
              {state.sidebar.sections[0].bullets.map((b, i) => (
                <SectionInput
                  key={i}
                  label={`Bullet ${i + 1}`}
                  value={b}
                  onChange={(v) => updateSidebarBullet(0, i, v)}
                  testId={`sidebar-s1-bullet-${i}`}
                />
              ))}
            </div>

            <SectionHeading>Sidebar — Section 2</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.sidebar.sections[1].title}
                onChange={(v) => updateSidebarSection(1, "title", v)}
                testId="sidebar-s2-title"
              />
              {state.sidebar.sections[1].bullets.map((b, i) => (
                <SectionInput
                  key={i}
                  label={`Bullet ${i + 1}`}
                  value={b}
                  onChange={(v) => updateSidebarBullet(1, i, v)}
                  testId={`sidebar-s2-bullet-${i}`}
                />
              ))}
            </div>

            <SectionHeading>Sidebar — Section 3</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.sidebar.sections[2].title}
                onChange={(v) => updateSidebarSection(2, "title", v)}
                testId="sidebar-s3-title"
              />
              {state.sidebar.sections[2].bullets.map((b, i) => (
                <SectionInput
                  key={i}
                  label={`Bullet ${i + 1}`}
                  value={b}
                  onChange={(v) => updateSidebarBullet(2, i, v)}
                  testId={`sidebar-s3-bullet-${i}`}
                />
              ))}
            </div>

            {/* Bottom Bar */}
            <SectionHeading>Bottom Bar — Segment 1</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.bottomBar.segments[0].title}
                onChange={(v) => updateSegment(0, "title", v)}
                testId="bottom-seg1-title"
              />
              <SectionInput
                label="Text"
                value={state.bottomBar.segments[0].text}
                onChange={(v) => updateSegment(0, "text", v)}
                testId="bottom-seg1-text"
              />
            </div>

            <SectionHeading>Bottom Bar — Segment 2</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.bottomBar.segments[1].title}
                onChange={(v) => updateSegment(1, "title", v)}
                testId="bottom-seg2-title"
              />
              <SectionInput
                label="Text"
                value={state.bottomBar.segments[1].text}
                onChange={(v) => updateSegment(1, "text", v)}
                testId="bottom-seg2-text"
              />
            </div>

            <SectionHeading>Bottom Bar — Segment 3</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.bottomBar.segments[2].title}
                onChange={(v) => updateSegment(2, "title", v)}
                testId="bottom-seg3-title"
              />
              <SectionInput
                label="Text"
                value={state.bottomBar.segments[2].text}
                onChange={(v) => updateSegment(2, "text", v)}
                testId="bottom-seg3-text"
              />
            </div>
          </>
        )}

        {state.activeTab === "cover" && (
          <>
            <SectionHeading>Cover Image</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionInput
                label="Title"
                value={state.cover.title}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, title: v } })}
                testId="cover-title"
              />
              <SectionInput
                label="Subtitle"
                value={state.cover.subtitle}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, subtitle: v } })}
                testId="cover-subtitle"
              />
              <SectionInput
                label="Badge 1"
                value={state.cover.badge1}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, badge1: v } })}
                testId="cover-badge1"
              />
              <SectionInput
                label="Badge 2"
                value={state.cover.badge2}
                onChange={(v) => onChange({ ...state, cover: { ...state.cover, badge2: v } })}
                testId="cover-badge2"
              />
            </div>
          </>
        )}

        {/* Colors */}
        <SectionHeading>Colors</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ColorInput label="Background Dark" value={state.colors.bgDark} onChange={(v) => updateColor("bgDark", v)} testId="color-bg-dark" />
          <ColorInput label="Panel Background" value={state.colors.bgPanel} onChange={(v) => updateColor("bgPanel", v)} testId="color-bg-panel" />
          <ColorInput label="Border Color" value={state.colors.borderColor} onChange={(v) => updateColor("borderColor", v)} testId="color-border" />
          <ColorInput label="Text Color" value={state.colors.textColor} onChange={(v) => updateColor("textColor", v)} testId="color-text" />
          <ColorInput label="Muted Text" value={state.colors.mutedText} onChange={(v) => updateColor("mutedText", v)} testId="color-muted" />
          <ColorInput label="Cyan Accent" value={state.colors.cyanAccent} onChange={(v) => updateColor("cyanAccent", v)} testId="color-cyan" />
          <ColorInput label="Pink Accent" value={state.colors.pinkAccent} onChange={(v) => updateColor("pinkAccent", v)} testId="color-pink" />
          <ColorInput label="Warm Accent" value={state.colors.warmAccent} onChange={(v) => updateColor("warmAccent", v)} testId="color-warm" />
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
        </div>

        {/* Reset */}
        <div style={{ marginTop: 12 }}>
          <button
            data-testid="btn-reset"
            onClick={onReset}
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
        </div>
      </div>
    </div>
  );
}
