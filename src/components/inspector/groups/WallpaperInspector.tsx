import type { OverlayState } from "../../../types";
import { patchSection } from "../../../lib/state";
import InspectorGroup from "../InspectorGroup";
import BrandIdentityEditor from "../BrandIdentityEditor";
import { SectionInput, ToggleButton } from "../../shared/Field";
import { LineSegmented } from "../EditorRow";
import { WALLPAPER_PRESETS, getPresetLabels, type WallpaperPresetId } from "../../../lib/wallpaper";
import { useLocale } from "../../../hooks/useLocale";

interface WallpaperInspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * Wallpaper inspector. Title/avatar/badges live under Brand (shared with
 * Cover/Poster). The wallpaper-only fields — preview size + brand label +
 * slogan + element toggles — sit in their own groups below.
 */
export default function WallpaperInspector({
  state,
  onChange,
}: WallpaperInspectorProps) {
  const { locale, t } = useLocale();
  const { wallpaper } = state;

  const writeWallpaper = (patch: Partial<OverlayState["wallpaper"]>) => {
    onChange(patchSection(state, "wallpaper", patch));
  };

  const setPreset = (id: WallpaperPresetId) => {
    writeWallpaper({ previewPresetId: id });
  };

  return (
    <>
      <InspectorGroup
        title={t("group.brand")}
        hint={t("group.brand.hintAlt")}
        testId="group-wallpaper-brand"
      >
        <BrandIdentityEditor
          state={state}
          onChange={onChange}
          testIdPrefix="wallpaper"
          showAvatarToggle={false}
        />
      </InspectorGroup>

      <InspectorGroup
        title={t("group.previewSize")}
        hint={t("group.previewSize.hint")}
        testId="group-wallpaper-size"
      >
        <LineSegmented
          active={wallpaper.previewPresetId}
          columns={3}
          onSelect={(value) => setPreset(value as WallpaperPresetId)}
          options={WALLPAPER_PRESETS.map((preset) => {
            const labels = getPresetLabels(locale);
            return {
              value: preset.id,
              label: labels[preset.id].shortLabel,
              meta: `${preset.width}×${preset.height}`,
              testId: `wallpaper-preset-${preset.id}`,
            };
          })}
        />
      </InspectorGroup>

      <InspectorGroup
        title={t("group.brandLabel")}
        hint={t("group.brandLabel.hint")}
        testId="group-wallpaper-copy"
        defaultOpen={false}
      >
        <ToggleButton
          label={t("toggle.showBrandLabel")}
          checked={wallpaper.brandLabelVisible}
          onChange={(v) => writeWallpaper({ brandLabelVisible: v })}
          testId="wallpaper-brand-visible"
        />
        {wallpaper.brandLabelVisible && (
          <SectionInput
            label={t("label.brandLabel")}
            value={wallpaper.brandLabel}
            onChange={(v) => writeWallpaper({ brandLabel: v })}
            testId="wallpaper-brand-label"
            placeholder="VIBE STUDIO"
          />
        )}

        <ToggleButton
          label={t("toggle.showSlogan")}
          checked={wallpaper.sloganVisible}
          onChange={(v) => writeWallpaper({ sloganVisible: v })}
          testId="wallpaper-slogan-visible"
        />
        {wallpaper.sloganVisible && (
          <SectionInput
            label={t("label.slogan")}
            value={wallpaper.slogan}
            onChange={(v) => writeWallpaper({ slogan: v })}
            testId="wallpaper-slogan"
            placeholder="Build clearly. Ship loudly."
          />
        )}
      </InspectorGroup>

      <InspectorGroup
        title={t("group.visibility")}
        hint={t("group.visibility.hint")}
        testId="group-wallpaper-visibility"
        defaultOpen={false}
      >
        <ToggleButton
          label={t("toggle.showAvatar")}
          checked={wallpaper.avatarVisible}
          onChange={(v) => writeWallpaper({ avatarVisible: v })}
          testId="wallpaper-avatar-visible"
        />
        <ToggleButton
          label={t("toggle.showAgentBadges")}
          checked={wallpaper.badgesVisible}
          onChange={(v) => writeWallpaper({ badgesVisible: v })}
          testId="wallpaper-badges-visible"
        />
        <ToggleButton
          label={t("toggle.showSocialCard")}
          checked={wallpaper.socialVisible}
          onChange={(v) => writeWallpaper({ socialVisible: v })}
          testId="wallpaper-social-visible"
        />
      </InspectorGroup>
    </>
  );
}
