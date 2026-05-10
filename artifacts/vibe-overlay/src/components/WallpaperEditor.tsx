import type { OverlayState } from "../types";
import {
  WALLPAPER_PRESETS,
  type WallpaperPresetId,
} from "../lib/wallpaper";

interface WallpaperEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * Wallpaper-specific editor: preview-size picker + visibility toggles for
 * the wallpaper-only fields (brand label + slogan + element switches).
 * Title / avatar / badges / socials are edited in the Cover & Poster tabs
 * since wallpaper reuses those data sources.
 */
export default function WallpaperEditor({
  state,
  onChange,
}: WallpaperEditorProps) {
  const { wallpaper } = state;

  const writeWallpaper = (patch: Partial<OverlayState["wallpaper"]>) => {
    onChange({ ...state, wallpaper: { ...wallpaper, ...patch } });
  };

  const setPreset = (id: WallpaperPresetId) => {
    writeWallpaper({ previewPresetId: id });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Preview-size picker */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4,
          background: "#0F1122",
          padding: 3,
          borderRadius: 6,
          border: "1px solid #1F2235",
        }}
      >
        {WALLPAPER_PRESETS.map((preset) => {
          const active = wallpaper.previewPresetId === preset.id;
          return (
            <button
              key={preset.id}
              data-testid={`wallpaper-preset-${preset.id}`}
              onClick={() => setPreset(preset.id)}
              style={{
                padding: "6px 0",
                background: active ? "#1F2235" : "transparent",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                color: active ? "#F4F7FF" : "#6B7CA8",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.04em",
                transition: "all 0.15s",
              }}
            >
              {preset.shortLabel}
              <span
                style={{
                  display: "block",
                  fontSize: 9,
                  fontWeight: 400,
                  color: active ? "#8DA8FF" : "#3a4060",
                  marginTop: 2,
                  letterSpacing: "0.02em",
                }}
              >
                {preset.width}×{preset.height}
              </span>
            </button>
          );
        })}
      </div>

      {/* Brand label */}
      <Field
        label="Brand Label"
        helper="标题上方小标签（用于强化个人品牌识别）"
        visible={wallpaper.brandLabelVisible}
        onToggle={(v) => writeWallpaper({ brandLabelVisible: v })}
        toggleTestId="wallpaper-brand-visible"
      >
        <PlainInput
          value={wallpaper.brandLabel}
          onChange={(v) => writeWallpaper({ brandLabel: v })}
          testId="wallpaper-brand-label"
          placeholder="VIBE CODING"
        />
      </Field>

      {/* Slogan */}
      <Field
        label="Slogan"
        helper="标题下方一句话主张"
        visible={wallpaper.sloganVisible}
        onToggle={(v) => writeWallpaper({ sloganVisible: v })}
        toggleTestId="wallpaper-slogan-visible"
      >
        <PlainInput
          value={wallpaper.slogan}
          onChange={(v) => writeWallpaper({ slogan: v })}
          testId="wallpaper-slogan"
          placeholder="Build clearly. Ship loudly."
        />
      </Field>

      {/* Element toggles */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          background: "#0F1122",
          border: "1px solid #1F2235",
          borderRadius: 8,
          padding: "4px 12px",
        }}
      >
        <ToggleRow
          label="Show Avatar"
          checked={wallpaper.avatarVisible}
          onChange={(v) => writeWallpaper({ avatarVisible: v })}
          testId="wallpaper-avatar-visible"
        />
        <ToggleRow
          label="Show Agent Badges"
          checked={wallpaper.badgesVisible}
          onChange={(v) => writeWallpaper({ badgesVisible: v })}
          testId="wallpaper-badges-visible"
        />
        <ToggleRow
          label="Show Social Card"
          checked={wallpaper.socialVisible}
          onChange={(v) => writeWallpaper({ socialVisible: v })}
          testId="wallpaper-social-visible"
        />
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#6B7CA8",
          lineHeight: 1.6,
          padding: "10px 12px",
          background: "#0F1122",
          border: "1px solid #1F2235",
          borderRadius: 8,
        }}
      >
        Title / Avatar / Badges / Social 内容在 Cover · Poster 标签页编辑，
        Wallpaper 这里只控制是否显示 + 自有的 Slogan / Brand Label。
      </div>
    </div>
  );
}

/* ─── Sub-controls ─────────────────────────────────────────────────────── */

interface FieldProps {
  label: string;
  helper?: string;
  visible: boolean;
  onToggle: (v: boolean) => void;
  toggleTestId?: string;
  children: React.ReactNode;
}

function Field({
  label,
  helper,
  visible,
  onToggle,
  toggleTestId,
  children,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        <Toggle checked={visible} onChange={onToggle} testId={toggleTestId} />
      </div>
      {helper && (
        <div style={{ fontSize: 10, color: "#6B7CA8", lineHeight: 1.4 }}>
          {helper}
        </div>
      )}
      {visible && children}
    </div>
  );
}

interface PlainInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testId?: string;
}

function PlainInput({ value, onChange, placeholder, testId }: PlainInputProps) {
  return (
    <input
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}

function Toggle({ checked, onChange, testId }: ToggleProps) {
  return (
    <button
      data-testid={testId}
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
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
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#F4F7FF",
          position: "absolute",
          top: 3,
          left: checked ? 19 : 3,
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}

function ToggleRow({ label, checked, onChange, testId }: ToggleRowProps) {
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
      <Toggle checked={checked} onChange={onChange} testId={testId} />
    </div>
  );
}
