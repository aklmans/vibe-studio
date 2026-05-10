import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import { patchSection } from "../lib/state";
import {
  WALLPAPER_PRESETS,
  getPresetLabels,
  type WallpaperPresetId,
} from "../lib/wallpaper";
import { useLocale } from "../hooks/useLocale";

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
  const { locale } = useLocale();
  const { wallpaper } = state;

  const writeWallpaper = (patch: Partial<OverlayState["wallpaper"]>) => {
    onChange(patchSection(state, "wallpaper", patch));
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
          background: UI_COLORS.controlSurface,
          padding: 3,
          borderRadius: 6,
          border: `1px solid ${UI_COLORS.panelSurface}`,
        }}
      >
        {WALLPAPER_PRESETS.map((preset) => {
          const labels = getPresetLabels(locale);
          const active = wallpaper.previewPresetId === preset.id;
          return (
            <button
              key={preset.id}
              data-testid={`wallpaper-preset-${preset.id}`}
              onClick={() => setPreset(preset.id)}
              style={{
                padding: "6px 0",
                background: active ? UI_COLORS.panelSurface : "transparent",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                color: active ? UI_COLORS.text : UI_COLORS.textMuted,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.04em",
                transition: "all 0.15s",
              }}
            >
              {labels[preset.id].shortLabel}
              <span
                style={{
                  display: "block",
                  fontSize: 9,
                  fontWeight: 400,
                  color: active ? UI_COLORS.focus : UI_COLORS.textSubtle,
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
          background: UI_COLORS.controlSurface,
          border: `1px solid ${UI_COLORS.panelSurface}`,
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
          color: UI_COLORS.textMuted,
          lineHeight: 1.6,
          padding: "10px 12px",
          background: UI_COLORS.controlSurface,
          border: `1px solid ${UI_COLORS.panelSurface}`,
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
            color: UI_COLORS.textSoft,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
        <Toggle checked={visible} onChange={onToggle} testId={toggleTestId} />
      </div>
      {helper && (
        <div style={{ fontSize: 10, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
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
        background: UI_COLORS.controlSurface,
        border: `1px solid ${UI_COLORS.controlBorder}`,
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 13,
        color: UI_COLORS.text,
        outline: "none",
        fontFamily: "inherit",
        width: "100%",
        boxSizing: "border-box",
      }}
      onFocus={(e) => (e.target.style.borderColor = UI_COLORS.focus)}
      onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
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
        background: checked ? UI_COLORS.focus : UI_COLORS.panelSurface,
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
          background: UI_COLORS.text,
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
      <span style={{ fontSize: 13, color: UI_COLORS.textSoft }}>{label}</span>
      <Toggle checked={checked} onChange={onChange} testId={testId} />
    </div>
  );
}
