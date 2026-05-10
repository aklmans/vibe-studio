import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import AvatarUploader from "../shared/AvatarUploader";
import { SectionInput } from "../shared/Field";
import BadgesEditor from "../BadgesEditor";
import { useLocale } from "../../hooks/useLocale";

interface BrandIdentityEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix: string;
  /** Some surfaces (Cover) want a subtitle; Poster/Wallpaper don't. */
  showSubtitle?: boolean;
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
}: BrandIdentityEditorProps) {
  const { t } = useLocale();
  const writeCover = (patch: Partial<OverlayState["cover"]>) => {
    onChange(patchSection(state, "cover", patch));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AvatarUploader
        url={state.cover.avatarUrl}
        visible={state.cover.avatarVisible}
        onUrlChange={(v) => writeCover({ avatarUrl: v })}
        onVisibleChange={(v) => writeCover({ avatarVisible: v })}
        testIdPrefix={`${testIdPrefix}-avatar`}
      />

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

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: UI_COLORS.textSoft,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {t("label.badge")}s
        </span>
        <BadgesEditor
          state={state}
          onChange={onChange}
          testIdPrefix={`${testIdPrefix}-badge`}
        />
      </div>

      <div
        style={{
          fontSize: 10,
          color: UI_COLORS.textMuted,
          lineHeight: 1.5,
          padding: "8px 10px",
          background: UI_COLORS.controlSurface,
          border: `1px dashed ${UI_COLORS.panelSurface}`,
          borderRadius: 6,
        }}
      >
        {t("brandIdentity.note")}
      </div>
    </div>
  );
}
