import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import {
  WALLPAPER_PRESETS,
  getPresetLabels,
  type WallpaperPresetId,
} from "../lib/wallpaper";
import { useLocale } from "../hooks/useLocale";
import {
  TextInput,
  ToggleButton,
  WorkbenchLabel,
  WorkbenchSegmented,
  workbenchNoteStyle,
} from "./shared/Field";
import type { ReactNode } from "react";

interface WallpaperEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * Legacy standalone wallpaper editor kept for compatibility with older local
 * imports. The current app route uses WallpaperInspector, but this surface
 * still follows the shared workbench control atoms so old styles cannot leak
 * back if it is revived.
 */
export default function WallpaperEditor({
  state,
  onChange,
}: WallpaperEditorProps) {
  const { locale, t } = useLocale();
  const { wallpaper } = state;

  const writeWallpaper = (patch: Partial<OverlayState["wallpaper"]>) => {
    onChange(patchSection(state, "wallpaper", patch));
  };

  const setPreset = (id: WallpaperPresetId) => {
    writeWallpaper({ previewPresetId: id });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <WorkbenchSegmented
        active={wallpaper.previewPresetId}
        columns={3}
        onSelect={(value) => setPreset(value as WallpaperPresetId)}
        options={WALLPAPER_PRESETS.map((preset) => {
          const labels = getPresetLabels(locale);
          return {
            value: preset.id,
            label: labels[preset.id].shortLabel,
            meta: `${preset.width}x${preset.height}`,
            testId: `wallpaper-preset-${preset.id}`,
          };
        })}
      />

      <Field
        label={t("toggle.showBrandLabel")}
        helper={t("group.brandLabel.hint")}
        visible={wallpaper.brandLabelVisible}
        onToggle={(v) => writeWallpaper({ brandLabelVisible: v })}
        toggleTestId="wallpaper-brand-visible"
      >
        <TextInput
          value={wallpaper.brandLabel}
          onChange={(v) => writeWallpaper({ brandLabel: v })}
          testId="wallpaper-brand-label"
          placeholder="VIBE CODING"
        />
      </Field>

      <Field
        label={t("toggle.showSlogan")}
        helper={t("group.brandLabel.hint")}
        visible={wallpaper.sloganVisible}
        onToggle={(v) => writeWallpaper({ sloganVisible: v })}
        toggleTestId="wallpaper-slogan-visible"
      >
        <TextInput
          value={wallpaper.slogan}
          onChange={(v) => writeWallpaper({ slogan: v })}
          testId="wallpaper-slogan"
          placeholder="Build clearly. Ship loudly."
        />
      </Field>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <ToggleRow
          label={t("toggle.showAvatar")}
          checked={wallpaper.avatarVisible}
          onChange={(v) => writeWallpaper({ avatarVisible: v })}
          testId="wallpaper-avatar-visible"
        />
        <ToggleRow
          label={t("toggle.showAgentBadges")}
          checked={wallpaper.badgesVisible}
          onChange={(v) => writeWallpaper({ badgesVisible: v })}
          testId="wallpaper-badges-visible"
        />
        <ToggleRow
          label={t("toggle.showSocialCard")}
          checked={wallpaper.socialVisible}
          onChange={(v) => writeWallpaper({ socialVisible: v })}
          testId="wallpaper-social-visible"
        />
      </div>

      <div style={workbenchNoteStyle}>
        {t("group.brand.hintAlt")} · {t("group.brandLabel.hint")}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  helper?: string;
  visible: boolean;
  onToggle: (v: boolean) => void;
  toggleTestId?: string;
  children: ReactNode;
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <WorkbenchLabel>{label}</WorkbenchLabel>
        <ToggleButton
          label=""
          checked={visible}
          onChange={onToggle}
          testId={toggleTestId}
        />
      </div>
      {helper && <div style={{ ...workbenchNoteStyle, padding: "6px 8px" }}>{helper}</div>}
      {visible && children}
    </div>
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
        gap: 10,
      }}
    >
      <span style={{ fontSize: 13 }}>{label}</span>
      <ToggleButton
        label=""
        checked={checked}
        onChange={onChange}
        testId={testId}
      />
    </div>
  );
}
