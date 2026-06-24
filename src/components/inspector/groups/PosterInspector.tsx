import type { OverlayState } from "../../../types";
import { patchSection } from "../../../lib/state";
import InspectorGroup from "../InspectorGroup";
import BrandIdentityEditor from "../BrandIdentityEditor";
import { SectionInput, ToggleButton } from "../../shared/Field";
import SocialsEditor from "../../SocialsEditor";
import { RuleNote } from "../EditorRow";
import { useLocale } from "../../../hooks/useLocale";

interface PosterInspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

export default function PosterInspector({
  state,
  onChange,
}: PosterInspectorProps) {
  const { t } = useLocale();
  const writeCover = (patch: Partial<OverlayState["cover"]>) => {
    onChange(patchSection(state, "cover", patch));
  };

  return (
    <>
      <InspectorGroup
        title={t("group.brand")}
        hint={t("group.brand.hintAlt")}
        testId="group-poster-brand"
      >
        <BrandIdentityEditor
          state={state}
          onChange={onChange}
          testIdPrefix="poster"
        />
      </InspectorGroup>

      <InspectorGroup
        title={t("group.todaysBuild")}
        hint={t("group.todaysBuild.hint")}
        testId="group-poster-today"
      >
        <SectionInput
          label={t("label.cardLabel")}
          value={state.cover.todayLabel}
          onChange={(v) => writeCover({ todayLabel: v })}
          testId="poster-today-label"
        />
        <SectionInput
          label={t("label.topic")}
          value={state.cover.todayTopic}
          onChange={(v) => writeCover({ todayTopic: v })}
          testId="poster-today-topic"
        />
        <RuleNote>{t("mapping.todayTopic")}</RuleNote>
      </InspectorGroup>

      <InspectorGroup
        title={t("group.manifesto")}
        hint={t("group.manifesto.hint")}
        testId="group-poster-manifesto"
        defaultOpen={false}
      >
        <ToggleButton
          label={t("toggle.showManifesto")}
          checked={state.cover.manifestoVisible}
          onChange={(v) => writeCover({ manifestoVisible: v })}
          testId="poster-manifesto-visible"
        />
        {state.cover.manifestoVisible && (
          <>
            <SectionInput
              label={t("label.line1")}
              value={state.cover.manifestoLine1}
              onChange={(v) => writeCover({ manifestoLine1: v })}
              testId="poster-manifesto-1"
            />
            <SectionInput
              label={t("label.line2")}
              value={state.cover.manifestoLine2}
              onChange={(v) => writeCover({ manifestoLine2: v })}
              testId="poster-manifesto-2"
            />
            <SectionInput
              label={t("label.line3")}
              value={state.cover.manifestoLine3}
              onChange={(v) => writeCover({ manifestoLine3: v })}
              testId="poster-manifesto-3"
            />
          </>
        )}
      </InspectorGroup>

      <InspectorGroup
        title={t("group.hookText")}
        hint={t("group.hookText.hint")}
        testId="group-poster-hook"
        defaultOpen={false}
      >
        <ToggleButton
          label={t("toggle.showHookText")}
          checked={state.cover.hookVisible}
          onChange={(v) => writeCover({ hookVisible: v })}
          testId="poster-hook-visible"
        />
        {state.cover.hookVisible && (
          <SectionInput
            label={t("label.hookText")}
            value={state.cover.hookText}
            onChange={(v) => writeCover({ hookText: v })}
            testId="poster-hook-text"
          />
        )}
      </InspectorGroup>

      <InspectorGroup
        title={t("group.closingLine")}
        hint={t("group.closingLine.hint")}
        testId="group-poster-closing"
        defaultOpen={false}
      >
        <ToggleButton
          label={t("toggle.showClosingLine")}
          checked={state.cover.closingVisible}
          onChange={(v) => writeCover({ closingVisible: v })}
          testId="poster-closing-visible"
        />
        {state.cover.closingVisible && (
          <>
            <SectionInput
              label={t("label.prefix")}
              value={state.cover.closingPrefix}
              onChange={(v) => writeCover({ closingPrefix: v })}
              testId="poster-closing-prefix"
            />
            <SectionInput
              label={t("label.strikethrough")}
              value={state.cover.closingStruck}
              onChange={(v) => writeCover({ closingStruck: v })}
              testId="poster-closing-struck"
            />
            <SectionInput
              label={t("label.highlight")}
              value={state.cover.closingHighlight}
              onChange={(v) => writeCover({ closingHighlight: v })}
              testId="poster-closing-highlight"
            />
            <SectionInput
              label={t("label.suffix")}
              value={state.cover.closingSuffix}
              onChange={(v) => writeCover({ closingSuffix: v })}
              testId="poster-closing-suffix"
            />
          </>
        )}
      </InspectorGroup>

      <InspectorGroup
        title={t("group.socials")}
        hint={t("group.socials.hint")}
        testId="group-poster-socials"
        defaultOpen={false}
      >
        <ToggleButton
          label={t("toggle.showSocialInfo")}
          checked={state.cover.socialVisible}
          onChange={(v) => writeCover({ socialVisible: v })}
          testId="poster-social-visible"
        />
        {state.cover.socialVisible && (
          <SocialsEditor
            state={state}
            onChange={onChange}
            testIdPrefix="poster-social"
          />
        )}
      </InspectorGroup>
    </>
  );
}
