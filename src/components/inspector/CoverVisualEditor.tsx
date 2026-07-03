import type { CoverVisual, OverlayState } from "../../types";
import { patchSection } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import AvatarUploader from "../shared/AvatarUploader";
import { WorkbenchLabel } from "../shared/Field";
import { LineSegmented, RuleNote } from "./EditorRow";

const DEFAULT_COVER_PORTRAIT_URL = "/avatar.png";
const DEFAULT_COVER_SCENE_URL = "/vibe-studio-bg.png";

interface CoverVisualEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * The cover's primary control: pick the visual type (avatar headshot / studio
 * scene / pure title), then replace the image for the *active* type only. This
 * replaces the ambiguous "Show Avatar" toggle so it is obvious which subject
 * the cover shows. Title mode shows no upload control at all.
 */
export default function CoverVisualEditor({
  state,
  onChange,
}: CoverVisualEditorProps) {
  const { t } = useLocale();
  const { cover } = state;
  const writeCover = (patch: Partial<OverlayState["cover"]>) => {
    onChange(patchSection(state, "cover", patch));
  };

  const options: { value: CoverVisual; label: string }[] = [
    { value: "avatar", label: t("cover.visual.avatar") },
    { value: "scene", label: t("cover.visual.scene") },
    { value: "title", label: t("cover.visual.title") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <WorkbenchLabel>{t("cover.visual.label")}</WorkbenchLabel>
        <LineSegmented
          active={cover.visual}
          onSelect={(value) => writeCover({ visual: value as CoverVisual })}
          options={options.map((opt) => ({
            value: opt.value,
            label: opt.label,
            testId: `cover-visual-${opt.value}`,
          }))}
          testId="cover-visual"
        />
      </div>

      {cover.visual === "avatar" && (
        <AvatarUploader
          url={cover.portraitUrl || DEFAULT_COVER_PORTRAIT_URL}
          onUrlChange={(v) => writeCover({ portraitUrl: v })}
          showToggle={false}
          clearValue="/avatar.png"
          maxDimension={1440}
          testIdPrefix="cover-portrait"
        />
      )}

      {cover.visual === "scene" && (
        <AvatarUploader
          url={cover.sceneUrl || DEFAULT_COVER_SCENE_URL}
          onUrlChange={(v) => writeCover({ sceneUrl: v })}
          showToggle={false}
          clearValue="/vibe-studio-bg.png"
          maxDimension={1440}
          testIdPrefix="cover-scene"
        />
      )}

      {cover.visual === "title" && (
        <RuleNote>{t("cover.visual.titleNote")}</RuleNote>
      )}
    </div>
  );
}
