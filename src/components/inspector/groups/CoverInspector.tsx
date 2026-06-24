import type { OverlayState } from "../../../types";
import { patchSection } from "../../../lib/state";
import InspectorGroup from "../InspectorGroup";
import BrandIdentityEditor from "../BrandIdentityEditor";
import { SectionInput, ToggleButton } from "../../shared/Field";
import SocialsEditor from "../../SocialsEditor";
import { RuleNote } from "../EditorRow";
import { useLocale } from "../../../hooks/useLocale";

interface CoverInspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

export default function CoverInspector({
  state,
  onChange,
}: CoverInspectorProps) {
  const { t } = useLocale();
  const writeCover = (patch: Partial<OverlayState["cover"]>) => {
    onChange(patchSection(state, "cover", patch));
  };

  return (
    <>
      <InspectorGroup
        title={t("group.brand")}
        hint={t("group.brand.hint")}
        testId="group-cover-brand"
      >
        <BrandIdentityEditor
          state={state}
          onChange={onChange}
          testIdPrefix="cover"
          showSubtitle
          coverVisual
        />
      </InspectorGroup>

      <InspectorGroup
        title={t("group.todaysBuild")}
        hint={t("group.todaysBuild.hint")}
        testId="group-cover-today"
      >
        <SectionInput
          label={t("label.cardLabel")}
          value={state.cover.todayLabel}
          onChange={(v) => writeCover({ todayLabel: v })}
          testId="cover-today-label"
        />
        <SectionInput
          label={t("label.topic")}
          value={state.cover.todayTopic}
          onChange={(v) => writeCover({ todayTopic: v })}
          testId="cover-today-topic"
        />
        <RuleNote>{t("mapping.todayTopic")}</RuleNote>
      </InspectorGroup>

      <InspectorGroup
        title={t("group.socials")}
        hint={t("group.socials.hint")}
        testId="group-cover-socials"
        defaultOpen={false}
      >
        <ToggleButton
          label={t("toggle.showSocialCard")}
          checked={state.cover.socialVisible}
          onChange={(v) => writeCover({ socialVisible: v })}
          testId="cover-social-visible"
        />
        {state.cover.socialVisible && (
          <SocialsEditor
            state={state}
            onChange={onChange}
            testIdPrefix="cover-social"
          />
        )}
      </InspectorGroup>
    </>
  );
}
