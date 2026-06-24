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
        title={t("group.coverCopy")}
        hint={t("group.coverCopy.hint")}
        testId="group-cover-copy"
      >
        <SectionInput
          label={t("label.title")}
          value={state.cover.title}
          onChange={(v) => writeCover({ title: v })}
          testId="cover-title"
        />
        <SectionInput
          label={t("label.subtitle")}
          value={state.cover.hookText}
          onChange={(v) => writeCover({ hookText: v })}
          testId="cover-subtitle"
        />
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
        title={t("group.coverVisual")}
        hint={t("group.coverVisual.hint")}
        testId="group-cover-visual"
      >
        <BrandIdentityEditor
          state={state}
          onChange={onChange}
          testIdPrefix="cover"
          coverVisual
          showCopy={false}
        />
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
