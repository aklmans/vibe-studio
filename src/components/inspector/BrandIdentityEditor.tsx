import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import AvatarUploader from "../shared/AvatarUploader";
import CoverVisualEditor from "./CoverVisualEditor";
import { SectionInput, WorkbenchLabel } from "../shared/Field";
import BadgesEditor from "../BadgesEditor";
import { useLocale } from "../../hooks/useLocale";

const DEFAULT_BROADCAST_AVATAR_URL = "/avatar.png";

interface BrandIdentityEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix: string;
  /** Some surfaces (Cover) want a subtitle; Poster/Wallpaper don't. */
  showSubtitle?: boolean;
  /**
   * Cover replaces the shared "Show Avatar" uploader with the explicit
   * visual-type control. Poster / Wallpaper keep the shared avatar URL uploader;
   * individual surfaces may own their own visibility toggle.
   */
  coverVisual?: boolean;
  showAvatarToggle?: boolean;
  showCopy?: boolean;
  showBadges?: boolean;
  showNote?: boolean;
}

/**
 * Shared "who am I" editor used by Cover, Poster, and Wallpaper inspectors.
 * Holds avatar + title + (optional subtitle/hookText) + agent badges. All of
 * these live under `state.cover` so changes show up in every surface.
 */
export default function BrandIdentityEditor({
  state,
  onChange,
  testIdPrefix,
  showSubtitle = false,
  coverVisual = false,
  showAvatarToggle = true,
  showCopy = true,
  showBadges = true,
  showNote = true,
}: BrandIdentityEditorProps) {
  const { t } = useLocale();
  const writeCover = (patch: Partial<OverlayState["cover"]>) => {
    onChange(patchSection(state, "cover", patch));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {coverVisual ? (
        <CoverVisualEditor state={state} onChange={onChange} />
      ) : (
        <AvatarUploader
          url={state.cover.avatarUrl}
          visible={state.cover.avatarVisible}
          onUrlChange={(v) => writeCover({ avatarUrl: v })}
          onVisibleChange={(v) => writeCover({ avatarVisible: v })}
          showToggle={showAvatarToggle}
          clearValue={DEFAULT_BROADCAST_AVATAR_URL}
          testIdPrefix={`${testIdPrefix}-avatar`}
        />
      )}

      {showCopy && (
        <>
          <SectionInput
            label={t("label.title")}
            value={state.cover.title}
            onChange={(v) => writeCover({ title: v })}
            testId={`${testIdPrefix}-title`}
          />

          {showSubtitle && (
            <SectionInput
              label={t("label.subtitle")}
              value={state.cover.hookText}
              onChange={(v) => writeCover({ hookText: v })}
              testId={`${testIdPrefix}-subtitle`}
            />
          )}
        </>
      )}

      {showBadges && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <WorkbenchLabel>
            {t("label.badge")}s
          </WorkbenchLabel>
          <BadgesEditor
            state={state}
            onChange={onChange}
            testIdPrefix={`${testIdPrefix}-badge`}
          />
        </div>
      )}

      {showNote && (
        <div
          style={{
            // A left-ruled editorial aside instead of a filled note box.
            fontSize: 11,
            color: UI_COLORS.textMuted,
            lineHeight: 1.5,
            paddingLeft: 10,
            borderLeft: `2px solid ${UI_COLORS.rule}`,
          }}
        >
          {t("brandIdentity.note")}
        </div>
      )}
    </div>
  );
}
